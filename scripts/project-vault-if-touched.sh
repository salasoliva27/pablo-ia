#!/usr/bin/env bash
# Re-project the Janus vault into Neo4j if vault files (or memory MCP rows)
# have changed since the last projection. Runs in the background so it does
# not block session stop.
#
# Triggers: any uncommitted change under concepts/, learnings/, wiki/, agents/,
# modules/, tools/, or skills/ since the last successful projector run.
#
# Wired into .claude/settings.json `Stop` hook (post-turn).
set -euo pipefail

cd "${CLAUDE_PROJECT_DIR:-.}"

# Cheap touch check — skip projector if no vault MD files were modified this turn.
TOUCHED=$(git status --porcelain -- concepts/ learnings/ wiki/ agents/ modules/ tools/ skills/ 2>/dev/null | wc -l | tr -d ' ')
if [ "$TOUCHED" -eq 0 ]; then
  exit 0
fi

# Env: prefer dotfiles-loaded vars (NEO4J_URI, SUPABASE_URL, etc.). If missing,
# bail silently — projector requires them and will error otherwise.
if [ -z "${NEO4J_URI:-}" ] || [ -z "${SUPABASE_URL:-}" ]; then
  exit 0
fi

# Run projector in background so it doesn't gate session stop. Output goes to
# .janus/projector.log for debugging.
mkdir -p .janus
nohup node scripts/neo4j/project-vault.mjs >> .janus/projector.log 2>&1 &
exit 0
