import { expect, mock, test } from 'claude-code/testing'

// POSIX-style paths, absolute on every OS (a Windows engine may put a drive before them).
const HOME = '/home/sp'
const WT = '/src/shop.worktrees/feat-1'
const RUN = [
  '# Sprint 7 — shop (started 2026-10-25)',
  '| Unit | Story | Repo | Branch ← base | Worktree | Workflow | Status | PR | Launched | Session |',
  '|---|---|---|---|---|---|---|---|---|---|',
  `| u1 | 1 Export | /src/shop | feat/1 ← main | ${WT} | senior-dev | launched | | 2026-10-25 | |`,
  '| u2 | 2 Import | /src/shop | feat/2 ← main | | senior-dev | queued | | | |',
  '| u0 | 0 Old | /src/shop | feat/0 ← main | | senior-dev | cleaned | https://github.com/o/r/pull/1 | 2026-10-20 | |',
  'Queue: u2 (waits for u1)',
].join('\n')
const STATE = '# 1 — Export\nPhase: 2 — Plan   Last updated: x\nNEXT: wait for the plan approval\nWaiting: yes — plan approval   Base: main   PR: none\n'
const RUN_FILE = `${HOME}/runs/shop-sprint-7.md`

// The engine beneath the plugin: a data folder with one run, a unit with a senior-dev state, one
// background session that is blocked, and a session that records the prompts it is handed.
function engine(on: any, run = RUN, extra: Record<string, string> = {}, cwd = '/') {
  const files: Record<string, string> = { [RUN_FILE]: run, [`${WT}/.ai-session/senior-dev/1.md`]: STATE, ...extra }
  // The session's own `.ai-session/…` paths (relative, or resolved against wherever the test runs)
  // stand for the same paths under `cwd`.
  const norm = (p: string) => p.replace(/\\/g, '/').replace(/^[A-Za-z]:/, '')
  const dirOf = (k: string) => k.slice(0, k.lastIndexOf('/'))
  const local = (p: string) => {
    const n = norm(p)
    if (files[n] !== undefined || Object.keys(files).some(k => dirOf(k) === n)) return n
    const at = n.lastIndexOf('.ai-session')
    return at < 0 ? n : `${cwd.replace(/\/$/, '')}/${n.slice(at)}`
  }
  const find = (p: string) => (files[local(p)] === undefined ? undefined : local(p))
  const seen = { prompts: [] as string[], opened: 0 }
  mock.env(on, { SPRINT_PILOT_HOME: HOME })
  mock.store(on)
  const clock = mock.clock(on)
  on('fs.list', (_: unknown, e: { path: string }) => {
    const dir = local(e.path)
    const names = Object.keys(files).filter(k => dirOf(k) === dir)
    return { value: names.map(p => ({ name: p.split('/').pop(), kind: 'file', size: 1, mtimeMs: 1, isLink: false })) }
  })
  on('fs.read', (_: unknown, e: { path: string }) => {
    const key = find(e.path)
    return key === undefined ? { deny: 'ENOENT' } : { value: files[key] }
  })
  on('session.cwd', () => ({ value: cwd }))
  on('process.run', () => ({
    value: {
      exitCode: 0,
      stdout: JSON.stringify([{ id: 'ab12', cwd: WT, kind: 'background', state: 'blocked' }]),
      stderr: '',
      isStdoutTruncated: false,
      isStderrTruncated: false,
    },
  }))
  on('ui.open', () => {
    seen.opened++
    return { value: { isPlaced: true } }
  })
  on('ui.panes', () => ({ value: seen.opened ? [{ id: 'sprint-board', title: 'Sprint board', isShown: true }] : [] }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  on('command.register', () => ({ value: { command: 'sprint-board' } }))
  on('session.start', (_: unknown, e: { cwd: string }) => ({ cwd: e.cwd }))
  on('prompt.submit', (_: unknown, e: { text: string }) => {
    seen.prompts.push(e.text)
    return { text: e.text }
  })
  on('tool.call', () => ({ result: {} }))
  return { seen, clock }
}

const PANE = {
  plugin: 'sprint-pilot',
  component: 'Pane',
  requestId: 'sprint-board',
  props: { title: 'Sprint board', isFocused: false, bodyColumns: 100, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} },
} as const

test('writing the run file opens the board, with each unit where it stands', async ($, on) => {
  const { seen } = engine(on)
  await $.tool.call({ tool: 'Write', file_path: RUN_FILE, content: RUN })

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    const md = await ui.find({ type: 'Markdown' })
    expect(md?.text).toContain('| u1 | launched | 2 — Plan | **plan approval** |')
    expect(md?.text).toContain('ab12 (blocked)')
    expect(md?.text).toContain('| u2 | queued |')
    expect(md?.text).not.toContain('u0')
    await ui.unmount()
  }
  expect(seen.opened).toBe(1)
})

