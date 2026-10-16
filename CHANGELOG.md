# sprint-pilot changelog

Newest first. Each entry records what changed and why, generically: no project names or ticket
numbers.

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
