---
type: project-wiki
project: nutrIA
tags: [nutria, nutrition, clinical, widget, embed]
updated: 2026-04-13
---
# nutrIA

Clinical nutrition AI agent. React PWA + embeddable widget.

## Status
✅ V1 built — needs Supabase config + Netlify deploy (1-2 sessions)

## Key decisions
- Shared Supabase instance (nutria_ prefix)
- Claude streaming (claude-opus-4-6)
- Widget embeds on longevite-therapeutics via 1 script tag
- Same auth pattern as espacio-bosques

## Build done
- ✅ Monorepo scaffolded, both targets build clean
- ✅ AuthScreen (Google + email), ChatPanel, Dashboard
- ✅ Widget IIFE bundle (655kb)
- ⬜ Supabase: run schema.sql + enable Google OAuth
- ⬜ Netlify deploy (needs NETLIFY_AUTH_TOKEN)
- ⬜ Embed on longevite-therapeutics

## Connections

### Projects
- [[wiki/longevite]] — first embed target (widget on clinic site)
- [[wiki/espacio-bosques]] — same Supabase auth pattern to copy

### Agents
- [[agents/core/legal]] — LFPDPPP health data flag
- [[agents/core/developer]] — Netlify deploy + Supabase wiring
- [[agents/domain/nutrition]] — nutrition intelligence layer
- [[agents/core/ux]] — widget embed verification

### Concepts used
- [[concepts/supabase-shared-instance]] — nutria_ prefix on shared instance
- [[concepts/spanish-first-mx]] — Spanish-first UI before real user testing

### Learnings
- [[learnings/cross-project-map]]
- [[learnings/supabase-registry]]

## Legal flag
⚠️ LFPDPPP — health/nutrition data is sensitive personal data
