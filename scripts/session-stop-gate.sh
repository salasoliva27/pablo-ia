#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# JANUS IA — SESSION STOP GATE
# Fires on Claude Code "Stop" event. Refuses to end the session
# until a `most-recent-context` memory for today exists in Supabase.
#
# Why: CLAUDE.md mandates a session-handoff anchor. For 30 days it
# was never written. This hook makes it mechanical, not advisory.
#
# Contract:
#   - stdin: JSON with session_id, transcript_path, stop_hook_active
#   - stdout: empty = allow stop | {"decision":"block",...} = continue
# ═══════════════════════════════════════════════════════════════

set -uo pipefail

INPUT=$(cat)

# ─── Anti-loop: if we've already blocked once this turn, allow ───
STOP_ACTIVE=$(echo "$INPUT" | python3 -c "
import json, sys
try: d = json.loads(sys.stdin.read())
except: d = {}
print(d.get('stop_hook_active', False))
" 2>/dev/null)

if [ "$STOP_ACTIVE" = "True" ]; then
  exit 0
fi

# ─── Skip enforcement for trivial sessions ───
TRANSCRIPT=$(echo "$INPUT" | python3 -c "
import json, sys
try: d = json.loads(sys.stdin.read())
except: d = {}
print(d.get('transcript_path', ''))
" 2>/dev/null)

if [ -n "$TRANSCRIPT" ] && [ -f "$TRANSCRIPT" ]; then
  LINE_COUNT=$(wc -l < "$TRANSCRIPT" 2>/dev/null || echo 0)
  # Transcript is JSONL; roughly 2 lines per turn. <20 lines ≈ <10 exchanges.
  if [ "$LINE_COUNT" -lt 20 ]; then
    exit 0
  fi
fi

# ─── Query Supabase for today's anchor ───
SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  # No credentials — cannot enforce. Allow exit but log.
  echo "[stop-gate] Supabase credentials missing — skipping enforcement" >&2
  exit 0
fi

TODAY=$(date -u +%Y-%m-%d)

# tags live in metadata->tags (jsonb). Containment filter:
#   metadata=cs.{"tags":["most-recent-context"]}
# URL-encoded: %7B%22tags%22:%5B%22most-recent-context%22%5D%7D
ANCHOR=$(curl -s -m 5 \
  "${SUPABASE_URL}/rest/v1/memories?select=id,created_at&metadata=cs.%7B%22tags%22:%5B%22most-recent-context%22%5D%7D&created_at=gte.${TODAY}&workspace=eq.janus-ia&limit=1" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" 2>/dev/null || echo "[]")

HAS_ANCHOR=$(echo "$ANCHOR" | python3 -c "
import json, sys
try:
    data = json.loads(sys.stdin.read())
    print('True' if isinstance(data, list) and len(data) > 0 else 'False')
except:
    print('False')
" 2>/dev/null)

if [ "$HAS_ANCHOR" = "True" ]; then
  exit 0
fi

# ─── Block: force Claude to write the anchor before ending ───
cat <<'EOF'
{
  "decision": "block",
  "reason": "STOP-GATE: No `most-recent-context` memory exists for today. Before ending this session you MUST call `mcp__memory__remember` with:\n  - workspace: \"janus-ia\"\n  - type: \"session\"\n  - tags: [\"most-recent-context\", \"session-handoff\", <active-project>]\n  - content: a tight handoff containing (1) active tasks & exact state, (2) files touched this session, (3) decisions made, (4) open questions / blockers, (5) literal next 1–3 actions, (6) any uncommitted changes.\nThis is the primary anchor the NEXT session reads first. Without it, context is lost. Write it NOW, then return control."
}
EOF
