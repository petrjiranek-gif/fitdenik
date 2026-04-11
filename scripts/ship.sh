#!/usr/bin/env bash
# Jedním příkazem: stage → commit → push (main).
# Použití: npm run ship -- "zpráva commitu"
# Bez zprávy: výchozí chore: ship

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MSG="${*:-chore: ship}"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Chyba: není git repozitář." >&2
  exit 1
fi

if [ -z "$(git status --porcelain)" ]; then
  echo "Nic ke commitu — zkouším jen push."
  git push origin main
  exit 0
fi

git add -A
git commit -m "$MSG"
git push origin main
