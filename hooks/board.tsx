// The sprint board: a pane in the sprint lead's session showing where every unit stands, read from
// the run files, each unit's senior-dev state and its background session. While it is open it
// refreshes every half minute, says when a unit starts waiting for the user, hands this session
// each question a unit asks (`/sprint answer`) and each unit whose pull request merged
// (`/sprint cleanup`). In a unit's own session it wakes the unit once the user's answer is written.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { SprintPilotUnit } from '../types'

const PANE = 'sprint-board'
const TITLE = 'Sprint board'
const REFRESH_MS = 30_000
// Pull requests are looked up on every tenth refresh: each lookup is a call to the host.
const PR_CHECK_EVERY = 10
const QUESTION = /^## (Q-\d+)\s*[—-]?\s*(.*?)\s*(?:\([^)]*\))?\s*$/gm
const ANSWER = /^## (A-\d+) → (Q-\d+)/gm
const SHOWN = new Set(['planned', 'queued', 'stacked', 'held', 'launched', 'done'])

const units = atom({ plugin: 'sprint-pilot', key: 'units' } as const, [] as SprintPilotUnit[])
const refreshedAt = atom({ plugin: 'sprint-pilot', key: 'refreshedAt' } as const, '')

type Agent = { id: string; cwd: string; kind: string; state: string }

/** The local data folder, as the sprint skill defines it. */
async function home($: EngineInterface): Promise<string> {
  const custom = await $.env.get('SPRINT_PILOT_HOME')
  if (custom) return custom
  const user = (await $.env.get('USERPROFILE')) ?? (await $.env.get('HOME')) ?? '~'
  return `${user}/.claude/sprint-pilot`
}

const normal = (path: string) => path.replace(/\\/g, '/').replace(/\/$/, '').toLowerCase()

/** The cells of each unit row in a run file's table. */
export function tableRows(text: string): string[][] {
  const lines = text.split(/\r?\n/)
  const head = lines.findIndex(line => line.startsWith('| Unit |'))
  if (head < 0) return []
  const rows: string[][] = []
  for (const line of lines.slice(head + 2)) {
    if (!line.startsWith('|')) break
    rows.push(line.split('|').slice(1, -1).map(cell => cell.trim()))
  }
  return rows
}

/** A `Name: value` field of a senior-dev state file; several share a line, two spaces apart. */
function field(text: string, name: string): string {
  return new RegExp(`(?:^|\\s)${name}:[ \\t]*(.+?)(?:\\s{2,}|$)`, 'm').exec(text)?.[1] ?? ''
}

/** What the newest senior-dev state file in a worktree says. */
async function runState($: EngineInterface, worktree: string) {
  const dir = `${worktree}/.ai-session/senior-dev`
  const entries = await $.fs.list(dir).catch(() => [])
  const newest = entries
    .filter(entry => entry.kind === 'file' && entry.name.endsWith('.md'))
    .sort((a, b) => b.mtimeMs - a.mtimeMs)[0]
  if (newest === undefined) return undefined
  const text = await $.fs.read(`${dir}/${newest.name}`).catch(() => '')
  return { phase: field(text, 'Phase'), next: field(text, 'NEXT'), waiting: field(text, 'Waiting'), pr: field(text, 'PR') }
}

/** The questions a unit asked (`.ai-session/questions.md`) that `answers.md` doesn't answer yet. */
export function openQuestions(questions: string, answers: string): { id: string; title: string }[] {
  const answered = new Set([...answers.matchAll(ANSWER)].map(match => match[2]))
  return [...questions.matchAll(QUESTION)]
    .map(match => ({ id: match[1], title: match[2] }))
    .filter(question => !answered.has(question.id))
}

/** A unit's open questions, read from its worktree. */
async function asked($: EngineInterface, worktree: string) {
  const questions = await $.fs.read(`${worktree}/.ai-session/questions.md`).catch(() => '')
  if (!questions) return []
  return openQuestions(questions, await $.fs.read(`${worktree}/.ai-session/answers.md`).catch(() => ''))
}

/** The background sessions `claude agents` lists, or none when it can't run. */
async function agents($: EngineInterface): Promise<Agent[]> {
  const ran = await $.process.run(['claude', 'agents', '--json'], { timeoutMs: 20_000 }).catch(() => undefined)
  if (ran === undefined || ran.exitCode !== 0) return []
  try {
    return JSON.parse(ran.stdout) as Agent[]
  } catch {
    return []
  }
}

