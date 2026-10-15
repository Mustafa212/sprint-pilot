#!/usr/bin/env bash
# Self-tests for launch.sh (dry runs only), plus launch.ps1 called from bash when PowerShell is
# here (Windows: Claude's Bash tool is Git Bash). Run: bash scripts/test/launch_test.sh
set -u
here="$(cd "$(dirname "$0")" && pwd)"
launch="$here/../launch.sh"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
dir="$tmp/shop with space.worktrees/sprint-7-101"
mkdir -p "$dir"
sd='/senior-dev .ai-session/launch.md'
# A stand-in for claude that prints its arguments, one per line.
printf '#!/usr/bin/env bash\nprintf "%%s\\n" "$@"\n' > "$tmp/fake-claude"; chmod +x "$tmp/fake-claude"
export SP_CLAUDE=claude
failures=0
check() { if eval "$2"; then echo "ok   $1"; else echo "FAIL $1"; failures=$((failures + 1)); fi; }
run() { if command -v timeout > /dev/null; then timeout 10 bash "$launch" "$@"; else bash "$launch" "$@"; fi; }

out=$(SP_OS=Darwin TMUX= run --dir "$dir" --mode desktop --workflow senior-dev --dry-run); code=$?
check "macOS desktop: exit 0" '[ "$code" -eq 0 ]'
check "macOS desktop: the senior-dev message on the clipboard" '[ "$(printf "%s\n" "$out" | sed -n 1p)" = "clipboard: $sd" ]'
check "macOS desktop: claude --desktop in the folder" 'printf "%s" "$out" | grep -qF "run: claude --desktop (in $dir)"'

out=$(SP_OS=Darwin TMUX= run --dir "$dir" --mode desktop --workflow superpowers --dry-run)
check "superpowers message" '[ "$(printf "%s\n" "$out" | sed -n 1p)" = "clipboard: Use superpowers:brainstorming on .ai-session/launch.md" ]'
out=$(SP_OS=Darwin TMUX= run --dir "$dir" --mode desktop --workflow none --dry-run)
check "none message, without ;" '[ "$(printf "%s\n" "$out" | sed -n 1p)" = "clipboard: Read .ai-session/launch.md, which describes the work in this worktree." ]'

SP_OS=Linux TMUX= run --dir "$dir" --mode desktop --workflow senior-dev --dry-run 2>/dev/null; code=$?
check "Linux desktop: refused with exit 4" '[ "$code" -eq 4 ]'

out=$(SP_OS=Linux SP_TMUX=1 run --dir "$dir" --mode terminal --workflow senior-dev --dry-run); code=$?
check "tmux: new window in the folder" '[ "$code" -eq 0 ] && printf "%s" "$out" | grep -qF "run: tmux new-window -c $dir"'

out=$(SP_CLAUDE="$tmp/fake-claude" SP_OS=Darwin TMUX= run --dir "$dir" --mode terminal --workflow senior-dev --dry-run); code=$?
cmd=$(printf "%s" "$out" | sed -n 's/^run: osascript Terminal: //p')
check "macOS terminal: Terminal.app" '[ "$code" -eq 0 ] && [ -n "$cmd" ]'
got=$(bash -c "$cmd")
check "macOS terminal: the command runs in the folder with the message as one argument" '[ "$got" = "$sd" ]'

SP_OSASCRIPT=false SP_OS=Darwin TMUX= run --dir "$dir" --mode terminal --workflow senior-dev > /dev/null 2>&1; code=$?
check "macOS terminal: osascript fails → exit 3" '[ "$code" -eq 3 ]'

out=$(SP_OS=Linux TMUX= run --dir "$dir" --mode terminal --workflow senior-dev 2>/dev/null); code=$?
check "no terminal to open: exit 3 and the command to run" '[ "$code" -eq 3 ] && printf "%s" "$out" | grep -qF "cd "'

run --dir "$tmp/missing" --mode desktop --workflow senior-dev --dry-run 2>/dev/null; code=$?
check "missing folder: exit 2" '[ "$code" -eq 2 ]'
run --dir "$dir" --mode sideways --workflow senior-dev --dry-run 2>/dev/null; code=$?
check "bad mode: exit 2" '[ "$code" -eq 2 ]'
run --dir "$dir" --mode desktop --workflow cowboy --dry-run 2>/dev/null; code=$?
check "unknown workflow: exit 2" '[ "$code" -eq 2 ]'
run --dir "$dir" --mode desktop --dry-run --workflow 2>/dev/null; code=$?
check "flag without a value: exit 2, no hang" '[ "$code" -eq 2 ]'

# Windows: the orchestrator runs launch.ps1 through Git Bash, which rewrites arguments that start
# with "/". The message must still arrive intact.
if command -v powershell > /dev/null 2>&1; then
  out=$(SP_CLAUDE='C:\tools\claude.exe' powershell -NoProfile -ExecutionPolicy Bypass -File "$here/../launch.ps1" -Dir "$dir" -Mode desktop -Workflow senior-dev -DryRun | tr -d '\r')
  check "launch.ps1 from bash: the senior-dev message intact" 'printf "%s\n" "$out" | grep -qxF "clipboard: $sd"'
fi

if [ "$failures" -eq 0 ]; then echo "all launch.sh tests passed"; else echo "$failures launch.sh test(s) failed"; exit 1; fi
