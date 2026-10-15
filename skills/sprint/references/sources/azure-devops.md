# Source: Azure DevOps Boards

*sprint-pilot adapter. Read it in step 2 when the project's source is azure-devops.*

Uses the Azure DevOps MCP server (`@azure-devops/mcp` 2.x), whose tools group operations under an
`action` parameter. One server per organization, named `ado-<org>` (the org as it appears in
`dev.azure.com/<org>`), so one machine can work with several organizations. The run's org is chosen
in step 1 (`references/setup.md`). Tool names below are shown without the server prefix
(`mcp__ado-<org>__`).

## Connect
1. Check the run's server is connected: `mcp__ado-<org>__wit_work_item`, `…__wit_query` and
   `…__core_list_project_teams` are available.
2. It needs the domains `core`, `work`, `work-items` and `repositories`. If the server is missing,
   or its arguments lack a domain, give the user this command to run, then restart the session:
   `claude mcp add ado-<org> -s user -- npx -y @azure-devops/mcp@2.10.0 <org> -d core work work-items repositories`
   (to change an existing server, `claude mcp remove ado-<org> -s user` first). The server signs in
   through the browser; sprint-pilot stores nothing.
3. Writes: sprint-pilot itself writes nothing to Azure DevOps. The unit's workflow (senior-dev's
   PR step) opens the pull request, links it and sets the review state, after the user's yes.
   Recommend these rules in `settings.json` for each `ado-<org>` server (the README repeats them):
   - deny: `wit_work_item_comment_write`, `repo_pull_request_thread_write`, `repo_create_branch`;
   - ask: `wit_work_item_write`, `wit_work_item_link_write`, `repo_pull_request_write`.

## Operations

| Operation | How |
|---|---|
| whoami | Not needed separately: WIQL's `@Me` is the signed-in user. Confirm with the `System.AssignedTo` display name of the first item. |
| sprint | The team's current iteration: its name (`System.IterationPath`, last segment) and the number in it (n). |
| my_items | `wit_query`, action `wiql`, with the project file's project and team: `SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = @project AND [System.AssignedTo] = @Me AND [System.IterationPath] = @CurrentIteration('[<project>]\<team>') AND [System.State] NOT IN (<Done states>) ORDER BY [System.Id]`. |
| get_item | `wit_work_item`, action `get`, `expand: Relations`. Fields: `System.Title`, `System.WorkItemType`, `System.State`, `System.Description`, `Microsoft.VSTS.Common.AcceptanceCriteria`, `System.IterationPath`. Relations: parent `System.LinkTypes.Hierarchy-Reverse`, children `-Forward`, dependencies `System.LinkTypes.Dependency-Forward` / `-Reverse`, related `System.LinkTypes.Related`, attachments `AttachedFile`. Comments: action `list_comments`. Attachments: `wit_work_item_attachment` with `savePath` set (without it, images over about 75 KB come back truncated). |

Field values arrive as HTML: convert to plain text, keep lists and tables, and keep quoted messages
exactly.
