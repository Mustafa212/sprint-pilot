# sprint-pilot changelog

Newest first. Each entry records what changed and why, generically: no project names or ticket
numbers.

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
