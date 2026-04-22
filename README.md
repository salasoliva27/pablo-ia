# pablo-ia

Personal AI brain. Built on Claude Code with an agent dispatch protocol,
file-based memory, MCP integrations, and a workspace-aware dashboard.

## First run

```bash
./dash              # launch the dashboard
```

In the first chat turn, tell the AI: **`run discovery`**. It will walk you
through declaring your projects, your stack, and personalizing the agents in
`agents/` and `CLAUDE.md` for your work.

## Layout

```
agents/         agent specs (developer, ux, legal, financial, ...)
concepts/       cross-project patterns (the compounding layer)
learnings/      domain knowledge (market, technical, gtm, patterns)
dashboard/      the UI you launch with ./dash
mcp-servers/    local MCP servers (memory, etc.)
scripts/        bootstrap, preflight, gdrive, dash-link, init-fork
tools/          tool registry + configs
skills/         skills registry
CLAUDE.md       master brain — read this first
```

`CLAUDE.md` is the source of truth for how the system behaves. Personalize
it during discovery before doing real work.
