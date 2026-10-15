#!/usr/bin/env bash
# Contract test between sprint-pilot and senior-dev: every field the launch brief writes is one
# senior-dev reads, and every state field /sprint status reads is one senior-dev writes.
# Usage: bash tests/contract/check.sh <path to a senior-dev checkout>
set -u
here="$(cd "$(dirname "$0")/../.." && pwd)"
sd="${1:?usage: check.sh <senior-dev checkout>}"
sd_text="$(cat "$sd/skills/senior-dev/SKILL.md" "$sd"/skills/senior-dev/references/*.md)"
state="$sd/skills/senior-dev/references/state-and-local-data.md"
launch="$here/skills/sprint/references/launch.md"
status="$here/skills/sprint/references/status.md"
failures=0
check() { if eval "$2"; then echo "ok   $1"; else echo "FAIL $1"; failures=$((failures + 1)); fi; }

# The brief's field names: "Name:" at the start of lines inside the format block of launch.md.
fields=$(sed -n '/^## Launch brief format/,/^## Run file/p' "$launch" | sed -n '/^```$/,/^```$/p' \
  | grep -oE '^[A-Z][A-Za-z -]*:' | sed 's/:$//' | sort -u)
[ -n "$fields" ] || { echo "FAIL no brief fields found in $launch"; exit 1; }
while IFS= read -r f; do
  check "brief field '$f' is read by senior-dev" 'printf "%s" "$sd_text" | grep -qF "\`$f:\`"'
done <<< "$fields"

# The state fields /sprint status reads must be in senior-dev's state template.
for f in Phase NEXT Waiting PR "Last updated"; do
  check "status reads '$f', senior-dev writes it" 'grep -qF "$f:" "$state" && grep -qF "\`$f\`" "$status"'
done

# The first message the launch scripts build must be the one senior-dev answers to.
check "launch scripts start senior-dev with its own command" 'grep -qF "/senior-dev .ai-session/launch.md" "$here/scripts/launch.sh" && grep -qF "/senior-dev .ai-session/launch.md" "$here/scripts/launch.ps1" && printf "%s" "$sd_text" | grep -qF ".ai-session/launch.md"'

if [ "$failures" -eq 0 ]; then echo "contract holds"; else echo "$failures contract check(s) failed"; exit 1; fi
