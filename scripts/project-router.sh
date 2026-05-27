#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# JANUS IA — PROJECT ROUTER (UserPromptSubmit hook)
#
# Scans the user's prompt against projects/<slug>/triggers.txt files.
# For each matched project, injects that project's intake.md (capped).
#
# Purpose: plastic context — each sub-project surfaces its own
# load-bearing parameters before the engine starts work, so the
# upfront-questions pass is project-aware instead of generic.
#
# Non-blocking. Output is injected back to the model.
# Token budget: ~1.5KB total output, top-2 projects by hit count.
# ═══════════════════════════════════════════════════════════════

set -uo pipefail

INPUT=$(cat)
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
PROJECTS_ROOT="$PROJECT_DIR/projects"

[ -d "$PROJECTS_ROOT" ] || exit 0

# ─── Extract the user's prompt text from the hook JSON ───
PROMPT=$(echo "$INPUT" | node -e "
let s=''; process.stdin.on('data',c=>s+=c).on('end',()=>{
  try {
    const d = JSON.parse(s);
    const p = d.prompt || d.user_prompt || d.message || '';
    process.stdout.write(String(p).toLowerCase());
  } catch (e) {}
});
" 2>/dev/null)

[ -z "$PROMPT" ] && exit 0

# ─── Score each project by trigger hit count ───
# Output: "<hits>\t<slug>" per matched project, ranked desc.
MATCHES=$(
  for triggers_file in "$PROJECTS_ROOT"/*/triggers.txt; do
    [ -f "$triggers_file" ] || continue
    SLUG=$(basename "$(dirname "$triggers_file")")
    HITS=0
    while IFS= read -r line; do
      # Skip comments and blank lines
      case "$line" in ''|'#'*) continue ;; esac
      # Trim trailing whitespace
      kw="${line%"${line##*[![:space:]]}"}"
      [ -z "$kw" ] && continue
      case "$PROMPT" in
        *"$kw"*) HITS=$((HITS + 1)) ;;
      esac
    done < "$triggers_file"
    [ "$HITS" -gt 0 ] && printf '%d\t%s\n' "$HITS" "$SLUG"
  done | sort -rn -k1,1
)

[ -z "$MATCHES" ] && exit 0

# ─── Emit top-2 matched projects ───
echo ""
echo "▸ PROJECT INTAKE — matched on prompt keywords"
echo "  Use these intake fields when running the upfront-questions pass."
echo ""

COUNT=0
while IFS=$'\t' read -r hits slug; do
  [ -z "$slug" ] && continue
  COUNT=$((COUNT + 1))
  [ "$COUNT" -gt 2 ] && break
  INTAKE="$PROJECTS_ROOT/$slug/intake.md"
  [ -f "$INTAKE" ] || continue
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "▸ projects/$slug/intake.md  (${hits} trigger hit(s))"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  # Cap each intake at ~3KB to stay within budget
  head -c 3000 "$INTAKE"
  echo ""
done <<< "$MATCHES"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

exit 0
