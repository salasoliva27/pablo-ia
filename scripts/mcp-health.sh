#!/usr/bin/env bash
# MCP Health Check — runs once per Claude Code session
# Reports which MCP servers are up/down on first user message

LOCK="/tmp/mcp-health-check-$$-$(date +%Y%m%d).done"

# Only run once per session (keyed on parent PID + date)
PPID_LOCK="/tmp/mcp-health-$(ps -o ppid= -p $$ 2>/dev/null | tr -d ' ')-$(date +%Y%m%d).done"
[ -f "$PPID_LOCK" ] && exit 0
touch "$PPID_LOCK"

# Parse MCP servers from .mcp.json
MCP_FILE="/workspaces/venture-os/.mcp.json"
[ ! -f "$MCP_FILE" ] && exit 0

# Extract server names
SERVERS=$(python3 -c "
import json, sys
with open('$MCP_FILE') as f:
    cfg = json.load(f)
servers = cfg.get('mcpServers', {})
for name in sorted(servers.keys()):
    print(name)
" 2>/dev/null)

[ -z "$SERVERS" ] && exit 0

# Build status report
UP=0
DOWN=0
REPORT=""

while IFS= read -r server; do
  # Check if the MCP process is running by looking for it in process list
  if pgrep -f "$server" > /dev/null 2>&1; then
    REPORT="$REPORT  ✓ $server\n"
    UP=$((UP + 1))
  else
    REPORT="$REPORT  ✗ $server\n"
    DOWN=$((DOWN + 1))
  fi
done <<< "$SERVERS"

TOTAL=$((UP + DOWN))

# Output as JSON for the hook system
if [ "$DOWN" -gt 0 ]; then
  echo ""
  echo "MCP Status: ${UP}/${TOTAL} up"
  echo -e "$REPORT"
  if echo "$REPORT" | grep -q "✗ playwright"; then
    echo "  → Playwright is down. It may need a session restart."
  fi
fi
