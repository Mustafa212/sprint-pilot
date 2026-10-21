# Status and cleanup

*sprint-pilot reference. Read it for `/sprint status` and `/sprint cleanup`.*

## /sprint status
For each unit in the run file:
1. **Its run** (launched units): in its worktree, read every `.ai-session/senior-dev/*.md` (senior-dev
   keeps one per story, and a finished run leaves `STATE.md`'s index, so read the folder, not the
   index): `Phase`, `NEXT`, `Waiting`, `PR` and `Last updated`. No such file (another workflow, or
   not started): phase "—". A background unit: also `claude agents --json --cwd <worktree>`; its
   `state` `blocked` means it waits for the user (a question or a permission), and `failed` or
   `stopped`, or no session at all, means it isn't running.
2. **Git:** commits ahead of its base (`git rev-list --count origin/<base>..HEAD`) and uncommitted
   changes (`git status --porcelain`, yes or no).
3. **Its pull request:** the run file's `PR`, else the run's `PR` line, else the host adapter's
   find_pr by the unit's branch (this covers every workflow). Write a URL found this way into the
   run file. Then its state (open, merged, abandoned) from the host adapter, with the server for the
   remote's org, and on an open one what holds it: draft, merge conflicts, a reviewer waiting for
   the author or rejecting, approvals. Merged: set the unit's status to `done`.

Show every unit, queued, stacked and held ones included:

| Unit | Status | Phase | Waiting on you? | Last update | Commits | Uncommitted | PR |
|---|---|---|---|---|---|---|---|

`Waiting on you?` is yes when senior-dev's `Waiting` says so, a background session is `blocked`,
or the pull request has conflicts or a reviewer waiting for the author; say which.

**Cross-unit check:** for each unit with commits, compare its changed files
(`git diff --name-only origin/<base>...<branch>`) with the touched areas of the units it shares a
conflict, a dependency or a `D-n` with, and read those hunks against each `D-n` it touches. Report
every overlap, and every change that contradicts a decision a sibling relies on, above the table:
units built in parallel drift from the plan, and it shows only when they meet.

Then offer what's ready, after the user's yes for each:
- **A queued unit** whose dependencies are all done (merged): launch it (`references/launch.md`,
  from its saved brief).
- **A held unit:** ask whether its blocking gap is answered (in the tracker, or by the user). Yes:
  launch it the same way, once every unit it depends on is merged.
- **A stacked unit** whose dependency merged: in its worktree, `git fetch origin`, then
  `git rebase --onto origin/<base> <the Stacked on commit>`, and set the brief's `Base` and
  `Stacked on` accordingly. A conflict: stop, leave the rebase for the unit's chat, and say so.
  Never force-push without the user's yes.
- **A launched unit that isn't running:** a background session `failed`, `stopped` or gone, or a
  chat with no update for a day and `Waiting: no` (it may be closed). Offer to start it again on its
  worktree (the launch script, same workflow); senior-dev resumes from its `NEXT`. A `blocked`
  background unit: say `claude attach <id>` opens it.

## /sprint cleanup
List the units that are finished: the pull request is merged, or, for `End: push-for-review` or
`local`, the user says the unit is done. First check each one for commits saved nowhere else
(a merged PR proves only that the commits it had landed):
- The remote branch still exists: `git rev-list --count origin/<branch>..<branch>`.
- It was deleted: `git rev-list --count <last source commit>..<branch>`, with the PR's last source
  commit from the host adapter (Azure Repos: `lastMergeSourceCommit` in pr_state's response).

More than 0: show those commits (`git log --oneline`) and leave that unit out. Can't tell: leave it
out and say why.

Ask once, naming for each remaining unit what will happen, including that its `.ai-session/`
(state, delivery log, evidence) is archived first, and that its chat should be closed first. After
the yes, for each:
1. Copy `<worktree>/.ai-session/` to `runs/<project>-<sprint>/archive/<unit>/` (attachments and
   build output such as `bin/`, `obj/` and `node_modules/` excluded). `git worktree remove` deletes
   ignored files, so this copy is the only one left.
2. `git worktree remove <path>`. It refuses when there are uncommitted changes: report it, never
   force.
3. Only for a merged pull request: `git branch -d <branch>`. A branch kept for review
   (`push-for-review`, `local`) stays. A squash merge makes it refuse even though the host says merged: then,
   because the host confirmed the merge and the check above found no unsaved commits, ask once more
   and use `git branch -D <branch>` for that branch only.
4. Mark the unit `cleaned` in the run file. Never delete a remote branch.

When every unit is cleaned, read each archived `sprint-learnings.md`, write
`runs/<project>-<sprint>/learnings.md` (what repeats across units first), and offer to move the
project facts into the workflow's project notes and the process lessons into proposals for the
plugins. Nothing is merged into notes or plugins without the user's yes.
