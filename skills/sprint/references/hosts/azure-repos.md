# Host: Azure Repos

*sprint-pilot adapter. Read it in step 3, and for `/sprint status`, when the repository's remote is
on `dev.azure.com` or `visualstudio.com`.*

Branches come from git on any host (`references/planning.md`); this adapter adds the pull requests.
The remote URL gives the org, the project and the repository (decode `%20` and the like):
- `https://[<user>@]dev.azure.com/<org>/<project>/_git/<repository>`
- `https://<org>.visualstudio.com/<project>/_git/<repository>`
- `git@ssh.dev.azure.com:v3/<org>/<project>/<repository>`
- `<org>@vs-ssh.visualstudio.com:v3/<org>/<project>/<repository>`

Use that org's server, `ado-<org>` (`references/sources/azure-devops.md`), even when the run's
tracker is another org. When it isn't connected, say "pull requests not checked" for the repository
instead of guessing.

| Operation | How |
|---|---|
| open_prs | `repo_pull_request`, action `list`, `repositoryId: <repository>`, `project: <project>` (status defaults to Active). Each pull request has `sourceRefName`, `targetRefName` and `createdBy`. Changed files: `git diff --name-only origin/<target>...origin/<source>` (strip `refs/heads/`). |
| find_pr | `repo_pull_request`, action `list`, `repositoryId`, `project`, `sourceRefName: refs/heads/<branch>`, `status: All`; the newest one. Its URL: `https://dev.azure.com/<org>/<project>/_git/<repository>/pullrequest/<id>`. |
| pr_state | `repo_pull_request`, action `get`, `repositoryId`, `pullRequestId`, `project`: `status` is Active (1), Abandoned (2) or Completed (3, merged); `lastMergeSourceCommit.commitId` is the last source-branch commit the pull request had. |
| create_pr | Not used by `/sprint`: the unit's workflow opens the pull request (senior-dev's PR step, with `repo_pull_request_write`, action `create`, `workItems` from the brief's `Link PR to`). |
