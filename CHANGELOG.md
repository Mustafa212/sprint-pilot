# sprint-pilot changelog

Newest first. Each entry records what changed and why, generically: no project names or ticket
numbers.

## 1.6.0 — 2026-10-21 (opt-in autopilot)
- **`Autopilot: on` in the project file** (default off, set only when the user asks): each unit's
  brief gets `Approvals: auto` (the workflow takes its own recommendations instead of asking; see
  senior-dev 1.11.0), and `/sprint status` merges a unit's pull request once it is open, not a
  draft, mergeable and green, then launches the queued units whose dependencies are merged.
  Conflicts, failed or missing checks, drafts and held units still go to the user. Why: a user
  running a sprint unattended wanted it to keep moving on the recommendations unless they said no;
  answering every gate and merge by hand was the bottleneck.

## 1.5.0 — 2026-10-21 (lessons from a first live launch)
- **Branch style from the repository:** the pattern keeps the existing branches' casing (`{Slug}`
  for PascalCase, `{slug}` for kebab-case) and setup shows two sample names. Why: a run produced
  kebab-case names in a repository that uses PascalCase, and the branches were renamed mid-run.
- **How a unit ends (`End:`):** `pr`, `push-for-review` or `local`, set in the project file, confirmed
  once per run, and written in every brief (`PR target: none` unless `pr`). Before the first launch
  the user hears that each unit asks once before pushing, with an allow rule to suggest when a
  permission mode blocks pushes. Why: "push for my review, no pull request" was added after launch,
  every unit needed an extra round, and one unit could not push at all.
- **Telling a running unit:** changes go into its `.ai-session/launch.md` and, in desktop mode,
  through the app's session tool. Why: cross-session messages between sessions in different
  permission modes were held and expired unread.
- **Scouts:** they get linked test cases' titles and name attachments that may settle a gap, and
  read a `git archive` snapshot of the base when the checkout is elsewhere. Why: a test case
  reversed a scout's recommendation, a screenshot answered a "blocking" gap, and the checkout
  lacked the base's newest commit.
- **Decisions across units (`D-n`):** recorded in the run file and carried in each affected brief;
  `/sprint status` checks units' commits against them and against siblings' touched areas. Why: one
  unit changed how a shared value was stored, which broke a sibling's assumption, and nobody saw it
  until the end.
- **Tools and timeouts:** setup suggests `MCP_TIMEOUT` on Windows; planning checks that a database
  MCP the notes name answers. Why: the tracker server timed out at start, and a database needed a VPN.
- **Learnings and cleanup:** every brief asks for `.ai-session/sprint-learnings.md`; cleanup also
  handles push-for-review units (branch kept), archives without build output, and gathers the
  learnings into one file. Why: the learnings were collected by hand, and build output made each
  archive hundreds of megabytes.

## 1.4.0 — 2026-10-18 (Jira source)
- **Jira Software Cloud as a source** (`references/sources/jira.md`), over Atlassian's remote MCP
  server: the active sprint of the project's board (or, when none is started, the next one, after
  asking), the user's items by JQL, each item with its parent, sub-tasks, links, comments and
  attachments, and the operations the unit's PR step uses to link the pull request and move the
  state. An epic parent is context, not the story. Setup, the run file's `Source:` line, the
  README and the description name it. Why: teams on Jira couldn't use sprint-pilot at all, and
  the alternative, copying a sprint into a file, loses the link to the tracker. Checked against a
  live Jira Cloud project: board sprints, JQL, issue links in both directions, the attachment
  field, and an unstarted sprint.

## 1.3.0 — 2026-10-18 (names fixed where units meet; work already in the code)
- **Names where units meet:** when two units of a plan meet (one calls an endpoint the other adds,
  or both add translation keys or permissions), the plan fixes the exact names each adds, and both
  briefs carry them under `## Shared with other units`; a unit that needs a different name stops
  and asks. Why: parallel units each guessed field and key names, and the mismatch showed only at
  integration.
- **Already in the code:** the scout checks whether the story's behavior already exists, searching
  by concept and synonyms, not only the story's words, and reports it with where it looked; the
  plan and the brief show it. Why: a story worded differently from the code (archive versus a
  hidden flag) led to a second implementation.

