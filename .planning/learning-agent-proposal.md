# Proposal — Split Learning from Evolve

**Status:** draft, pending Jano review
**Date:** 2026-04-21
**Author:** Claude (session 402a9fe6 continuation)

---

## Problem

The current `/evolve` agent conflates two jobs that don't belong together:

1. **Inward work** — consolidating what Janus already knows (memories, vault, graph)
2. **Outward work** — acquiring new capabilities (MCPs, skills, tools)

Symptoms: evolve runs rarely (1 subagent dispatch in 20 sessions per diagnostic); Neo4j projection exists but has never run; edge weights don't exist; concept promotion happens manually or not at all. The graph is static prose with wikilinks, not a learning substrate.

## Proposal — Two agents, one loop

### `agents/core/learning.md` (new) — inward, runs on `/learn`

Responsibilities:
1. **Project vault → Neo4j** — run `scripts/neo4j/project-vault.mjs` (idempotent MERGE)
2. **Edge weight strengthening** — count co-occurrences of nodes within same session/concept/project; store as `weight` property on `[:REFERENCES]` and `[:MENTIONS]` edges
3. **Concept promotion** — rule-based: if pattern appears in ≥2 projects' sessions, create/update `concepts/[slug].md` and wire links
4. **Memory consolidation** — dedupe memories, rewrite stale ones, maintain cross-links
5. **Semantic embeddings** (phase 2) — compute embeddings for all nodes via Voyage/OpenAI, store in Supabase `node_embeddings` table for similarity queries
6. **Outcome feedback** (phase 3) — when a memory has `outcome: "worked" | "failed"`, bump/decay edges to connected nodes

Triggers: `/learn`, scheduled via cron (daily), or tail-end of every session.

Writes to: Neo4j (via projector), Supabase `memories`, Supabase `node_embeddings`, `concepts/*.md`, `MEMORY.md` index, `.planning/learning/state.json`.

### `agents/core/evolve.md` (narrowed) — outward, runs on `/evolve`

Responsibilities:
1. **Intake from Learning** — read `.planning/learning/state.json` for identified gaps
2. **Assess capabilities** — reconcile `tools/registry.md` + `skills/registry.md` against gaps
3. **Discover** — GitHub + Brave search for MCPs/skills/tools that fill gaps
4. **Install** — add to `.mcp.json`, `npx skills add`, test basic call, log to registry
5. **Report** — surface discoveries to Jano, queue paid/manual installs

Triggers: `/evolve [DURATION]`, typically after a Learning cycle has identified gaps.

Writes to: `.mcp.json`, `tools/registry.md`, `skills/registry.md`, `.planning/evolve/state.json`.

## Data flow

```
Session events  ┐
Vault .md files ┼─► Learning agent ─► Neo4j + embeddings + concepts
Memories        ┘         │
                          ▼
                   gaps.json ─► Evolve agent ─► new MCPs/skills installed
                                    │
                                    ▼
                          tools/skills registries
                                    │
                                    ▼
                  (Learning reads updated registries next cycle)
```

Learning is the feeder. Evolve is the acquirer. They share a state directory so handoff is file-based, not in-memory.

## What "learning" concretely does per cycle

| Phase | Inputs | Outputs | ML? |
|---|---|---|---|
| **Project** | vault .md, memories | Neo4j nodes + edges (MERGE) | no |
| **Strengthen** | session co-occurrence | edge `weight` increments | no |
| **Promote** | memories in ≥2 projects | new concept .md + links | rule-based |
| **Dedupe** | Supabase memories | merged records, forget() calls | no |
| **Embed** (phase 2) | node text | vectors in `node_embeddings` | embedding API (not training) |
| **Feedback** (phase 3) | outcome-tagged memories | edge weight deltas | no (counting) |

No model training until there's enough labeled data (≥6mo outcomes). Until then "prediction" = cosine similarity + weighted path queries, which is deterministic and debuggable.

## Phased rollout

