# Planning

*sprint-pilot reference. Read it in steps 3 and 4.*

## Scouts (step 3)
Dispatch one `sprint-pilot:scout` per story with the Agent tool, all in one message, with the
config's `Scout model` (default `opus`: the plan rests on what the scouts find, and a missed
conflict or gap costs more than the run). The brief:

```
## Story (verbatim)
<the story: title, description, acceptance criteria, and comments that change its scope>

## Tasks assigned to the user
<id — title — description, for each of the user's tasks under this story>

## Repositories
<path> — <what it is> (one line per repository in the project file)

## Project docs
<paths of CLAUDE.md, AGENTS.md and architecture docs in those repositories, if any>
```

A scout that fails or returns nothing: the story is "not analyzed" in the plan, with no guessed
gaps.

## Repository state (step 3)
For each repository, `git fetch --prune origin`, then:
1. **Base:** the remote branch with the highest {n} that matches the sprint-branch pattern; no
   pattern or no match: the default branch (`git symbolic-ref refs/remotes/origin/HEAD`). If the
   project file has no `Base confirmed:` for this sprint, ask once ("Base for <sprint>: <branch>?")
   and record the answer.
2. **In flight:** branches, with git on any host:
   `git for-each-ref refs/remotes/origin --sort=-committerdate --format='%(refname:short)|%(committerdate:unix)|%(authorname)'`,
   keeping those with commits in the last 14 days, except the base and the default branch. Open
   pull requests: the host adapter's open_prs when the remote's host has one (`references/hosts/`);
   a remote on any other host (or a local path) has none. For each branch or pull request: its
   author and changed files (`git diff --name-only origin/<base>...origin/<branch>`).

## Grouping (step 4)
For each story with more than one of the user's tasks, or with tasks in more than one repository,
propose either one unit per repository for the whole story (the default when the tasks share
files) or one unit per task, and ask per story (AskUserQuestion, up to 4 stories per call). Every
other story is one unit.

## Branch names
Fill the project's branch-name pattern: {n} the sprint number, {id} the story id (the task id for a
per-task unit), {slug} the title in kebab-case, ASCII letters and digits only, at most 40
characters. If the name exists locally or on the remote: when that branch has no commits of its own
(it points at the base) and no worktree uses it, it was most likely made for this item, so propose
reusing it; otherwise add `-2` (then `-3`, …). The user decides.

## Overlap matrix
Compare every pair of units, and every unit with the in-flight branches:

| Signal | Means |
|---|---|
| The same file, table, migration or endpoint in both units' touched areas (medium or high confidence) | conflict risk |
| A tracker dependency between their items (blocked-by, blocks, predecessor, successor) | dependency |
| An in-flight branch or pull request changes a file in a unit's touched areas | warning: name the branch and its author |

A dependency a scout finds that the tracker doesn't record (one story needs code another unit adds)
counts the same, marked "found by scout", with a suggestion to add the link in the tracker. A unit
that depends on another unit of this plan is queued behind it. For a conflict risk without a
dependency, propose queueing the smaller unit behind the larger one; the user decides.

## Order and workflow
Start now: units with no dependency, up to the max parallel units, larger first. The rest queue in
dependency order. Workflow: the config's default for every unit; ask once per run whether to keep
it, and accept changes per row.

## The plan
Show, in this order:
1. **Gaps per story:** the scouts' tables with recommendations. They go to the product owner, or
   into each unit's Phase 1.
2. **The plan table:**

   | Unit | Story / tasks | Repo | Branch ← base | Gaps | Depends on | Conflicts / warnings | Workflow | Start |
   |---|---|---|---|---|---|---|---|---|

   `Start`: now, queued (behind <unit>), or launched (from the run file).
3. One line: "Approve, or tell me what to change."

Then stop. Nothing is created before the user approves.
