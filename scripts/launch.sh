#!/usr/bin/env bash
# Opens one sprint-pilot unit on macOS or Linux: a Claude Desktop chat on a folder (macOS; the
# message goes on the clipboard), or a terminal window running Claude with the message.
# Usage: bash launch.sh --dir <folder> --mode desktop|terminal --message <text> [--dry-run]
# Test hooks: SP_CLAUDE (claude command), SP_OS (uname), SP_TMUX (pretend to be inside tmux).
set -u

dir="" mode="" message="" dry=0
while [ $# -gt 0 ]; do
  case "$1" in
    --dir) dir="${2:-}"; shift 2 ;;
    --mode) mode="${2:-}"; shift 2 ;;
    --message) message="${2:-}"; shift 2 ;;
    --dry-run) dry=1; shift ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done
[ -d "$dir" ] || { echo "folder not found: $dir" >&2; exit 2; }
case "$mode" in desktop|terminal) ;; *) echo "--mode must be desktop or terminal" >&2; exit 2 ;; esac
[ -n "$message" ] || { echo "--message is required" >&2; exit 2; }

claude="${SP_CLAUDE:-claude}"
os="${SP_OS:-$(uname -s)}"
q() { printf '%q' "$1"; }

if [ "$mode" = desktop ]; then
  [ "$os" = Darwin ] || { echo "desktop mode needs Claude Desktop (macOS or Windows); use --mode terminal" >&2; exit 4; }
  if [ "$dry" = 1 ]; then echo "clipboard: $message"; echo "run: claude --desktop (in $dir)"; exit 0; fi
  printf '%s' "$message" | pbcopy
  # claude --desktop needs a terminal of its own; `script` gives it one without opening a window.
  (cd "$dir" && script -q /dev/null "$claude" --desktop > /dev/null 2>&1 &)
  exit 0
fi

cmd="cd $(q "$dir") && $(q "$claude") $(q "$message")"
if [ -n "${TMUX:-${SP_TMUX:-}}" ]; then
  if [ "$dry" = 1 ]; then echo "run: tmux new-window -c $dir $claude $(q "$message")"; exit 0; fi
  tmux new-window -c "$dir" "$(q "$claude") $(q "$message")"
elif [ "$os" = Darwin ]; then
  if [ "$dry" = 1 ]; then echo "run: osascript Terminal: $cmd"; exit 0; fi
  osascript -e "tell application \"Terminal\" to do script \"${cmd//\"/\\\"}\""
else
  echo "No terminal to open from here. Run this in a new terminal:" >&2
  echo "$cmd"
  exit 3
fi
exit 0
