# Status and cleanup

*sprint-pilot reference. Read it for `/sprint status` and `/sprint cleanup`.*

## /sprint status
For each unit the run file shows as launched:
1. In its worktree, read `.ai-session/STATE.md` and the story file it points to: `Phase`, `NEXT`,
   `Waiting`, `PR` and `Last updated` (senior-dev writes them). No state file: phase "—".
2. Git: commits ahead of the base (`git rev-list --count origin/<base>..HEAD`), and uncommitted
   changes (`git status --porcelain`).
3. Host: the pull request's state when `PR` names one (open, merged, closed), with the run file's
   `Source:` server for Azure Repos.

Show:

| Unit | Phase | Waiting on you? | Last update | Commits | PR |
|---|---|---|---|---|---|

Then, if a unit's pull request is open or merged and the queue holds a unit whose dependencies are
met, offer to launch it (`references/launch.md`). A unit that depends on another one: ask whether
to start from the base or from that unit's branch.

A unit whose chat was closed: offer to open a new chat on its worktree (the launch script, same
first message); senior-dev resumes from its `NEXT`.

## /sprint cleanup
List the units whose pull request is merged. After the user's yes, for each: `git worktree remove
<path>` (it refuses when there are uncommitted changes: report it, never force), then
`git branch -d <branch>` (it refuses when unmerged: report it, never force). Mark them cleaned in
the run file. Never delete a remote branch.
