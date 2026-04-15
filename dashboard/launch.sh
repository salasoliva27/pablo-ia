#!/usr/bin/env bash
# Launch Venture OS Dashboard (unified — bridge + Vite in one process)
# Usage: bash dashboard/launch.sh        (from repo root)
#        bash launch.sh                   (from dashboard/)
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
BRIDGE_PORT="${VENTURE_OS_PORT:-3100}"
VITE_PORT=5180

# Kill any existing dashboard processes
for port in $BRIDGE_PORT $VITE_PORT; do
  pid=$(lsof -ti :$port 2>/dev/null || true)
  [ -n "$pid" ] && kill $pid 2>/dev/null && echo "Killed stale process on :$port"
done

sleep 0.3

# Start unified launcher (bridge + Vite in one process)
cd "$DIR"
exec npx tsx bin/dev.ts