/** Whether a GitHub pull request has merged; other hosts are left to `/sprint status`. */
async function isMerged($: EngineInterface, pr: string): Promise<boolean> {
  if (!/^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(pr)) return false
  const ran = await $.process
    .run(['gh', 'pr', 'view', pr, '--json', 'state', '--jq', '.state'], { timeoutMs: 20_000 })
    .catch(() => undefined)
  return ran?.exitCode === 0 && ran.stdout.trim() === 'MERGED'
}

/** The board as Markdown: one table per run. */
export function board(list: readonly SprintPilotUnit[], at: string): string {
  if (list.length === 0) return 'No sprint units in play. `/sprint` plans the next ones.'
  const cell = (text: string, max = 60) =>
    (text.length > max ? `${text.slice(0, max - 1)}…` : text).replace(/\|/g, '\\|') || '—'
  const out: string[] = []
  for (const run of new Set(list.map(unit => unit.run))) {
    out.push(`**${run}**`, '', '| Unit | Status | Phase | Waiting on you | Next | PR | Session |', '|---|---|---|---|---|---|---|')
    for (const u of list.filter(unit => unit.run === run)) {
      const waiting = u.waiting ? `**${cell(u.waiting, 40)}**` : '—'
      const pr = u.pr ? `[PR](${u.pr})` : '—'
      out.push(`| ${cell(u.unit, 24)} | ${u.status} | ${cell(u.phase, 24)} | ${waiting} | ${cell(u.next)} | ${pr} | ${cell(u.session, 30)} |`)
    }
    out.push('')
  }
  out.push(`Updated ${at}. A background unit opens with \`claude attach <id>\`.`)
  return out.join('\n')
}

// What the last refresh found, so a unit that starts waiting is announced once.
let previous = new Map<string, SprintPilotUnit>()
let refreshes = 0
// The merged units and the open questions the last refresh found, for the timer to hand over.
let merged: SprintPilotUnit[] = []
let questioned: { run: string; unit: string; questions: { id: string; title: string }[] }[] = []

async function refresh($: EngineInterface): Promise<void> {
  if (!(await $.ui.panes()).some(pane => pane.id === PANE)) return
  const root = await home($)
  const files = (await $.fs.list(`${root}/runs`).catch(() => [])).filter(
    entry => entry.kind === 'file' && entry.name.endsWith('.md'),
  )
  const sessions = await agents($)
  const checkPrs = refreshes++ % PR_CHECK_EVERY === 0
  const list: SprintPilotUnit[] = []
  const found: SprintPilotUnit[] = []
  const asking: typeof questioned = []
  for (const file of files) {
    const run = file.name.replace(/\.md$/, '')
    const rows = tableRows(await $.fs.read(`${root}/runs/${file.name}`).catch(() => ''))
    for (const [unit = '', story = '', , , worktree = '', , status = '', prCell = ''] of rows) {
      if (!SHOWN.has(status)) continue
      const launched = status === 'launched' && worktree !== ''
      const state = launched ? await runState($, worktree) : undefined
      const questions = launched ? await asked($, worktree) : []
      if (questions.length > 0) asking.push({ run, unit, questions })
      const agent = worktree ? sessions.find(one => normal(one.cwd) === normal(worktree)) : undefined
      const asks = questions.length > 0
        ? questions.map(question => `${question.id} ${question.title}`).join('; ')
        : state?.waiting.startsWith('yes') ? state.waiting.replace(/^yes\s*[—-]?\s*/, '') || 'yes' : ''
      const pr = prCell || (state && state.pr !== 'none' ? state.pr : '')
      const row: SprintPilotUnit = {
        run,
        unit,
        story,
        status,
        phase: state?.phase || '—',
        next: state?.next ?? '',
        waiting: asks || (agent?.state === 'blocked' ? 'a question or a permission' : ''),
        pr,
        session: agent ? `${agent.id} (${agent.state})` : '',
      }
      list.push(row)
      if (status === 'done' || (checkPrs && status === 'launched' && pr && (await isMerged($, pr)))) found.push(row)
    }
  }

  for (const row of list) {
    const before = previous.get(`${row.run}/${row.unit}`)
    if (row.waiting && before !== undefined && !before.waiting) $.ui.toast(`${row.unit} waits for you: ${row.waiting}`)
  }
  previous = new Map(list.map(row => [`${row.run}/${row.unit}`, row]))
  const running = list.filter(row => row.status === 'launched').length
  const waiting = list.filter(row => row.waiting).length
  $.ui.status(running || waiting ? `sprint: ${running} running · ${waiting} waiting for you` : undefined)

  merged = found
  questioned = asking
  await update($, units, () => list)
  const now = new Date(await $.clock.now())
  await update($, refreshedAt, () => now.toTimeString().slice(0, 5))
}