**Phase 0 — Foundation (1 session)**
- Stand up Neo4j Aura free tier, creds into dotfiles
- Run `project-vault.mjs` manually — confirm graph populates
- Verify `graph_query` tool returns real data in dashboard Brain → Vault

**Phase 1 — Split (1 session)**
- Create `agents/core/learning.md` spec
- Narrow `agents/core/evolve.md` — remove consolidation phase, add Learning intake
- Create `/learn` slash command that runs: projector → strengthener → promoter → deduper
- Wire handoff file at `.planning/learning/state.json`

**Phase 2 — Weights (1 session)**
- Extend projector to compute and MERGE `weight` on edges
- Dashboard shows edge thickness from weight (already supported by D3)

**Phase 3 — Embeddings (1-2 sessions)**
- Add `node_embeddings` table to Supabase
- Compute embeddings on each projection run (only for changed nodes)
- Expose `find_similar(node_id)` tool in memory MCP

**Phase 4 — Outcomes (when data exists)**
- Add `outcome` field to memory schema
- Learning agent bumps edges on "worked" memories, decays on "failed"
- Consider GNN only after 100+ labeled outcomes

## Tradeoffs

**Cost of split:** one extra agent file + one state directory + one command. Cheap.

**Cost of embeddings:** ~$0.01 per 1000 nodes at Voyage pricing. Negligible at current scale (<500 nodes).

**Cost of premature ML:** high. Training anything on 67 memories produces noise that looks like signal. Hard to debug. Defer.

**Cost of NOT doing this:** graph stays static; Evolve keeps conflating jobs; learning stays implicit and unrepeatable; the "brain" metaphor stays aspirational.

## Decisions (locked 2026-04-21)

| Q | Decision | Notes |
|---|---|---|
| Trigger | **Manual via existing Learn button** | `ChatPanel.tsx:298` already exists — currently calls `/evolve`. Will be re-pointed to `/learn` once shipped. User inputs duration (e.g. `7am`, `2h`, `30m`). |
| Concept promotion threshold | **≥2 projects** | Pattern must appear across ≥2 different projects' memories/sessions to be promoted to `concepts/[slug].md`. |
| Outcome tagging | **Auto-infer from session summaries** | Learning agent reads recent session memories and infers `outcome="worked"` / `"failed"` from language signals. Risk: noisy weights from misclassification. Mitigation: log inferred outcomes to `.planning/learning/inferred-outcomes.log` for audit + flag low-confidence inferences for explicit review. |
| Embeddings provider | **Voyage** | `voyage-3` for general, `voyage-3-large` for highest quality. Needs `VOYAGE_API_KEY` in dotfiles before phase 3. |
| Loop scheduler | **N/A** | Manual button only. No `ScheduleWakeup`/cron. Within a single Learn run, the agent uses `ScheduleWakeup` internally to chain phases until budget runs out (same pattern as current `/evolve`). |

## Files that would be created/modified

**New:**
- `agents/core/learning.md` — behavioral spec
- `commands/learn.md` — slash command definition
- `.planning/learning/state.json` + `log.md` + `handoff.md`
- `scripts/neo4j/strengthen-edges.mjs` — weight computation
- `scripts/neo4j/promote-concepts.mjs` — rule-based concept extraction

**Modified:**
- `commands/evolve.md` — remove CONSOLIDATE phase, add "read learning/state.json" intake step
- `agents/core/evolve.md` — narrow scope
- `scripts/neo4j/project-vault.mjs` — add edge weight computation (phase 2)
- `mcp-servers/memory/index.js` — add `find_similar` and `outcome` handling (later phases)
- `CLAUDE.md` — update dispatch table with Learning agent

**Unchanged:**
- Existing memory tools (remember, recall, capture_correction)
- Dashboard brain view (already reads from Neo4j + Supabase)
- Bridge MCP supervisor

---

## Recommendation

Ship Phase 0 + Phase 1 in two sessions. That's the minimum viable split. Phases 2-4 are incremental; each delivers a visible improvement and can pause if priorities shift. Don't build embeddings or ML until there's a user-visible reason to.
