#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# JANUS IA — SESSION PRE-FLIGHT CHECK
# Runs automatically on every session start via Claude Code hook.
# Output is injected into the AI's context BEFORE it responds.
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

WORKSPACE="/workspaces/janus-ia"
MEMORY_DIR="$HOME/.claude/projects/-workspaces-janus-ia/memory"
SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║           JANUS IA — SESSION PRE-FLIGHT CHECK           ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ─── 1. MEMORY SYSTEM HEALTH ──────────────────────────────────
echo "▸ MEMORY SYSTEMS"

# Auto-memory (Claude Code built-in)
MEMORY_COUNT=$(find "$MEMORY_DIR" -name "*.md" -not -name "MEMORY.md" 2>/dev/null | wc -l)
echo "  Auto-memory files: ${MEMORY_COUNT}"

# Supabase memory MCP
if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_KEY" ]; then
  MEM_STATS=$(curl -s -m 5 \
    "${SUPABASE_URL}/rest/v1/memories?select=type&limit=500" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" 2>/dev/null || echo "FAIL")

  if [ "$MEM_STATS" = "FAIL" ] || echo "$MEM_STATS" | grep -q '"message"'; then
    echo "  Supabase memory: ✗ UNREACHABLE"
  else
    TOTAL=$(echo "$MEM_STATS" | python3 -c "import json,sys; data=json.load(sys.stdin); print(len(data))" 2>/dev/null || echo "0")
    TYPES=$(echo "$MEM_STATS" | python3 -c "
import json,sys
from collections import Counter
data=json.load(sys.stdin)
counts=Counter(r['type'] for r in data)
print(', '.join(f'{t}:{c}' for t,c in counts.most_common()))
" 2>/dev/null || echo "unknown")
    echo "  Supabase memory: ✓ ${TOTAL} memories (${TYPES})"
  fi

  # Check last memory date
  LAST_MEM=$(curl -s -m 5 \
    "${SUPABASE_URL}/rest/v1/memories?select=created_at&order=created_at.desc&limit=1" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" 2>/dev/null || echo "[]")

  LAST_DATE=$(echo "$LAST_MEM" | python3 -c "
import json,sys
data=json.load(sys.stdin)
if data: print(data[0]['created_at'][:10])
else: print('never')
" 2>/dev/null || echo "unknown")
  echo "  Last memory written: ${LAST_DATE}"

  # Gap warning
  DAYS_SINCE=$(python3 -c "
from datetime import datetime
try:
    last=datetime.strptime('${LAST_DATE}','%Y-%m-%d')
    gap=(datetime.now()-last).days
    if gap>1: print(f'  ⚠ {gap} DAYS since last memory — learning gap detected')
except: pass
" 2>/dev/null)
  [ -n "$DAYS_SINCE" ] && echo "$DAYS_SINCE"

  # ─── Session-handoff anchor check (MANDATORY) ─────────────
  # The next session's primary context is a `most-recent-context` memory
  # written by the previous session. If it's missing or stale, warn loudly.
  ANCHOR_RESP=$(curl -s -m 5 \
    "${SUPABASE_URL}/rest/v1/memories?select=id,created_at,content&metadata=cs.%7B%22tags%22:%5B%22most-recent-context%22%5D%7D&workspace=eq.janus-ia&order=created_at.desc&limit=1" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" 2>/dev/null || echo "[]")

  ANCHOR_AGE=$(echo "$ANCHOR_RESP" | python3 -c "
import json, sys
from datetime import datetime, timezone
try:
    data = json.loads(sys.stdin.read())
    if not isinstance(data, list) or not data:
        print('MISSING')
    else:
        ts = data[0]['created_at'].replace('Z','+00:00')
        dt = datetime.fromisoformat(ts)
        age = (datetime.now(timezone.utc) - dt).total_seconds() / 3600
        print(f'FRESH:{age:.0f}' if age < 48 else f'STALE:{age:.0f}')
except Exception as e:
    print('MISSING')
" 2>/dev/null)

  case "$ANCHOR_AGE" in
    MISSING)
      echo "  Session anchor: ✗ NO most-recent-context MEMORY EXISTS"
      echo "    → The previous session did NOT write a handoff. Context is lost."
      echo "    → Do NOT treat this as normal. Acknowledge the gap to Jano."
      ;;
    FRESH:*)
      HOURS="${ANCHOR_AGE#FRESH:}"
      echo "  Session anchor: ✓ most-recent-context is ${HOURS}h old — LOAD IT FIRST"
      ;;
    STALE:*)
      HOURS="${ANCHOR_AGE#STALE:}"
      echo "  Session anchor: ⚠ most-recent-context is ${HOURS}h old (>48h stale)"
      echo "    → Previous session may not have written one before ending."
      ;;
  esac
else
  echo "  Supabase memory: ✗ NO CREDENTIALS (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing)"
fi

echo ""

# ─── 2. VAULT HEALTH ──────────────────────────────────────────
echo "▸ KNOWLEDGE VAULT"

# Check vault files exist
CONCEPT_COUNT=$(find "$WORKSPACE/concepts" -name "*.md" 2>/dev/null | wc -l)
LEARNING_COUNT=$(find "$WORKSPACE/learnings" -name "*.md" 2>/dev/null | wc -l)
AGENT_COUNT=$(find "$WORKSPACE/agents" -name "*.md" 2>/dev/null | wc -l)
echo "  Concepts: ${CONCEPT_COUNT} | Learnings: ${LEARNING_COUNT} | Agents: ${AGENT_COUNT}"

# Check PROJECTS.md exists and has content
if [ -f "$WORKSPACE/PROJECTS.md" ]; then
  PROJ_LINES=$(wc -l < "$WORKSPACE/PROJECTS.md")
  echo "  PROJECTS.md: ✓ (${PROJ_LINES} lines)"
else
  echo "  PROJECTS.md: ✗ MISSING"
fi

echo ""

# ─── 3. GIT STATE ─────────────────────────────────────────────
echo "▸ GIT STATE"

cd "$WORKSPACE"
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
UNCOMMITTED=$(git status --porcelain 2>/dev/null | wc -l)
LAST_COMMIT_DATE=$(git log -1 --format="%ci" 2>/dev/null | cut -d' ' -f1 || echo "unknown")
LAST_COMMIT_MSG=$(git log -1 --format="%s" 2>/dev/null | head -c 80 || echo "unknown")
echo "  Branch: ${BRANCH}"
echo "  Uncommitted changes: ${UNCOMMITTED}"
echo "  Last commit: ${LAST_COMMIT_DATE} — ${LAST_COMMIT_MSG}"

# Check for unpushed commits
UNPUSHED=$(git log origin/${BRANCH}..HEAD --oneline 2>/dev/null | wc -l || echo "0")
[ "$UNPUSHED" -gt 0 ] && echo "  ⚠ ${UNPUSHED} unpushed commits"

echo ""

# ─── 4. ACTIVE PROJECT SNAPSHOT ───────────────────────────────
echo "▸ ACTIVE PROJECTS (from cross-project-map)"
if [ -f "$WORKSPACE/learnings/cross-project-map.md" ]; then
  # Extract capacity section
  python3 -c "
import re
with open('$WORKSPACE/learnings/cross-project-map.md') as f:
    content = f.read()
cap = re.search(r'## Capacity.*?(?=\n## |\Z)', content, re.DOTALL)
if cap:
    lines = cap.group().strip().split('\n')
    for line in lines[1:]:
        line = line.strip()
        if line.startswith('-') or line.startswith('Rule:') or line.startswith('Total:'):
            print(f'  {line}')
" 2>/dev/null
fi

echo ""

# ─── 5. PROTOCOL REMINDER ─────────────────────────────────────
echo "▸ SESSION PROTOCOL CHECKLIST"
echo "  ✓ Permission mode: Full Auto (default)"
echo "  □ recall() recent work across projects"
echo "  □ Check for corrections from previous sessions"
echo "  □ Cross-synthesis: legal, market, tech, capacity"
echo "  □ Respond to user"
echo ""
echo "▸ INLINE LEARNING RULES (active all session)"
echo "  □ Correction from user → immediate capture_correction()"
echo "  □ Surprising discovery → immediate remember(type='learning')"
echo "  □ Decision made → immediate remember(type='decision')"
echo "  □ Minimum 3 memories per session"
echo "  □ End of session → capture_session_summary()"
echo ""
echo "════════════════════════════════════════════════════════════"
echo " DO NOT SKIP THESE PROTOCOLS. They exist because you"
echo " skipped them for 30 days and lost all learning."
echo "════════════════════════════════════════════════════════════"
echo ""
