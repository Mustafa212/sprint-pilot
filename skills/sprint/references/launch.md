# Launch

*sprint-pilot reference. Read it in step 5.*

For each unit that starts now, in plan order, one at a time:

1. **Worktree.** In the unit's repository: `git fetch origin`, then
   `git worktree add "<repo-parent>/<repo-name>.worktrees/<branch-slug>" -b <branch> origin/<base>`
   (`<branch-slug>`: the branch name in lowercase with `/` and `_` turned into `-`). Never inside the
   repository folder. A branch the plan reuses (it exists and points at the base):
   `git worktree add "<path>" <branch>`. If the folder exists, or the branch exists and the plan
   didn't say to reuse it, ask: reuse it, or a new name.
2. **Ignore the session folder.** In the worktree, if `git check-ignore -q .ai-session` fails,
   append `.ai-session/` to the file `$(git rev-parse --git-common-dir)/info/exclude`.
3. **Brief.** Write `.ai-session/launch.md` in the worktree (format below), and copy the unit's
   attachments from the run folder into `.ai-session/attachments/`.
4. **Open the chat.** The first message, by workflow:
   - senior-dev: `/senior-dev .ai-session/launch.md`
   - superpowers: `Use superpowers:brainstorming on .ai-session/launch.md`
   - none: `Read .ai-session/launch.md; it describes the work in this worktree.`

   Run the launch script with the config's launch mode (`<plugin>` is this plugin's folder, from
   SKILL.md):
   - Windows: `powershell -NoProfile -ExecutionPolicy Bypass -File "<plugin>/scripts/launch.ps1" -Dir "<worktree>" -Mode <mode> -Message "<message>"`
   - macOS and Linux: `bash "<plugin>/scripts/launch.sh" --dir "<worktree>" --mode <mode> --message "<message>"`

   Desktop mode puts the message on the clipboard and opens a Claude Desktop chat on the worktree.
   Then ask (AskUserQuestion): "Pasted — open the next" / "It didn't open" / "Stop here". "It didn't
   open", or a script exit code other than 0: offer terminal mode for this unit. Terminal mode sends
   the message itself.
5. **Record** the unit in the run file right away, before opening the next one.

## Launch brief format

```
# Launch brief — <unit>
Source: <the run file's Source line>
Story: <link> (<source> #<id>) — <title>
Tasks: <id> — <title>; …
Repo: <repository path>   Branch: <branch>   Base: <base>   PR target: <branch>
Workflow: <senior-dev | superpowers | none>
Depends on: <unit (branch), or none>   Conflicts: <unit: area; …, or none>
Attachments: .ai-session/attachments/ (<count>)

## Gaps found by the scout (a starting point: re-check them; they are not findings)
| # | Gap | Story line | Recommendation |
|---|---|---|---|

## Touched areas (the scout's estimate)
| Area | Kind | Confidence | Evidence |
|---|---|---|---|
```

`PR target`: the base when the project's rule is sprint-branch, the default branch for
default-branch; for ask, ask once per run.

## Run file

`runs/<project>-<sprint>.md`:

```
# <sprint> — <project> (started <date>)
Source: azure-devops (org: <org>, MCP server: ado-<org>, project: <project>, team: <team>) | file (<path>)
| Unit | Story | Repo | Branch ← base | Worktree | Workflow | Status | Launched |
|---|---|---|---|---|---|---|---|
Queue: <unit> (waits for <unit>), …
```

`Status`: launched, queued, done (pull request merged), or cleaned.
