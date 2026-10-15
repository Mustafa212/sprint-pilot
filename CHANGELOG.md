# sprint-pilot changelog

Newest first. Each entry records what changed and why, generically: no project names or ticket
numbers.

## Unreleased
- Azure DevOps source and Azure Repos host. Tool names and parameters checked against
  `@azure-devops/mcp` 2.10.0 (`wit_work_item`, `wit_query`, `repo_pull_request` action `list`,
  `repo_pull_request_write` action `create`).
- Several Azure DevOps orgs on one machine: one MCP server per org (`ado-<org>`); every run asks
  which org it uses and records it as the run file's `Source:` line, which each launch brief carries
  so the unit's workflow uses the same server.
