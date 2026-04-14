# Codebase Concerns

**Analysis Date:** 2026-04-13

## Tech Debt

**1,751-line monolith component:**
- Issue: `projects/mercado-bot-dev/dashboard/src/components/Dashboard.jsx` is a single 1,751-line React component containing all UI, state, API calls, and business logic with no separation
- Files: `projects/mercado-bot-dev/dashboard/src/components/Dashboard.jsx`
- Impact: Impossible to test, refactor, or extend individual features. Any change risks breaking unrelated functionality
- Fix approach: Extract into composable components (KellyCalculator, RiskMonitor, PipelineRunner, TradeLog, SignalsTable) with dedicated state hooks

**Hardcoded API key in client-side code (CRITICAL SECURITY):**
- Issue: Anthropic API key `sk-ant-api03-...` is hardcoded as a string literal in two client-facing JavaScript files. These files are served directly to browsers, exposing the key to anyone who views page source
- Files: `projects/mercado-bot-dev/dashboard/src/components/Dashboard.jsx` (line ~1060), `projects/longevite-therapeutics/widget.js` (line 176)
- Impact: Anyone can steal and abuse this API key. Immediate financial exposure. Key should be rotated NOW
- Fix approach: Move all Anthropic API calls behind a backend proxy. Never ship API keys to the browser. Use environment variables server-side only

**Committed .env with live API key:**
- Issue: `projects/mercado-bot-dev/dashboard/.env` contains a real Anthropic API key and is present on disk (not tracked by git currently, but the `.gitignore` only covers `.env` at root level of that dashboard dir). The key is already exposed in committed source files anyway
- Files: `projects/mercado-bot-dev/dashboard/.env`
- Impact: If accidentally committed (or already in git history of another branch), secret is permanently exposed
- Fix approach: Rotate the key immediately. Add `.env` to root `.gitignore` with recursive glob (`**/.env`). Audit git history for any prior commits containing the key

**`anthropic-dangerous-direct-browser-access` usage:**
- Issue: Two projects use `anthropic-dangerous-direct-browser-access: true` header to call the Anthropic API directly from the browser, bypassing CORS restrictions. This is explicitly discouraged by Anthropic for production use
- Files: `projects/mercado-bot-dev/dashboard/src/components/Dashboard.jsx`, `projects/longevite-therapeutics/widget.js`
- Impact: Exposes API key client-side, no rate limiting, no auth layer, anyone can make requests on your account
- Fix approach: Create lightweight backend proxies (Express/Hono) for each project to handle Anthropic API calls server-side

**Missing `campaigns` module:**
- Issue: CLAUDE.md module library references a `campaigns` module, but it does not exist in `/modules/`. Only 7 of 8 declared modules exist
- Files: `modules/` (missing `campaigns/`), `CLAUDE.md` (line referencing campaigns module)
- Impact: When a project reaches growth stage and needs campaigns, there is no template to copy
- Fix approach: Create `modules/campaigns/campaigns.md` template

**Submodules stuck at old commits:**
- Issue: All four git submodules (`espacio-bosques`, `lool-ai`, `freelance-system`, `longevite-therapeutics`) show as modified (`m` in git status) meaning venture-os points to older commits than what exists in the submodule working trees
- Files: `.gitmodules`, `projects/espacio-bosques`, `projects/freelance-system`, `projects/lool-ai`, `projects/longevite-therapeutics`
- Impact: Anyone cloning venture-os gets stale submodule versions. The recorded state drifts from actual state, making the monorepo unreliable as a single source of truth
- Fix approach: Run `git submodule update --remote` and commit the updated submodule references regularly. Consider a post-session hook

**Dump files never routed:**
- Issue: `dump/` contains 5 deep-dive markdown files (lool-ai, espacio-bosques, longevite-therapeutics, freelance-system, venture-os-master) plus a routing log. The routing log is empty beyond the header, suggesting these files were dropped but never processed per the ROUTING.md protocol
- Files: `dump/lool-ai.md`, `dump/espacio-bosques.md`, `dump/longevite-therapeutics.md`, `dump/freelance-system.md`, `dump/venture-os-master.md`, `dump/routing-log.md`
- Impact: Stale intake documents sitting unprocessed. Either route them or archive them
- Fix approach: Process each dump file per ROUTING.md protocol, then remove from dump/

## Security Considerations

**API key rotation urgently needed:**
- Risk: The same Anthropic API key is hardcoded in at least 3 locations (2 JS source files + 1 .env). It is visible to anyone who loads the longevite-therapeutics widget or the mercado-bot dashboard in a browser
- Files: `projects/mercado-bot-dev/dashboard/src/components/Dashboard.jsx`, `projects/longevite-therapeutics/widget.js`, `projects/mercado-bot-dev/dashboard/.env`
- Current mitigation: None
- Recommendations: 1) Rotate the Anthropic API key immediately. 2) Move all API calls behind server-side proxies. 3) Add pre-commit hook to detect hardcoded keys (e.g., `detect-secrets`)

