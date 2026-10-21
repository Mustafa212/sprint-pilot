# Setup

*sprint-pilot reference. Read it in step 1, and for `/sprint setup`.*

All of this lives in the local data folder (SKILL.md), never in a repository.

## Files

`config.md`:

```
# sprint-pilot — machine config
Connected sources: azure-devops, file, …
Azure DevOps orgs: <org> (MCP server: ado-<org>), …
Default workflow: senior-dev            (senior-dev | superpowers | none)
Max parallel units: 3
Scout model: opus                       (opus | sonnet)
Launch: background                      (background | desktop | terminal)
```

`projects/<project>.md`:

```
# <project>
Repos: <path> (<remote URL>)[, …]
Source: azure-devops (org: <last org used>, project: <project>, team: <team>) | jira (site: <url>, cloudId: <id>, project: <KEY>, board: <id>) | file (<path>)
Done states: Done, Closed, Removed
Sprint branch: <pattern with {n}, e.g. Sprint_{n}> | <one branch, e.g. dev> | none (the default branch)
Branch name: <pattern with {n}, {id}, {slug} or {Slug}, e.g. Sprint_{n}_{id}-{slug} or Sprint_{n}_{Slug}>
End: pr | push-for-review | local     (how a unit ends; default pr)
PR target: sprint-branch | default-branch | ask
Review state: <item type> → <the tracker's state for "in review">, … (e.g. Task → In Review, Bug → Resolved)
Worktree setup: copy <ignored local files, e.g. .env>; run <install command> | none
Base confirmed: <sprint> → <branch> (<date>)
```

`runs/<project>-<sprint>.md`, with `runs/<project>-<sprint>/briefs/` and `archive/`: written at the
plan's approval, in step 5 and by `/sprint cleanup`.
`<sprint>` is the sprint's name in kebab-case (`Sprint 7` → `sprint-7`).

## Matching the project
Match the chat's repository (its path, or `git remote get-url origin`) against the `Repos:` line
of each project file. No match: ask whether it belongs to an existing project or is a new one
(name: the remote's repository name in kebab-case).

## The run's source (every run)
For an Azure DevOps source, ask which org this run uses, every time, even when a run file exists
(one question, with a default: the org in the repository's remote URL, parsed as in
`references/hosts/azure-repos.md`, else the run file's, else the project file's). Use the server `ado-<org>`; when it isn't connected, follow the adapter's
Connect section, and add the org to the config's `Azure DevOps orgs:` line. If the answer differs
from the project file's org, ask again for the project and team, and update the project file.

The run file starts with the run's source, so the run and every unit it launches name the same
org and server:

```
Source: azure-devops (org: <org>, MCP server: ado-<org>, project: <project>, team: <team>)
```

For a Jira source, the project file's coordinates and the server:
`Source: jira (site: <url>, cloudId: <id>, MCP server: <server>, project: <KEY>, board: <id>)`.
For a file source: `Source: file (<path>)`. A dry run shows the question as "(would ask)" and
writes nothing.

## First run on this machine
1. Ask where the user's items live (AskUserQuestion): Azure DevOps, Jira, or a file (to try
   sprint-pilot without a tracker). GitHub Issues, Notion and Linear arrive in later versions: say so if
   the user names one.
2. Follow the adapter's "Connect" section (`references/sources/<source>.md`). Never ask the user to
   paste a token into the chat, and never write one to a file. On Windows, MCP servers started with
   `npx` often miss the 30-second startup timeout: suggest `setx MCP_TIMEOUT 120000` (and a restart)
   before the first run, not after a failed one.
3. Ask the default workflow, and check it's there: for senior-dev, `claude plugin list` shows
   `senior-dev` at 1.10.0 or later (it reads the brief's `End:` line); for superpowers, `superpowers`.
   Missing or older: give the install or update command, or offer another workflow.
4. Ask the launch mode:
   - **background** (recommended): each unit runs as a background session (`claude --bg`), started
     with its first message (nothing to paste) and listed in `claude agents`, where the user sees
     which units wait for them and opens one with `claude attach <id>`. The repository must be
     trusted: the user has run `claude` in it once and accepted the prompt (a worktree takes its
     main repository's trust).
   - **desktop**: one Claude Desktop chat per unit (`claude --desktop` works on macOS and Windows
     x64); the first message goes on the clipboard to paste.
   - **terminal**: one terminal tab per unit.

   Write `config.md` and show it.

## First run on a project
Ask only what can't be found:
- The source's coordinates (the adapter says which: for Azure DevOps the project and team; for Jira
  the site, project key and board).
- The sprint-branch pattern: propose one from the remote branches with numbers (`git branch -r`:
  `Sprint_25`, `Sprint_26` → `Sprint_{n}`); with none, the one long-lived branch the work lands on
  when the default branch lags far behind it (`git rev-list --count origin/<default>..origin/<branch>`
  in the hundreds, and the default branch untouched for months: propose that branch, for example
  `dev`); else none.
- The branch-name pattern: propose one from recent branch names, keeping their style: separators,
  whether ids appear, and the title's casing (`{Slug}` for PascalCase such as `ExportMonthlyInvoices`,
  `{slug}` for kebab-case). Show two names it would produce from this sprint's titles.
- How a unit ends (`End:`): `pr` (the workflow opens a pull request), `push-for-review` (it pushes
  the branch and the user reviews it before any pull request) or `local` (commit only).
- The PR target rule, and the review state for each item type the user gets (Azure DevOps:
  `wit_work_item`, action `get_type`, lists a type's states; Jira: `listJiraStatuses`, `mode: project`).
- The worktree setup: propose the ignored local files a fresh worktree lacks (`git ls-files --others
  --ignored --exclude-standard`, config files only, never anything that looks like a secret store
  you'd need to read) and the install command from the lockfiles (`npm ci`, `dotnet restore`,
  `flutter pub get`, `uv sync`, …), or none.
Write `projects/<project>.md` and show it.

Keep these files small and true: date each confirmed value, and fix a value the moment it proves
wrong.