/** Hands each merged unit to the session once: the cleanup itself is the sprint skill's. */
async function handOverMerged($: EngineInterface): Promise<void> {
  const asked = new Set(((await $.store.get('cleanupAsked')) as string[] | undefined) ?? [])
  const fresh = merged.filter(row => !asked.has(`${row.run}/${row.unit}`))
  if (fresh.length === 0) return
  const names = fresh.map(row => `${row.unit} (${row.run})`).join(', ')
  await $.store.set('cleanupAsked', [...asked, ...fresh.map(row => `${row.run}/${row.unit}`)])
  void $.prompt.submit({
    text: `sprint-pilot board: the pull request of ${names} has merged. Run /sprint cleanup for it: a merged unit is cleaned up without asking.`,
  }).catch(() => undefined) // /sprint status still finds the unit done
}

/** Hands each question a unit asks to this session once: `/sprint answer` relays the user's reply. */
async function handOverQuestions($: EngineInterface): Promise<void> {
  const done = new Set(((await $.store.get('questionsAsked')) as string[] | undefined) ?? [])
  const fresh = questioned
    .map(entry => ({ ...entry, questions: entry.questions.filter(q => !done.has(`${entry.run}/${entry.unit}/${q.id}`)) }))
    .filter(entry => entry.questions.length > 0)
  if (fresh.length === 0) return
  const keys = fresh.flatMap(entry => entry.questions.map(q => `${entry.run}/${entry.unit}/${q.id}`))
  await $.store.set('questionsAsked', [...done, ...keys])
  const what = fresh
    .map(entry => `${entry.unit} (${entry.run}) asks ${entry.questions.map(q => `${q.id} ${q.title}`).join(', ')}`)
    .join('; ')
  void $.prompt.submit({
    text: `sprint-pilot board: ${what}. Run /sprint answer to show the user each question and relay the user's own reply.`,
  }).catch(() => undefined) // the board still shows the question
}

/**
 * In a unit's own session (its brief says `Answers: sprint-lead`): once the unit waits and the
 * user's answer has been written to `.ai-session/answers.md`, start a turn that tells it so.
 */
async function wakeOnAnswers($: EngineInterface): Promise<void> {
  const brief = await $.fs.read('.ai-session/launch.md').catch(() => '')
  if (!/^Answers:\s*sprint-lead\b/m.test(brief)) return
  const state = await runState($, '.')
  if (!state?.waiting.startsWith('yes')) return
  const answers = [...(await $.fs.read('.ai-session/answers.md').catch(() => '')).matchAll(ANSWER)]
  const key = `answersWoken:${normal(await $.session.cwd())}`
  const woken = new Set(((await $.store.get(key)) as string[] | undefined) ?? [])
  const fresh = answers.filter(match => !woken.has(match[1]))
  if (fresh.length === 0) return
  await $.store.set(key, [...woken, ...fresh.map(match => match[1])])
  const which = fresh.map(match => `${match[1]} → ${match[2]}`).join(', ')
  void $.prompt.submit({
    text: `sprint-pilot: the user's answer is in .ai-session/answers.md (${which}), written from the user's reply in the sprint session. Read it and go on.`,
  }).catch(() => undefined) // the next beat tries again only for newer answers
}

/** One beat of the board's timer. */
async function tick($: EngineInterface): Promise<void> {
  await refresh($)
  await handOverMerged($)
  await handOverQuestions($)
  await wakeOnAnswers($)
}

async function open($: EngineInterface): Promise<void> {
  await $.ui.open({ id: PANE, title: TITLE })
  await refresh($)
}

// The sprint skill writes the run file when the user approves a plan and at each launch: the
// board opens in that session by itself.
async function openOnRunFile($: EngineInterface, path: unknown): Promise<void> {
  const runs = `${normal(await home($))}/runs/`
  if (typeof path === 'string' && normal(path).startsWith(runs) && !normal(path).slice(runs.length).includes('/')) {
    await open($)
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'sprint-board', description: 'Show where every sprint unit stands' })
    $.clock.every(REFRESH_MS, () => void tick($))
    return next(e)
  })

  on('command.run', { command: 'sprint-board' }, async $ => {
    await open($)
    return { text: 'Sprint board opened.' }
  })

  on('tool.call', { tool: 'Write' }, async ($, e, next) => {
    const result = await next(e)
    await openOnRunFile($, e.file_path)
    return result
  }).catch(($, e, next) => next(e))
  on('tool.call', { tool: 'Edit' }, async ($, e, next) => {
    const result = await next(e)
    await openOnRunFile($, e.file_path)
    return result
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Markdown } = $.ui.resolve(e)
    return <Markdown text={board(await read($, units), await read($, refreshedAt))} />
  })
}
