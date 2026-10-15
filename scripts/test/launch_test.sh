#!/usr/bin/env bash
# Self-tests for launch.sh (dry runs only). Run: bash scripts/test/launch_test.sh
set -u
here="$(cd "$(dirname "$0")" && pwd)"
launch="$here/../launch.sh"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
dir="$tmp/shop with space.worktrees/sprint-7-101"
mkdir -p "$dir"
msg='/senior-dev .ai-session/launch.md — "قصة" it'"'"'s'
export SP_CLAUDE=claude
failures=0
check() { if eval "$2"; then echo "ok   $1"; else echo "FAIL $1"; failures=$((failures + 1)); fi; }

out=$(SP_OS=Darwin TMUX= bash "$launch" --dir "$dir" --mode desktop --message "$msg" --dry-run); code=$?
check "macOS desktop: exit 0" '[ "$code" -eq 0 ]'
check "macOS desktop: message on the clipboard, intact" '[ "$(printf "%s\n" "$out" | sed -n 1p)" = "clipboard: $msg" ]'
check "macOS desktop: claude --desktop in the folder" 'printf "%s" "$out" | grep -qF "run: claude --desktop (in $dir)"'

SP_OS=Linux TMUX= bash "$launch" --dir "$dir" --mode desktop --message "$msg" --dry-run 2>/dev/null; code=$?
check "Linux desktop: refused with exit 4" '[ "$code" -eq 4 ]'

out=$(SP_OS=Linux SP_TMUX=1 bash "$launch" --dir "$dir" --mode terminal --message "$msg" --dry-run); code=$?
check "tmux: new window in the folder" '[ "$code" -eq 0 ] && printf "%s" "$out" | grep -qF "run: tmux new-window -c $dir"'

out=$(SP_OS=Darwin TMUX= bash "$launch" --dir "$dir" --mode terminal --message "$msg" --dry-run); code=$?
check "macOS terminal: Terminal.app" '[ "$code" -eq 0 ] && printf "%s" "$out" | grep -qF "run: osascript Terminal:"'

out=$(SP_OS=Linux TMUX= bash "$launch" --dir "$dir" --mode terminal --message "$msg" 2>/dev/null); code=$?
check "no terminal to open: exit 3 and the command to run" '[ "$code" -eq 3 ] && printf "%s" "$out" | grep -qF "cd "'

bash "$launch" --dir "$tmp/missing" --mode desktop --message x --dry-run 2>/dev/null; code=$?
check "missing folder: exit 2" '[ "$code" -eq 2 ]'
bash "$launch" --dir "$dir" --mode sideways --message x --dry-run 2>/dev/null; code=$?
check "bad mode: exit 2" '[ "$code" -eq 2 ]'

if [ "$failures" -eq 0 ]; then echo "all launch.sh tests passed"; else echo "$failures launch.sh test(s) failed"; exit 1; fi
