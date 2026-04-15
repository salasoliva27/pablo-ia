---
type: project-wiki
project: jp-ai
tags: [jp-ai, ozum, crm, corporate-events, client-project, dashboard]
updated: 2026-04-15
---
# jp-ai (Ozum AI-OS)

AI operating system for Ozum — corporate events & incentive travel agency.
Client: Juan Pablo García (CSO). Built by Jano.

## Status
🔄 Dashboard shipped — CRM Phase 1 pending

## Key decisions
- Multi-user (all Ozum employees), role-aware CLAUDE.md
- 11 specialized agents (Sales, Events, Travel, Vendor, Marketing, Financial, Developer, Deploy, UX, Security, Research)
- Supabase collective memory (ozum_memories table — still not wired)
- Repo stays private; transfer to Ozum GitHub org when JP creates one
- Dashboard adapted from Venture OS shell — warm gold theme (oklch hue 85)

## Build done
- ✅ CLAUDE.md brain, 11 agents, domain agent (corporate-events.md)
- ✅ Dotfiles: .env.example + setup.sh
- ✅ CRM project spec: Phase 1–4 roadmap
- ✅ .mcp.json pre-configured (6 MCPs: sequential-thinking, playwright, brave, context7, github, filesystem)
- ✅ **Dashboard** (2026-04-15): Full Ozum AI-OS dashboard — React 18 + Vite + Express 5 + WebSocket. 46 files, 13,527 lines. Project grid, knowledge brain, activity monitor, chat panel, 4 theme presets.

## Still broken
- ⬜ `ozum-memory` MCP referenced in CLAUDE.md but NOT configured in .mcp.json — memory system is dead code
- ⬜ `modules/` directory referenced in CLAUDE.md but doesn't exist
- ⬜ Supabase `ozum_memories` table not created
- ⬜ Supabase MCP not in .mcp.json
- ⬜ CRM Phase 1 build (lead intake + AI proposal generator) — this is the revenue-critical deliverable

## Connections

### Agents
- [[agents/core/developer]] — CRM Phase 1 build
- [[agents/core/legal]] — client data handling, contract review
- [[agents/core/deploy]] — repo transfer to Ozum GitHub org
- [[agents/core/ux]] — dashboard verification

### Concepts used
- [[concepts/dashboard-shell]] — dashboard adapted from Venture OS in 1 session
- [[concepts/supabase-shared-instance]] — ozum_memories table pending
- [[concepts/spanish-first-mx]] — Ozum operates in Mexico + USA, Spanish primary

### Learnings
- [[learnings/cross-project-map]] — dashboard shell reuse pattern added
- [[learnings/technical]] — multi-agent type contract lesson learned during build
- [[learnings/patterns]] — build reality data populated from this project