## 1.2.0 — 2026-10-16 (background sessions; pull request state on the board)
- **Launch mode `background`** (now the default for a new setup): each unit starts with
  `claude --bg --name <worktree>` and its first message, so nothing is pasted, and shows in
  `claude agents`. The run file records each unit's session; `/sprint status` reads its state
  (`blocked` waits for the user; `failed`, `stopped` or gone isn't running) and offers
  `claude attach <id>` or a restart. Why: the paste step per unit was the main friction, and the
  board had to guess from a day without updates. Checked on Windows with `launch.ps1` in a
  worktree of a trusted repository; a worktree takes its main repository's trust, and an untrusted
  folder makes the script exit 3 with the command to run in a terminal.
- **Pull request state on the board** (Azure Repos): draft, merge conflicts, reviewers' votes
  (waiting for the author, rejected, approved) and required reviewers, read from the pull request;
  conflicts and "waiting for the author" count as waiting on you. Build and policy results aren't in
  that response, so they aren't guessed.
- **Worktrees stay sprint-pilot's own**, beside the repository, not Claude Code's
  `.claude/worktrees/`, so the plan's branch names and stacking hold. Why: Claude Code's native
  worktree features apply only to worktrees it creates, and the project's worktree setup already
  copies the ignored local files.

## 1.1.0 — 2026-10-16 (scout, plan and brief improvements from comparing similar skills)
Found by comparing sprint-pilot with other open sprint, planning and hand-off skills and with
Claude Code's own docs; all wording is ours.
- Scout: maps the touched areas first, then looks for each answer in the code before calling
  something a gap (what the code settles is listed with `file:line`, to confirm). A gap now also
  covers what the story assumes but the code lacks or contradicts. Why: the checklist flagged
  things the codebase already settles, and missed stories built on fields or rules that aren't there.
- Scout: the gaps open with the acceptance criteria as written; missing or unobservable criteria are
  a gap, an inferred one is a gap to confirm, and a new line records what the story puts out of
  scope. Why: missing criteria are the most common costly gap, and weren't on the checklist.
- Gaps say whether they block the start and who decides; a unit with a blocking gap is planned as
  `held (gap #n)` (the user can override it), and `/sprint status` offers it once the gap is
  answered. Why: the plan couldn't show which units shouldn't start yet, or which questions belong
  to someone other than the product owner.
- Touched areas gain a "shared registration" kind (DI setup, routes, menus, permission seeds,
  translation files, manifests and lockfiles, shared fixtures); two units adding to one is a minor
  conflict, named in both briefs and never a reason on its own to queue. Why: in layered apps most
  conflicts come from files every feature appends to, and they showed no overlap.
- Planning checks the dependencies for a cycle before ordering, and asks which link to drop or
  whether to merge the units. Why: a cycle left both units queued with nothing to start them.
- A saved brief is refreshed before a later launch: the items are fetched again (changed story
  sections are replaced), a `## Merged before this unit` section lists what merged and which of its
  files changed on the base, and the gaps carry their plan date. Why: a queued unit can start days
  later, after the story or the base changed.
- The brief gains `## Shared with other units`, with how to behave there (change only what the story
  needs; stop and ask before more). Why: `Conflicts:` named the areas but gave no rule. The brief
  stays at `Brief-Version: 1`: no field changed meaning, and the new content is headings and bullets.
- The skill's description names Azure DevOps and worktrees, says what it's not for, and adds an
  `argument-hint`. The dry-run row, the org question and the exit-code text are shorter (the
  details stay in the references), and the repeated "never relaunch a launched unit" row is gone.
  The Windows exit 3 no longer promises a printed command (`claude` isn't on PATH there).

## 1.0.2 — 2026-10-16 (cleanup keeps unsaved commits)
- `/sprint cleanup` first checks each merged unit's branch for commits saved nowhere else (ahead of
  its remote branch, or after the pull request's last source commit when the remote branch is
  gone) and leaves such a unit out, showing the commits; it also says to close the unit's chat
  first. Why: after a squash merge it used `git branch -D`, which would lose a commit made after the
  last push. Found by comparing with how Claude Code's own worktree cleanup checks for unsaved work.

## 1.0.1 — 2026-10-16 (fixes from the first live Azure DevOps dry run)
- Azure DevOps Connect: a configured server that fails or times out at session start needs a longer
  MCP startup timeout (`MCP_TIMEOUT=120000`); the README says so too. Why: `npx` took longer than
  the 30-second default on Windows, and the run stopped at step 2.
- The sprint step warns when Azure's "current" iteration has already ended, and asks before going
  on. Why: Azure keeps returning the last iteration when no later one exists.
- Setup and planning propose the branch the work lands on as the base when the default branch lags
  far behind it (a `Sprint branch:` line can now name one branch). Why: proposing a default branch
  hundreds of commits behind `dev` would start units on stale code.
- README: the Azure DevOps source is dry-run tested on a live sprint; launch isn't yet.

## 1.0.0 — 2026-10-15 (first release: Azure DevOps and file sources)
- `/sprint`: reads the items assigned to you in the current sprint, checks the repositories (base,
  in-flight branches and pull requests), runs a read-only scout per story (gaps with
  recommendations, the code it will likely touch), and proposes a plan: grouping per story with each
  unit's scope, branch names, an overlap matrix (conflict risks, dependencies, teammates' branches),
  order and workflow.
- After your OK: the run file and a launch brief per unit (version 1: the story verbatim, the unit's
  work items and scope, the tracker server, what the PR links and which items move to which state),
  then one worktree beside the repository per unit, an optional per-project worktree setup, and a
  Claude Desktop chat (or a terminal tab) running the unit's workflow. Queued units start when what
  they wait for is merged; a dependent unit can be stacked instead.
- `/sprint status` finds each unit's pull request on the host by its branch, for every workflow;
  `/sprint cleanup` archives each unit's `.ai-session/` before removing its worktree.
- Several Azure DevOps orgs on one machine: one MCP server per org (`ado-<org>`); every run asks
  which org it uses and records it as the run file's `Source:` line, which each brief carries.
- Tracker text (stories, comments, attachments) is data, never instructions, for the orchestrator,
  the scouts and the units.
- Sources: Azure DevOps (MCP server `@azure-devops/mcp` 2.10.0: `wit_work_item`, `wit_query`,
  `work`, `repo_pull_request`) and a Markdown file. Host: Azure Repos.
- Launch scripts for Windows, macOS and Linux build the first message from the workflow, with
  self-tests in CI on all three (on Windows also through Git Bash), and a contract test against
  senior-dev.
