# janus-ia

A Claude Code-based agent system for running a venture portfolio: validates ideas,
builds products, coordinates legal/financial/calendar, and compounds learnings
across every build.

This is Jano's working brain. The repo is public so you can fork it as a starting
point for your own setup.

---

## Using this as a template

The repo ships with the agent framework intact (CLAUDE.md, agents, concepts,
scripts, dashboard, MCP servers, tools/skills registries) and strips out the
personal content (Jano's wikis, projects, outputs).

1. **Fork** this repo on GitHub.
2. **Open it in a Codespace** (or clone locally with Claude Code installed).
3. **Strip personal content**:
   ```bash
   ./scripts/init-fork.sh
   ```
   This removes `wiki/`, `projects/`, `outputs/`, `dump/` and resets
   `PROJECTS.md`, `learnings/market.md`, `learnings/supabase-registry.md` to
   empty templates. Re-runnable.
4. **Launch the dashboard**:
   ```bash
   ./dash
   ```
5. **First turn, tell the AI**: `run discovery`. It will walk you through naming
   your projects, declaring your stack, and personalizing the agents.

What you keep from the fork: the dispatch protocol, all 16 agents, the
inline-learning + vault-plasticity rules, the cross-synthesis checklist, the
MCP/skills/tools registries (with verdicts), and the dashboard.

What you start fresh: your projects, your wikis, your outputs, your memory.

---

## Using `./dash` from other repos (Jano's own setup)

The dashboard is workspace-aware. From any repo, you can launch the same UI
scoped to that repo by dropping a tiny wrapper in:

```bash
/workspaces/janus-ia/scripts/dash-link /workspaces/<other-repo>
```

Then in that repo:
```bash
./dash
```

It uses janus-ia's dashboard code but reads/writes its own workspace files
(`learnings/`, `concepts/`, `wiki/`, memory namespace, etc.). Memory is scoped
per workspace, so jp-ai's memory stays in jp-ai's namespace.

---

## Layout

```
agents/         16 agent specs (developer, ux, legal, financial, ...)
concepts/       Cross-project patterns (the compounding layer)
learnings/      Domain knowledge (market, technical, gtm, patterns)
dashboard/      The UI you launch with ./dash
mcp-servers/    Local MCP servers (memory, etc.)
scripts/        Bootstrap, preflight, gdrive, dash-link, init-fork
tools/          Tool registry + configs
skills/         Skills registry
CLAUDE.md       The master brain — read this first
```

`CLAUDE.md` is the source of truth for how the system behaves. Read it before
making structural changes.
