#!/usr/bin/env bash
# Builds the sprint-pilot test fixture: a bare "remote" and a clone with sprint branches, a
# teammate's in-flight branch on pricing, and a branch name that's already taken.
# Usage: bash tests/fixture/make-repo.sh <target-folder>
set -eu
target="${1:?usage: make-repo.sh <target-folder>}"
# Only ever delete an earlier fixture (it has remote.git) or an empty folder.
if [ -e "$target" ] && [ -n "$(ls -A "$target")" ] && [ ! -d "$target/remote.git" ]; then
  echo "refusing to delete $target: not empty and not a fixture" >&2; exit 2
fi
rm -rf "$target"; mkdir -p "$target"; cd "$target"
git init -q --bare -b main remote.git
git init -q -b main shop && cd shop
git config user.email fixture@example.com && git config user.name "Sam Dev"
mkdir -p src
printf 'def discounted_total(total):\n    """Return the order total after any discount."""\n    return total\n' > src/pricing.py
printf 'def export_orders(orders):\n    """Return orders as rows."""\n    return [(o.id, o.customer, o.total) for o in orders]\n' > src/export.py
printf 'PAGE_TITLE = "Users"\n' > src/users.py
printf '# Shop\n' > README.md
git add . && git commit -qm "init"
git remote add origin ../remote.git && git push -q -u origin main
for b in Sprint_6 Sprint_7; do git branch "$b" main && git push -q origin "$b"; done
git checkout -q -b Sprint_7_teammate-pricing-rounding Sprint_7
printf 'def discounted_total(total):\n    """Return the order total after any discount, rounded."""\n    return round(total, 2)\n' > src/pricing.py
git -c user.name="Alex Other" commit -qam "Round totals"
git push -q origin Sprint_7_teammate-pricing-rounding
git checkout -q main && git branch -q -D Sprint_7_teammate-pricing-rounding
git push -q origin Sprint_7:refs/heads/Sprint_7_104-rename-the-users-page-title
git fetch -q origin
echo "fixture ready: $target/shop"
