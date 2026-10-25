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
function engine(on: any, run = RUN) {
  const files: Record<string, string> = { [RUN_FILE]: run, [`${WT}/.ai-session/senior-dev/1.md`]: STATE }
  const norm = (p: string) => p.replace(/\\/g, '/').replace(/^[A-Za-z]:/, '')
  const seen = { prompts: [] as string[], opened: 0 }
  mock.env(on, { SPRINT_PILOT_HOME: HOME })
  mock.store(on)
  const clock = mock.clock(on)
  on('fs.list', (_: unknown, e: { path: string }) => {
    const dir = norm(e.path)
    const names = Object.keys(files).filter(p => p.startsWith(`${dir}/`) && !p.slice(dir.length + 1).includes('/'))
    return { value: names.map(p => ({ name: p.split('/').pop(), kind: 'file', size: 1, mtimeMs: 1, isLink: false })) }
  })
  on('fs.read', (_: unknown, e: { path: string }) => ({ value: files[norm(e.path)] }))
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

  await clock.advance(60_000)
  await clock.advance(60_000)
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
