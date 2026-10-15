# sprint-pilot changelog

Newest first. Each entry records what changed and why, generically: no project names or ticket
numbers.

## 1.0.0 — 2026-10-15 (first release: Azure DevOps and file sources)
- `/sprint`: reads the items assigned to you in the current sprint, runs a read-only scout per story
  (gaps with recommendations, the code it will likely touch), reads the repositories' sprint
  branches and in-flight work, and proposes a plan: grouping per story, branch names, an overlap
  matrix (conflict risks, dependencies, teammates' branches), order and workflow.
- After your OK: one worktree beside the repository per unit, a launch brief, and a Claude Desktop
  chat (or a terminal tab) running the unit's workflow.
- `/sprint status`, `/sprint cleanup`, `/sprint plan --dry-run`, `/sprint setup`.
- Sources: Azure DevOps (MCP server `@azure-devops/mcp` 2.10.0: `wit_work_item`, `wit_query`,
  `repo_pull_request` action `list`) and a Markdown file. Host: Azure Repos.
- Several Azure DevOps orgs on one machine: one MCP server per org (`ado-<org>`); every run asks
  which org it uses and records it as the run file's `Source:` line, which each launch brief carries
  so the unit's workflow uses the same server.
