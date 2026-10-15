# Setup

*sprint-pilot reference. Read it in step 1, and for `/sprint setup`.*

All of this lives in the local data folder (SKILL.md), never in a repository.

## Files

`config.md`:

```
# sprint-pilot — machine config
Connected sources: <azure-devops (MCP server: <name>)>, …
Default workflow: senior-dev            (senior-dev | superpowers | none)
Max parallel units: 3
Scout model: opus                       (opus | sonnet)
Launch: desktop                         (desktop | terminal)
```

`projects/<project>.md`:

```
# <project>
Repos: <path> (<remote URL>)[, …]
Source: azure-devops (org: <org>, project: <project>, team: <team>) | file (<path>)
Done states: Done, Closed, Removed
Sprint branch: <pattern with {n}, e.g. Sprint_{n}> | none (the default branch)
Branch name: <pattern with {n}, {id}, {slug}, e.g. Sprint_{n}_{id}-{slug}>
PR target: sprint-branch | default-branch | ask
Review state: <the tracker's state for "in review">
Base confirmed: <sprint> → <branch> (<date>)
```

`runs/<project>-<sprint>.md` and `runs/<project>-<sprint>/attachments/`: written in steps 2 and 5.
`<sprint>` is the sprint's name in kebab-case (`Sprint 7` → `sprint-7`).

## Matching the project
Match the chat's repository (its path, or `git remote get-url origin`) against the `Repos:` line
of each project file. No match: ask whether it belongs to an existing project or is a new one
(name: the remote's repository name in kebab-case).

## First run on this machine
1. Ask where the user's items live (AskUserQuestion): Azure DevOps, or a file (to try sprint-pilot
   without a tracker). Jira, GitHub Issues, Notion and Linear arrive in later versions: say so if
   the user names one.
2. Follow the adapter's "Connect" section (`references/sources/<source>.md`). Never ask the user to
   paste a token into the chat, and never write one to a file.
3. Ask the default workflow and the launch mode (desktop when Claude Desktop is installed, else
   terminal). Write `config.md` and show it.

## First run on a project
Ask only what can't be found:
- The source's coordinates (the adapter says which: for Azure DevOps the project and team).
- The sprint-branch pattern: propose one from the remote branches with numbers (`git branch -r`:
  `Sprint_25`, `Sprint_26` → `Sprint_{n}`), or none.
- The branch-name pattern: propose one from recent branch names.
- The PR target rule, and the review state (the adapter lists the item type's states).
Write `projects/<project>.md` and show it.

Keep these files small and true: date each confirmed value, and fix a value the moment it proves
wrong.
