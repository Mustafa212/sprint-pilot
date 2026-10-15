# Status and cleanup

*sprint-pilot reference. Read it for `/sprint status` and `/sprint cleanup`.*

## /sprint status
For each unit in the run file:
1. **Its run** (launched units): in its worktree, read every `.ai-session/senior-dev/*.md` (senior-dev
   keeps one per story, and a finished run leaves `STATE.md`'s index, so read the folder, not the
   index): `Phase`, `NEXT`, `Waiting`, `PR` and `Last updated`. No such file (another workflow, or
   not started): phase "—".
2. **Git:** commits ahead of its base (`git rev-list --count origin/<base>..HEAD`) and uncommitted
   changes (`git status --porcelain`, yes or no).
3. **Its pull request:** the run file's `PR`, else the run's `PR` line, else the host adapter's
   find_pr by the unit's branch (this covers every workflow). Write a URL found this way into the
   run file. Then its state (open, merged, abandoned) from the host adapter, with the server for the
   remote's org. Merged: set the unit's status to `done`.

Show every unit, queued and stacked ones included:

| Unit | Status | Phase | Waiting on you? | Last update | Commits | Uncommitted | PR |
|---|---|---|---|---|---|---|---|

Then offer what's ready, after the user's yes for each:
- **A queued unit** whose dependencies are all done (merged): launch it (`references/launch.md`,
  from its saved brief).
- **A stacked unit** whose dependency merged: in its worktree, `git fetch origin`, then
  `git rebase --onto origin/<base> <the Stacked on commit>`, and set the brief's `Base` and
  `Stacked on` accordingly. A conflict: stop, leave the rebase for the unit's chat, and say so.
  Never force-push without the user's yes.
- **A launched unit** with no update for a day and `Waiting: no`: its chat may be closed; offer to
  open a new chat on its worktree (the launch script, same workflow). senior-dev resumes from its
  `NEXT`.

## /sprint cleanup
List the units whose pull request is merged. Ask once, naming for each unit what will happen,
including that its `.ai-session/` (state, delivery log, evidence) is archived first. After the yes,
for each:
1. Copy `<worktree>/.ai-session/` to `runs/<project>-<sprint>/archive/<unit>/` (attachments
   excluded). `git worktree remove` deletes ignored files, so this copy is the only one left.
2. `git worktree remove <path>`. It refuses when there are uncommitted changes: report it, never
   force.
3. `git branch -d <branch>`. A squash merge makes it refuse even though the host says merged: then,
   because the host confirmed the merge, ask once more and use `git branch -D <branch>` for that
   branch only.
4. Mark the unit `cleaned` in the run file. Never delete a remote branch.