test('a merged unit is handed to the session for cleanup once, from the timer', async ($, on) => {
  const { seen, clock } = engine(on, RUN.replace('| senior-dev | launched |', '| senior-dev | done |'))
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.tool.call({ tool: 'Write', file_path: RUN_FILE, content: '' })
  expect(seen.prompts).toEqual([])

  await clock.advance(30_000)
  await clock.advance(30_000)
  expect(seen.prompts.length).toBe(1)
  expect(seen.prompts[0]).toContain('u1 (shop-sprint-7)')
  expect(seen.prompts[0]).toContain('/sprint cleanup')
})

test('a write outside the runs folder leaves the board closed', async ($, on) => {
  const { seen } = engine(on)
  await $.tool.call({ tool: 'Write', file_path: `${HOME}/runs/shop-sprint-7/briefs/u1.md`, content: '' })
  await $.tool.call({ tool: 'Write', file_path: '/src/shop/README.md', content: '' })
  expect(seen.opened).toBe(0)
})

const QUESTIONS = [
  '# Questions from u1',
  '## Q-1 — AC and plan (2026-10-25 10:00)',
  'The plan…',
  'Options: approve (recommended) | change',
  '',
].join('\n')

test('a question a unit asks is handed to the sprint session once', async ($, on) => {
  const { seen, clock } = engine(on, RUN, { [`${WT}/.ai-session/questions.md`]: QUESTIONS })
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.tool.call({ tool: 'Write', file_path: RUN_FILE, content: '' })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect((await ui.find({ type: 'Markdown' }))?.text).toContain('**Q-1 AC and plan**')
  await ui.unmount()

  await clock.advance(30_000)
  await clock.advance(30_000)
  expect(seen.prompts.length).toBe(1)
  expect(seen.prompts[0]).toContain('u1 (shop-sprint-7) asks Q-1 AC and plan')
  expect(seen.prompts[0]).toContain('/sprint answer')
})

test("in the unit's own session, the user's answer wakes it once", async ($, on) => {
  const unit = {
    '/unit/.ai-session/launch.md': '# Launch brief — u1\nApprovals: user\nAnswers: sprint-lead\n',
    '/unit/.ai-session/senior-dev/1.md': STATE,
    '/unit/.ai-session/questions.md': QUESTIONS,
    '/unit/.ai-session/answers.md': '## A-1 → Q-1 (2026-10-25 10:05, the user in the sprint session)\nموافق\n',
  }
  const { seen, clock } = engine(on, RUN, unit, '/unit')
  await $.session.start({ cwd: '/unit', surface: 'terminal', isInteractive: false })
  await clock.advance(30_000)
  await clock.advance(30_000)
  expect(seen.prompts.length).toBe(1)
  expect(seen.prompts[0]).toContain('A-1 → Q-1')
})

test("without the brief's opt-in, an answers file wakes nothing", async ($, on) => {
  const unit = {
    '/unit/.ai-session/launch.md': '# Launch brief — u1\nAnswers: unit\n',
    '/unit/.ai-session/senior-dev/1.md': STATE,
    '/unit/.ai-session/answers.md': '## A-1 → Q-1 (x)\nموافق\n',
  }
  const { seen, clock } = engine(on, RUN, unit, '/unit')
  await $.session.start({ cwd: '/unit', surface: 'terminal', isInteractive: false })
  await clock.advance(30_000)
  expect(seen.prompts).toEqual([])
})
