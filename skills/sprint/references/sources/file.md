# Source: a file

*sprint-pilot adapter. For trying sprint-pilot without a tracker, and for tests. The project file
names it as `Source: file (<path>)`.*

## Format

```
Me: <your name>
# Sprint <n>

## <id> — <title>
Type: story | task | bug   State: <state>   Assigned: <name>   Parent: <id or none>   Links: <blocked-by <id>, blocks <id>, related <id>, or none>
<description and acceptance criteria, any Markdown>
```

## Connect
Nothing to connect. Check the file exists and has a `Me:` line and a `# Sprint <n>` heading.

## Operations

| Operation | How |
|---|---|
| whoami | The `Me:` line. |
| sprint | The `# Sprint <n>` heading: name `Sprint <n>`, number n. |
| my_items | Every item whose `Assigned` is whoami and whose `State` isn't Done, Closed or Removed. |
| get_item | The item's section, its parent's and its children's sections, and its links. No attachments. |
| link | `<path of the file> § <id>` |
| link_pr, set_state | Not supported: the brief says `Review state: none`, so the unit skips them. |
