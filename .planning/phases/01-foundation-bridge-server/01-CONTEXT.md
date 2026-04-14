# Phase 1: Foundation & Bridge Server - Context

## Cross-Phase Decisions

### D-01: Agent SDK, not raw child_process
All Claude Code interaction goes through `@anthropic-ai/claude-agent-sdk` `query()`. Do NOT use raw `child_process.spawn`. The SDK handles subprocess lifecycle, NDJSON parsing, typed messages, and multi-turn.

### D-02: No --bare flag
Venture OS needs MCP servers, hooks, and CLAUDE.md to function as master orchestrator. Never pass `--bare` to the SDK.

### D-03: Single session per server
Only one active Claude Code session at a time. New `start` messages close the previous session. This prevents memory accumulation (~200MB per subprocess).

### D-04: Permission timeout = 60 seconds
`canUseTool` promises auto-deny after 60 seconds to prevent deadlocks when the UI disconnects or user is AFK.

### D-05: Port 3100 default
Bridge server runs on `localhost:3100` by default. Configurable via `VENTURE_OS_PORT` env var. Hook config URL uses this port.

### D-06: WebSocket protocol
Client-to-server and server-to-client message types are defined in `dashboard/bridge/types.ts`. All future phases consuming bridge events must import from this file.

### D-07: Hook-based tool events (not stdout parsing)
Tool call activity feed data comes from HTTP hooks (`PostToolUse` type: "http"), NOT from parsing Claude Code stdout. The hook config is written to `dashboard/.claude/settings.json` at bridge startup.

### D-08: Chokidar for filesystem watching
Using chokidar v5 with `awaitWriteFinish: { stabilityThreshold: 300 }` and ignoring `node_modules`, `.git`, and dotfiles.

## Architecture Summary

```
dashboard/
  bridge/
    types.ts            -- WS message protocol (source of truth)
    server.ts           -- Express + WS server + hook receiver
    claude-session.ts   -- Agent SDK query wrapper
    permissions.ts      -- canUseTool promise management
    file-watcher.ts     -- chokidar vault/project watchers
  bin/
    venture-os.ts       -- CLI entry point
  package.json
  tsconfig.json
```

## For Phase 2+ Consumers

- Import `ServerMessage` from `dashboard/bridge/types.ts` for WS message typing
- WebSocket connects to `ws://localhost:3100`
- Messages are JSON-serialized `ServerMessage` objects
- `claude_message` contains raw SDK message objects (inspect `.type` for system/assistant/result)
- `permission_request` requires a `permission_response` reply within 60s
- `tool_event` arrives from PostToolUse hooks (activity feed data)
- `fs_event` arrives from chokidar (vault/project file changes)
