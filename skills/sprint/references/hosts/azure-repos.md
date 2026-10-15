# Host: Azure Repos

*sprint-pilot adapter. Read it in step 3 when the repository's remote is on `dev.azure.com` or
`visualstudio.com`.*

Branches come from git on any host (`references/planning.md`); this adapter adds the pull requests.
The remote URL gives the org, the project and the repository: `https://[<user>@]dev.azure.com/<org>/<project>/_git/<repository>`
or `https://<org>.visualstudio.com/<project>/_git/<repository>`. Use that org's server, `ado-<org>`
(`references/sources/azure-devops.md`); when it isn't connected, the plan says "open pull requests
not checked" for the repository instead of guessing.

| Operation | How |
|---|---|
| open_prs | `repo_pull_request`, action `list`, `repositoryId: <repository>`, `project: <project>` (status defaults to Active). Each pull request has `sourceRefName`, `targetRefName` and `createdBy`. Changed files: `git diff --name-only origin/<target>...origin/<source>` (strip `refs/heads/`). |
| create_pr | Not used by `/sprint`: the unit's workflow opens the pull request (senior-dev's PR step, with `repo_pull_request_write`, action `create`, `workItems` set to the story's id). |
