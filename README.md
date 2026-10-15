# sprint-pilot

A Claude Code plugin that takes you from the items assigned to you this sprint to ready chats, one
per unit of work, each on its own branch:

```
your tracker → your items → gaps per story → a plan (branches, order, conflicts) → your OK
   → one worktree + one Claude Desktop chat per unit, running your workflow (senior-dev by default)
   → /sprint status → pull requests (asked for at the end of each unit) → /sprint cleanup
```

You decide at every step: nothing is created before you approve the plan, and nothing is written
to your tracker or host without your yes.

## Install

```bash
claude plugin marketplace add Mustafa212/sprint-pilot
claude plugin install sprint-pilot@sprint-pilot
```

Recommended with it: [senior-dev](https://github.com/Mustafa212/senior-dev) 1.4.0 or later, which
reads the launch brief each unit starts with (the story, the unit's scope, the tracker server and
the review state), reports its progress to `/sprint status`, and asks to open the pull request at
the end. `/sprint setup` checks it's installed.

Claude Desktop launches need `claude --desktop` (macOS, or Windows x64); elsewhere units open in a
terminal.

## Use

| Command | Does |
|---|---|
| `/sprint` | Read your items, analyze, plan, and after your OK open each unit. |
| `/sprint plan --dry-run` | Everything up to the plan, read-only and without questions. |
| `/sprint status` | Where every unit stands, and what's waiting on you. |
| `/sprint setup` | Connect a source, or change the configuration. |
| `/sprint cleanup` | Remove the worktrees and local branches of merged units. |

Each unit opens as a new chat in **Claude Desktop** on its own worktree, with the first message on
your clipboard: paste it and send. (Claude Desktop can't take that first message from the command
line yet.) Without Claude Desktop, units open in terminal tabs and start on their own.

## Sources

| Source | Status |
|---|---|
| Azure DevOps Boards (+ Azure Repos) | untested on a live sprint |
| A Markdown file (try it without a tracker) | tested |
| GitHub Issues, Jira, Notion, Linear | planned |

Connections go through each tracker's own MCP server, which signs you in; sprint-pilot never
stores a token, and nothing about your org or projects goes into the plugin.

### Azure DevOps

One MCP server per organization, named `ado-<org>`, so one machine can work with several orgs.
Every run asks which org it uses (default: the org in the repository's remote) and records it in
the run file; each unit's launch brief carries it, so the unit's workflow uses the same server.

```bash
claude mcp add ado-<org> -s user -- npx -y @azure-devops/mcp@2.10.0 <org> -d core work work-items repositories
```

sprint-pilot itself writes nothing to Azure DevOps. Recommended rules in `~/.claude/settings.json`
for each `ado-<org>` server (prefix every tool with `mcp__ado-<org>__`):

| Rule | Tools | Why |
|---|---|---|
| deny | `wit_work_item_comment_write`, `repo_pull_request_thread_write`, `repo_create_branch`, `work_iteration_write`, `work_capacity_write` | nothing here needs them |
| ask | `wit_work_item_write`, `wit_work_item_link_write`, `repo_pull_request_write` | the unit's workflow opens the pull request, links it and sets the review state, after your yes |

### Safety

Stories, comments and attachments are written by many people, so every agent here treats them as
data, never as instructions, and reports anything that reads like an instruction. The permission
rules above are the real barrier: they apply to every agent and every unit's chat.

## Your data stays local

```
~/.claude/sprint-pilot/          (or $SPRINT_PILOT_HOME)
  config.md                      sources, Azure DevOps orgs, default workflow, max parallel units, scout model, launch mode
  projects/<project>.md          repositories, tracker coordinates, branch patterns, PR target, review state
  runs/<project>-<sprint>.md     each run's source, units, branches, worktrees, pull requests and queue
  runs/<project>-<sprint>/       the units' briefs, and the archive /sprint cleanup keeps of each unit's .ai-session/
```

Worktrees sit beside each repository (`<repo>.worktrees/<branch>`), never inside it.

## Development

Scripts have self-tests (`scripts/test/`), run in CI on Linux, macOS and Windows (on Windows also
from Git Bash, as Claude's Bash tool runs them). `tests/contract/check.sh <senior-dev checkout>`
checks that every launch-brief field is one senior-dev reads, and every state field `/sprint status`
reads is one it writes. A fixture (`tests/fixture/`) gives a repository and a sprint file for dry
runs. Releases: bump `version` in `.claude-plugin/plugin.json`, head the CHANGELOG entry with it,
merge, and push a `vX.Y.Z` tag.

## License

MIT