**CREDENTIALS.md in public repo:**
- Risk: `CREDENTIALS.md` documents the full credential inventory, env var names, cloud console URLs, project IDs (Supabase `rycybujjedtofghigyxm`), and setup procedures. While it does not contain actual secrets, it provides a detailed attack surface map
- Files: `CREDENTIALS.md`
- Current mitigation: Actual secrets are in a private dotfiles repo
- Recommendations: Consider whether this level of detail should be in a potentially public repo. The Supabase project ref is effectively public info but the full credential map aids targeted attacks

**No authentication on espacio-bosques test endpoints:**
- Risk: Test endpoints like `/api/test/reset` can wipe application state. They are guarded only by `SIMULATION_MODE=true` env var, not by auth
- Files: `projects/espacio-bosques/backend/src/routes/simulation.ts`
- Current mitigation: Only active in simulation/dev mode
- Recommendations: Add basic auth token to test endpoints even in dev mode

## Performance Bottlenecks

**Vendored face-api.js (5,009 lines):**
- Problem: `projects/lool-ai/vendor/face-api.js` is a 5,009-line vendored library committed to the repo
- Files: `projects/lool-ai/vendor/face-api.js`
- Cause: Vendored instead of installed as npm dependency
- Improvement path: Install `face-api.js` via npm and remove vendored copy. Or use a CDN with integrity hash

**Committed dist/ build artifacts:**
- Problem: `projects/mercado-bot-dev/dashboard/dist/` contains compiled build output committed to git (796 lines of minified JS)
- Files: `projects/mercado-bot-dev/dashboard/dist/assets/index-DMqZV-P8.js`
- Cause: dist/ not in .gitignore
- Improvement path: Add `dist/` to `.gitignore`, remove from tracking with `git rm --cached`

**90+ screenshots committed to repo:**
- Problem: `outputs/screenshots/` contains 90+ PNG/JPEG screenshots across projects, all committed to git history
- Files: `outputs/screenshots/espacio-bosques/` (70+ files), `outputs/screenshots/venture-os/` (4 files), `outputs/screenshots/longevite-therapeutics/` (6 files), `outputs/screenshots/ozum/` (1 file)
- Cause: Playwright verification screenshots are saved and committed
- Improvement path: Add screenshots to `.gitignore` or move to external storage (Cloudflare R2 as documented in CLAUDE.md). They bloat git history permanently

## Fragile Areas

**PROJECTS.md as single source of truth:**
- Files: `PROJECTS.md`
- Why fragile: Updated manually by Claude at session end. Any interrupted session leaves stale data. No validation that listed URLs, stages, or module statuses match reality
- Safe modification: Always read before writing; use patch semantics (update sections, not full rewrite)
- Test coverage: None. No automated check that PROJECTS.md reflects actual repo state

**CLAUDE.md instruction complexity:**
- Files: `CLAUDE.md` (587 lines)
- Why fragile: Every session depends on Claude correctly interpreting and following a 587-line instruction document with interdependent protocols (dispatch, verification, intake, trickle-down, conflict detection). Any misinterpretation cascades. The document has grown organically and contains some redundancy
- Safe modification: Changes should be tested by running a full session after modification
- Test coverage: No automated validation of CLAUDE.md consistency

## Dependencies at Risk

**Shared Supabase instance across all projects:**
- Risk: All projects share one Supabase project (`rycybujjedtofghigyxm`). A schema migration or accidental deletion in one project can affect all others. Table prefix convention is the only isolation mechanism
- Impact: Data corruption in one project could cascade
- Migration plan: Consider separate Supabase projects per product before any project reaches production. At minimum, document all table prefixes in `learnings/supabase-registry.md` (already exists but needs ongoing maintenance)

**Memory MCP marked UNTESTED:**
- Risk: `tools/registry.md` marks the Memory MCP (Supabase-backed) as UNTESTED, yet sessions reference memory recall/remember operations. If the MCP fails silently, cross-session context is lost
- Impact: Session continuity depends on working memory. Silent failures mean lost decisions
- Migration plan: Run explicit integration test of remember/recall cycle and update registry verdict

## Test Coverage Gaps

**No tests for any project except espacio-bosques contracts:**
- What's not tested: mercado-bot dashboard (0 tests), longevite-therapeutics (0 tests), lool-ai (0 tests). Only espacio-bosques has test files: Solidity contract tests (`contracts/test/`) and one Playwright smoke spec (`frontend/tests/smoke.spec.ts`)
- Files: `projects/mercado-bot-dev/` (no test files), `projects/longevite-therapeutics/` (no test files), `projects/lool-ai/` (no test files)
- Risk: Any refactor or feature addition has no safety net. Regressions go unnoticed until manual inspection
- Priority: High for espacio-bosques backend (active development), Medium for mercado-bot (simulation-only), Low for longevite (static site)

**No CI/CD pipeline:**
- What's not tested: No GitHub Actions, no pre-commit hooks, no automated linting or type checking
- Files: No `.github/workflows/` directory exists
- Risk: Broken code can be committed and pushed without any automated gate
- Priority: High - add at minimum a lint + type-check workflow for TypeScript projects

---

*Concerns audit: 2026-04-13*
