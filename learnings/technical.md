# TECHNICAL LEARNINGS — BUILD TIME REALITY
## Last updated: 2026-04-13

## Related concepts
- [[concepts/simulation-first-dev]] — the most impactful build pattern found so far
- [[concepts/test-harness-first]] — /api/test/* before UI: caught 5 silent bugs in espacio-bosques
- [[concepts/supabase-shared-instance]] — shared infra pattern saving ops overhead
- [[concepts/rls-by-default]] — enable RLS on every table, use `(select auth.uid())` for performance

## Projects with build data
- [[wiki/espacio-bosques]] — POC in ~7 sessions (React + Supabase + Bitso + governance)
- [[wiki/lool-ai]] — MediaPipe + Three.js in ~2 sessions
- [[wiki/mercado-bot]] — dashboard v1 in ~2 sessions

## Last updated: 2026-03-16

### Estimates vs reality
No data yet. Will populate as projects complete build phases.

### Stack-specific notes
- Solidity/Hardhat: 450-line smart contract with 22 tests took approximately [TBD] hours
- React: no data yet
- Claude Code pipelines: no data yet

### Infrastructure findings (2026-04-15 evolve session)
- **Supabase RLS**: `janus_memories` had NO RLS — fully exposed to PostgREST. Fixed via migration. Rule: every table gets RLS at creation time, even service-role-only tables.
- **RLS performance**: `auth.uid()` in policies re-evaluates per row. Use `(select auth.uid())` to evaluate once as subquery. Fixed 4 policies across eb_ and nutria_ tables.
- **npm audit**: `mcp-servers/memory/` had 3 vulnerabilities (hono, path-to-regexp). Fixed with `npm audit fix`.
- **Dependabot**: Was DISABLED on all 6 repos. Enabled alerts + auto-fix PRs across portfolio.
- **Memory MCP**: Path in `.mcp.json` still references `/workspaces/janus-ia/` — needs manual fix to `/workspaces/venture-os/`.
- **CI**: espacio-bosques GitHub Actions Tests workflow ALL RED since Apr 7. Must investigate before demo.
- **Skills ceiling**: 127 skills installed (36 marketing, 87 GSD, CKM, GSAP, ui-ux-pro-max, cost-mode, excalidraw). No more high-value skills found — current tooling is comprehensive.

---

# GTM LEARNINGS — OUTREACH REALITY
## Last updated: 2026-03-16

### What outreach approaches worked
No data yet. Will populate as lool-ai and freelance-system run GTM.

### Response rates by channel
No data yet.

### Mexico City neighborhood notes
No data yet — will populate as lool-ai visits stores.