#!/usr/bin/env bash
#
# Güvenli codex asset üretimi.
#
# Codex agent'i workspace-write ile git komutlarını (commit/push) serbest
# çalıştırabiliyor. Bu wrapper üç katman koruma verir:
#   1. İzole git worktree + throwaway branch — codex commit/push yapsa bile
#      master'a DEĞMEZ, ayrı branch'te kalır. Asıl koruma budur.
#   2. Prompt'a git yasağı enjekte eder.
#   3. --ignore-rules ile proje execpolicy/auto-commit hook'larını yüklemez.
#
# Üretilen dosyaları SEN inceleyip merge/cherry-pick edersin — otomatik değil.
#
# Kullanım:
#   scripts/codex-asset.sh "<brief metni>" [branch-eki]
#   scripts/codex-asset.sh --file docs/superpowers/specs/tappy-codex-brief.md [branch-eki]

set -euo pipefail

GIT_BAN="ÖNEMLİ KURAL: Hiçbir git komutu çalıştırma — commit yok, push yok, branch/checkout yok, git add yok. YALNIZCA dosya oluştur/düzenle. Bittiğinde sadece ürettiğin dosya yollarını listele."

if [ "${1:-}" = "--file" ]; then
  [ -f "${2:-}" ] || { echo "hata: dosya yok: ${2:-<boş>}" >&2; exit 1; }
  PROMPT="$(cat "$2")"
  BRANCH_SUFFIX="${3:-codex-asset}"
elif [ -n "${1:-}" ]; then
  PROMPT="$1"
  BRANCH_SUFFIX="${2:-codex-asset}"
else
  echo "kullanım: $0 \"<brief>\" [branch-eki]   |   $0 --file <brief.md> [branch-eki]" >&2
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
REPO_NAME="$(basename "$REPO_ROOT")"
STAMP="$(date +%Y%m%d-%H%M%S)"
BRANCH_NAME="asset/${BRANCH_SUFFIX}-${STAMP}"
WORKTREE="${REPO_ROOT}/../${REPO_NAME}-codex-${STAMP}"

echo "→ izole worktree: $WORKTREE"
echo "→ branch:         $BRANCH_NAME (master'a değmez)"
git -C "$REPO_ROOT" worktree add -b "$BRANCH_NAME" "$WORKTREE" HEAD >/dev/null

cleanup_hint() {
  cat <<EOF

── sonraki adım (önce incele) ──────────────────────────────
  değişiklikleri gör:
    git -C "$WORKTREE" status --short
    git -C "$WORKTREE" --no-pager diff HEAD

  beğendiysen — sadece asset'leri ana repoya al:
    git -C "$REPO_ROOT" checkout "$BRANCH_NAME" -- src/assets/icons

  ya da tüm branch'i merge et:
    git -C "$REPO_ROOT" merge --no-ff "$BRANCH_NAME"

  temizlik:
    git -C "$REPO_ROOT" worktree remove --force "$WORKTREE"
    git -C "$REPO_ROOT" branch -D "$BRANCH_NAME"
────────────────────────────────────────────────────────────
EOF
}
trap cleanup_hint EXIT

codex exec -C "$WORKTREE" -s workspace-write --ignore-rules \
  "${GIT_BAN}

${PROMPT}" || echo "(codex çıkış kodu: $? — worktree yine de duruyor, aşağıya bak)"

echo
echo "=== worktree değişiklikleri ==="
git -C "$WORKTREE" status --short
