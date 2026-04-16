#!/usr/bin/env bash
# MCP Health Check — runs once per Claude Code session via SessionStart hook
# Ensures dependencies are installed and reports status

PPID_LOCK="/tmp/mcp-health-$(ps -o ppid= -p $$ 2>/dev/null | tr -d ' ')-$(date +%Y%m%d).done"
[ -f "$PPID_LOCK" ] && exit 0
touch "$PPID_LOCK"

# Ensure memory MCP dependencies are installed (not committed to git)
if [ -d "/workspaces/janus-ia/mcp-servers/memory" ] && [ ! -d "/workspaces/janus-ia/mcp-servers/memory/node_modules" ]; then
  cd /workspaces/janus-ia/mcp-servers/memory && npm install --silent 2>/dev/null
  echo "Installed memory MCP dependencies"
fi
