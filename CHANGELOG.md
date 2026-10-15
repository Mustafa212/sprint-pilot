# sprint-pilot changelog

Newest first. Each entry records what changed and why, generically: no project names or ticket
numbers.

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
