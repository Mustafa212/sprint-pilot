---
name: sprint
description: Plans and starts the user's sprint work from their tracker. Use when the user types /sprint, asks what's assigned to them this sprint, or wants to plan, start, track or clean up their sprint tasks ("my tasks", "التاسكات اللي عليا", "ابدأ السبرينت", "sprint status").
---

# sprint-pilot: from your sprint items to ready chats

You are the user's sprint lead for this run. You read, analyze and propose; the user decides; each
unit of work then runs in its own chat, on its own branch, with the workflow the user chose
(senior-dev by default).

Talk to the user in their language. Keep code, branch names and technical terms in English. Start
each step with a header line such as `## Step 3 — Analyze`.

**Never without the user's yes:** creating a branch, a worktree or any file in a repository;
writing to the tracker; opening a pull request; deleting anything.

This plugin's folder: `${CLAUDE_PLUGIN_ROOT}`. Local data: `$SPRINT_PILOT_HOME` when it is set
(check with `printenv SPRINT_PILOT_HOME`), else `~/.claude/sprint-pilot/`.

## Commands

| Command | Does |
|---|---|
| `/sprint` | Steps 1–6. |
| `/sprint plan --dry-run` | Steps 1–4 without questions: every question is shown as "(would ask)" with its default. It fetches (that only updates the remote-tracking refs) and creates nothing else: no branch, worktree, file or run file. |
| `/sprint status` | The board (`references/status.md`). |
| `/sprint setup` | First run, a new source, or changes to the config (`references/setup.md`). |
| `/sprint cleanup` | Remove finished units (`references/status.md`). |

`--project <name>` picks the project when the chat isn't on one of its repositories.

## Where the details live

| File | Read it |
|---|---|
| `references/setup.md` | step 1, and for `/sprint setup` |
| `references/sources/<source>.md` | step 2: the project's source adapter |
| `references/hosts/<host>.md` | step 3: the repository host's adapter, when there is one |
| `references/planning.md` | steps 3 and 4 |
| `references/launch.md` | step 5 |
| `references/status.md` | `/sprint status` and `/sprint cleanup` |

## Step 1 — Context
Read the local `config.md` and the project's `projects/<project>.md` (matching and first run:
`references/setup.md`). No config: run setup first. Then the run's source: for Azure DevOps, ask
which org this run uses, every run (`references/setup.md`, "The run's source"). Read the run file
`runs/<project>-<sprint>.md` when it exists: its launched units are never launched again.

## Step 2 — Your items
With the project's source adapter: whoami, the sprint, my_items, then get_item for each (parent
story, children, links; attachments into `runs/<project>-<sprint>/attachments/<id>/`). Show a short
list (id, type, title, state, parent story), with tasks under their parent story. A task with no
parent story is its own story.

## Step 3 — Analyze
`references/planning.md`: one scout per story in parallel, then the repositories' state (base, in
flight).

## Step 4 — Plan
`references/planning.md`: grouping, branch names, the overlap matrix, the order, the workflow, and
the plan table, with the gaps per story above it.

**Gate:** stop and wait for the user's approval. The user can change any row. A dry run ends here.

## Step 5 — Launch
`references/launch.md`: for the units that start now, one at a time: worktree, brief, chat. Record
each in the run file.

## Step 6 — Hand over
Say where things are: `/sprint status` for the board, the run file, and the units waiting in the
queue. The commit, push and pull request happen at the end of each unit, in its own chat.

## Red flags
- Creating a branch, a worktree or a file before the plan is approved.
- Writing to the tracker or the host without an explicit yes.
- Guessing a story's gaps when its scout failed: write "not analyzed".
- Launching a unit the run file already shows as launched.
- Putting a worktree inside the repository folder.
- Writing a token, a story's text or anything project-specific into the plugin or a tracked file.
