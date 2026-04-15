# TOOLS REGISTRY
## Janus IA | Last updated: 2026-04-03

Single source of truth for all MCP tools across Janus IA.
Updated after every session where a tool is used.

**Verdicts:** GOOD · SITUATIONAL · BAD/AVOID · UNTESTED
**Entry format:** [DATE] — [PROJECT] — [VERDICT]: [notes]

---

## HOW AGENTS USE THIS FILE

Before starting any task, the relevant agent reads this file:
1. Find tools relevant to the task type
2. Only use tools marked GOOD or SITUATIONAL
3. Skip BAD/AVOID — find alternative
4. UNTESTED → try it, log the result before session ends

Probe live if registry says GOOD but tool fails to load:
```bash
claude mcp search "[capability]"  # lazy load, 95% context savings
```

---

## ACTIVELY CONFIGURED (in .mcp.json)

### GitHub MCP
**Verdict:** GOOD
Read/write all repos under janus-ia org. Auto-commit, push, create repos.
GITHUB_TOKEN loads from dotfiles. Used on every session.
- [2026-03-26] — longevite-therapeutics — GOOD: searched repo, read files, pushed 3 files cleanly

### Brave Search MCP
**Verdict:** GOOD
Mexico/LATAM queries return good results. Core tool for research agent.
- Session log: lool-ai validation, freelance-system lead search

### Google Workspace MCP
**Verdict:** DISABLED — triggers Chrome OAuth popup every session (redirect_uri_mismatch)
**Install:** `@googleworkspace/cli mcp -s drive,gmail,calendar,sheets,slides,docs,forms,tasks,chat`
**Keys:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- [2026-03-30] — janus — BAD (for now): Removed from .mcp.json. `@alanse/mcp-server-google-workspace` tries to auth on every startup because OAuth tokens aren't persisted between Codespace sessions. This opens Chrome with an OAuth flow that fails (redirect_uri_mismatch). Gmail already works via `mcp__claude_ai_Gmail` integration. Re-enable only when: tokens can be persisted in dotfiles OR a service account approach is configured.

### Memory MCP (Supabase)
**Verdict:** UNTESTED — needs Supabase setup + setup.sql
**Install:** Custom server at mcp-servers/memory/
**Keys:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Full-text search works without VOYAGE_API_KEY; semantic search optional upgrade

### Playwright MCP
**Verdict:** GOOD
Visual verification for all frontend changes. Owned by ux agent.
Note: run `npx playwright install chromium` once per Codespace.
- [2026-03-26] — longevite-therapeutics — GOOD: browser_install needed once per environment. Navigate + screenshot work perfectly after that.

### Spline MCP (spline-mcp-server)
**Verdict:** SITUATIONAL — use for Spline 3D scene generation code
**Install:** `git clone https://github.com/Tarif-dev/spline-mcp-server /tmp/spline-mcp-server && cd /tmp/spline-mcp-server && npm install && npx tsc`
**Config:** `~/.claude/settings.json` → mcpServers.spline (already added, points to /tmp/spline-mcp-server/dist/index.js)
**Keys:** `SPLINE_API_KEY` (optional), `SPLINE_DEFAULT_FRAMEWORK=react`
**Scope:** Code generation for @splinetool/react-spline embeds. Does NOT create/edit scenes — use Spline editor for that.
**To activate scenes in espacio-bosques:** Set `VITE_SPLINE_HERO` and `VITE_SPLINE_ACCENT` in `.env` to published .splinecode URLs.
**Note:** Python lesleslie/spline-mcp requires Python 3.13+ (incompatible with Codespace 3.12).
- [2026-04-07] — espacio-bosques — SITUATIONAL: Installed Node.js version. Landing.tsx wired with lazy Spline + error boundary. Awaiting real scene URLs from Jano.

### Filesystem, Fetch, Sequential Thinking
**Verdict:** GOOD — built-in, no credentials

### n8n MCP
**Verdict:** UNTESTED — N8N_API_KEY + N8N_BASE_URL needed

### Cloudflare MCP
**Verdict:** UNTESTED — activate when campaigns module goes live

### Context7
**Verdict:** CONFIGURED — needs real-use test
**Install:** `npx -y @upstash/context7-mcp` | **Keys:** None
- [2026-03-26] — janus — Added to .mcp.json. Will activate on next session start.

---

---

## KNOWLEDGE MANAGEMENT

### Obsidian MCP (obsidian-mcp)
**Verdict:** UNTESTED — HIGH PRIORITY for knowledge base integration
**Install options:**
- Option A (community plugin): Install "Local REST API" plugin in Obsidian → enable → set API key → `claude mcp add obsidian https://localhost:27123`
- Option B (standalone): `npx -y obsidian-mcp` (reads vault directly from filesystem, no plugin needed)
**Keys:** Obsidian API key (if using Local REST API plugin), or vault path (if filesystem mode)
**Setup:** Set vault path in dotfiles as `OBSIDIAN_VAULT_PATH`
**Why:** Read/write Jano's Obsidian vault directly from Claude sessions. Useful for: capturing research notes, reading existing knowledge base, syncing learnings from sessions back to vault.
**Agent ownership:** research agent + calendar agent (for meeting notes)
**Coordination:** Learnings that belong in vault → write to Obsidian. Learnings that belong in janus-ia → write to learnings/ files. Don't double-write.
**Session log:** none yet

---

## HIGH PRIORITY — NOT YET CONFIGURED

### NotebookLM MCP ⚡
**Verdict:** UNTESTED — HIGH PRIORITY for research agent
**Install:** `claude mcp add notebooklm npx notebooklm-mcp@latest`
**Auth:** One-time Google login (use dedicated Google account)
**Why:** Source-grounded, citation-backed answers from your uploaded docs.
Zero hallucinations — only answers from what you uploaded.
20M token context window. Supports audio overviews, mind maps, quizzes.
**Use cases:** Market research notebooks, product documentation, competitor analysis.
**Owned by:** research agent
**Automation script:** tools/configs/notebooklm_automation.py
**Session log:** none yet

### Supabase MCP (official)
**Verdict:** UNTESTED — HIGH PRIORITY
**Install:** `npx -y @supabase/mcp-server-supabase`
**Keys:** Supabase project URL + service role key
**Why:** Already using Supabase for memory — full MCP adds table management, auth, SQL, edge functions
**Session log:** none yet

### Figma MCP
**Verdict:** UNTESTED — HIGH PRIORITY for lool-ai + nutrIA design work
**Install:** Via Figma Dev Mode settings | **Keys:** Figma Dev Mode token
**Why:** Design-to-code. Reads live Figma layer structure.
**Session log:** none yet

### Firecrawl MCP
**Verdict:** UNTESTED — HIGH PRIORITY for GTM research
**Install:** `npx -y firecrawl-mcp` | **Keys:** `FIRECRAWL_API_KEY` (free tier)
**Why:** Web scraping for optical store research, competitor sites.
**Session log:** none yet

### claude-skills-mcp
**Verdict:** UNTESTED — HIGH PRIORITY for skill discovery
**Install:** `uvx claude-skills-mcp` — semantic search across 40,000+ skills from inside sessions
**Session log:** none yet

---

## RECOMMENDED — ADD WHEN READY

### Netlify MCP
**Verdict:** READY TO ACTIVATE — needs NETLIFY_AUTH_TOKEN in dotfiles
**Install:** OAuth via Netlify
**Why:** Deploy sites, manage functions and domains from Claude — nutrIA-app will use this
**Action needed:** app.netlify.com → User settings → Applications → Personal access tokens → add to dotfiles as NETLIFY_AUTH_TOKEN
- [2026-04-02] — nutrIA build complete, netlify.toml written, ready to connect

### Exa Search
**Verdict:** UNTESTED
**Install:** `npx -y exa-mcp-server` | **Keys:** `EXA_API_KEY` (free tier)
**Why:** Semantic search — finds conceptually similar results, better for nuanced research than Brave

### Notion MCP
**Verdict:** UNTESTED — NOTE: Notion tools already appear via claude.ai integration (mcp__claude_ai_Notion)
**Install:** `npx -y @notionhq/notion-mcp-server` | **Keys:** Notion API key
**Why:** May already be functional via existing integration — test first before installing separately.

### Linear MCP
**Verdict:** UNTESTED
**Install:** OAuth via Linear settings
**Why:** Structured task tracking for complex builds

### Apify Actors
**Verdict:** UNTESTED
**Install:** `npx -y @apify/mcp-server` | **Keys:** Apify API key (free tier)
**Why:** 4,000+ scrapers — Instagram, LinkedIn, Google Maps for GTM research

### Stripe MCP
**Verdict:** UNTESTED — add when lool-ai has first paying customer
**Install:** Via Stripe agent toolkit | **Keys:** Stripe API key

### Sentry MCP
**Verdict:** UNTESTED — add when lool-ai goes live
**Install:** OAuth via `mcp.sentry.dev/mcp`

### Human MCP
**Verdict:** UNTESTED — campaigns module
**Install:** `npx -y human-mcp`
**Keys:** Google Gemini API, MiniMax API, ElevenLabs API
**Why:** Image gen, video gen, music, SFX, TTS — 29 tools in one

### Ayrshare MCP
**Verdict:** UNTESTED — campaigns module
**Install:** `npx -y ayrshare-mcp` | **Keys:** Ayrshare API (~$29/month)
**Why:** Post to 13+ social platforms from Claude

### Cowork Computer Use ⚡ (released March 24 2026)
**Verdict:** UNTESTED
**Install:** Claude Desktop → Settings → Enable computer use (Pro/Max, Mac only, research preview)
**Why:** Claude controls your Mac. Pairs with Dispatch for phone-to-desktop task assignment.

### Remotion (video generation framework)
**Verdict:** UNTESTED — HIGH PRIORITY
**Type:** Build tool (npm package, not an MCP server)
**Install:** `npm create video@latest` (new project) or `npm install remotion @remotion/bundler @remotion/renderer` (existing)
**Keys:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` — placeholders in dotfiles. Lambda deferred — local rendering works fine for now.
**Why:** React → MP4 at $0.01/render-minute.
**Use cases:** longevite therapy reels, espacio-bosques project update videos, lool-ai store demo videos, freelance-system new service type
- [2026-04-01] — janus — REGISTERED: Added to TOOLS.md + AWS placeholders to dotfiles. Not yet used in any project build.

---

## VAULT + MEMORY TOOLS (added 2026-04-13)

### claude-mem
**Verdict:** GOOD
**Install:** `npx claude-mem install` (plugin marketplace)
**Version:** 12.1.0
**Why:** Automatic session compression + memory. Hooks into lifecycle. Web viewer at localhost:37777. Replaces manual remember() for standard sessions.
- [2026-04-13] — janus — GOOD: Installed successfully. Hooks registered via marketplace plugin.

### mcpvault (obsidian-vault MCP)
**Verdict:** UNTESTED — in .mcp.json, needs first use to validate
**Package:** `@bitbonsai/mcpvault`
**Vault path:** /workspaces/venture-os
**Why:** Read/write vault markdown from Codespace. 14 tools. Enables Claude to navigate wiki/ and [[wiki links]] programmatically.
- [2026-04-13] — janus — REGISTERED: Added to .mcp.json. First use will validate.

### obra/knowledge-graph
**Verdict:** UNTESTED — in .mcp.json, needs first use to validate
**Package:** `obra-knowledge-graph`
**Why:** Graph traversal on vault. kg_search, kg_paths, kg_common, kg_subgraph. "Find all files connected to both lool-ai and the legal agent."
- [2026-04-13] — janus — REGISTERED: Added to .mcp.json. First use will validate.

### Supabase MCP
**Verdict:** PENDING — blocked on SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF in dotfiles
**Type:** HTTP MCP (remote)
**URL:** https://mcp.supabase.com/mcp
**Required env:** SUPABASE_ACCESS_TOKEN (get from supabase.com/dashboard/account/tokens), SUPABASE_PROJECT_REF=rycybujjedtofghigyxm
**Why:** Manage Supabase tables, run migrations, inspect RLS policies directly from Claude Code. No more copy-paste SQL.
- [2026-04-13] — janus — UNTESTED: Added to .mcp.json. SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF loaded in dotfiles. Needs first use to validate.

### Graphify
**Verdict:** BAD/AVOID — packages not stable
**pip graphify:** Does not exist (404 on PyPI)
**npm @mohammednagy/graphify-ts@0.1.5:** Broken peer dep (missing typescript module). Published 2026-04-12.
**Why:** Intended for codebase structure graph. Check back in a few months.
- [2026-04-13] — janus — BAD/AVOID: Both pip and npm packages broken. Do not attempt.

---

## REJECTED / AVOID
*(Populate as bad experiences accumulate)*

## SITUATIONAL
*(Populate with nuanced verdicts)*

## Vault connections
- [[CLAUDE]] · [[learnings/mcp-registry]]
- [[agents/core/developer]] · [[agents/core/ux]] · [[agents/core/security]]

---

## VISUALIZATION & FINANCIAL DATA MCPs — AVAILABLE (researched 2026-04-13)

### antvis/mcp-server-chart
**Install:** `npx -y @antv/mcp-server-chart`
**Verdict:** AVAILABLE — 25+ chart types (line, bar, pie, scatter, heatmap). Useful for financial dashboards and portfolio P&L visualization. No API key needed.
**Use for:** [[agents/core/financial]] portfolio charts, [[wiki/mercado-bot]] P&L visualization

### OctagonAI/octagon-mcp-server
**Install:** `npx -y octagon-mcp`
**Verdict:** AVAILABLE — public SEC filings, earnings transcripts, financial metrics, private market transactions, deep web research. Free tier available.
**Use for:** [[agents/core/research]] competitor analysis, [[wiki/lool-ai]] market research, [[wiki/espacio-bosques]] comparable DAO analysis

### Vega-Lite MCP (isaacwasserman)
**Install:** `claude mcp add vega-lite -- npx -y @isaacwasserman/mcp-vegalite-server`
**Verdict:** AVAILABLE — interactive data visualizations from JSON specs directly in Claude. PNG or artifact output.
**Use for:** Ad-hoc portfolio charts, market research visualization, session-level data analysis

### Miranda Intelligence (miranda-intelligence.com)
**Verdict:** RESEARCHED — Mexico fintech newsletter. Free articles. Covers CNBV, Banxico, Bitso, CONDUSEF regulatory updates monthly.
**Use for:** [[agents/core/research]] MX fintech market updates, [[wiki/espacio-bosques]] regulatory monitoring
**Key stat found:** Bitso processed $6.5B USD in stablecoin remittances in 2024 — validates espacio-bosques market opportunity

### agentic-ops/legal-mcp
**Install:** `npx -y legal-mcp` (check repo for latest)
**Verdict:** AVAILABLE — comprehensive legal workflows MCP, document analysis, case research. US-focused but adaptable.
**Use for:** [[agents/core/legal]] document review, contract analysis

### TCoder920x/open-legal-compliance-mcp
**Install:** see github.com/TCoder920x/open-legal-compliance-mcp
**Verdict:** RESEARCHED — uses free/open government APIs for compliance. Most relevant for Mexico since SAT/CNBV have public APIs.
**Use for:** [[agents/core/legal]] compliance checks, [[wiki/espacio-bosques]] regulatory monitoring

### VoltAgent/awesome-design-md
**Install:** Copy DESIGN.md from https://github.com/VoltAgent/awesome-design-md into project root
**Verdict:** QUEUED — 66 production-extracted DESIGN.md files (Stripe, Linear, Supabase, Vercel, Apple, Coinbase, etc.)
**Use for:** Any new project at design phase. Drop matching DESIGN.md into repo root, agent reads it for pixel-consistent UI generation. No tooling needed — plain markdown.
**Best matches (confirmed from repo, 55+ available):**
- espacio-bosques → `coinbase` or `revolut` or `wise` (fintech, trust, dark)
- lool-ai → `linear.app` (B2B SaaS, clean)
- longevite → `apple` (premium health, minimalist)
- nutrIA → `mintlify` (health/docs, conversational)
- venture-os dashboard → `raycast` or `warp` (developer tool, dark terminal)
- mercado-bot → `kraken` (trading, dark)
- jp-ai → `intercom` (CRM, professional)
**Install:** `npx getdesign@latest add [brand]` — saves DESIGN.md to current directory.
**Pre-downloaded (in `/workspaces/venture-os/design-systems/`):**
- `coinbase-DESIGN.md` → espacio-bosques (fintech, trust UI)
- `linear-DESIGN.md` → lool-ai (B2B SaaS)
- `apple-DESIGN.md` → longevite (premium health)
- `raycast-DESIGN.md` → venture-os dashboard (developer tool)
- `kraken-DESIGN.md` → mercado-bot (trading terminal)

---

## SESSION LOG — 2026-04-15 (evolve session)

### Supabase MCP ✅
**Verdict:** VERIFIED WORKING — ran full security + performance audit via `get_advisors`. Applied 5 migrations fixing RLS, policies, indexes.
**Findings:** janus_memories had NO RLS (fixed), 4 RLS policies had per-row auth re-evaluation (fixed), missing FK index (fixed), duplicate index (fixed), 1 function search_path (fixed).

### Gmail (Claude-native) ✅
**Verdict:** WORKING — connected to salasoliva27@gmail.com, 38.5k messages. No MCP config needed.

### Google Drive (Claude-native) ✅
**Verdict:** WORKING — recent files accessible (Finanzas spreadsheet, Eclipse data dictionary).

### Google Calendar (Claude-native) ⚠️
**Verdict:** NEEDS OAUTH — authenticate tool available but requires user interaction.

### Notion (Claude-native) ⚠️
**Verdict:** AVAILABLE — search tool loaded but not tested. Needs Jano to connect.

### Memory MCP ❌
**Verdict:** BROKEN — path `/workspaces/janus-ia/` doesn't exist, should be `/workspaces/venture-os/`. Fix blocked by .mcp.json edit permissions. **Jano action: edit .mcp.json line with janus-ia → venture-os.**

### n8n MCP ❌
**Verdict:** NON-FUNCTIONAL — configured but `N8N_API_KEY` and `N8N_BASE_URL` not in env. **Jano action: add to dotfiles if n8n is being used.**

### Cloudflare MCP ❌
**Verdict:** NON-FUNCTIONAL — configured but `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` not in env. **Jano action: add to dotfiles when R2 media storage is needed.**

### Obsidian Vault MCP ✅
**Verdict:** VERIFIED WORKING — search_notes, read_note, write_note, patch_note all functional. Vault rooted at /workspaces/venture-os.

### WhatsApp MCP ⭐ QUEUED
**Best option:** `verygoodplugins/whatsapp-mcp` (Go bridge + Python MCP, well-maintained, updated Apr 12)
**Alt:** `FredShred7/whatsapp-mcp-server` (WhatsApp Cloud API, more official but needs Business account)
**Impact:** B2B outreach for lool-ai, client comms for longevite, jp-ai context extraction
**Needs:** Jano decision — personal WA bridge vs Business API. Personal bridge requires QR scan auth.

### Sentry MCP ⭐ QUEUED
**Install:** `npx -y @sentry/mcp` or Claude plugin `getsentry/sentry-for-ai`
**Verdict:** AVAILABLE — official Sentry MCP. Error monitoring, issue search, traces.
**Needs:** Sentry account + SENTRY_AUTH_TOKEN. Queue for post-deployment.

### Remotion Video MCP ⭐ QUEUED
**Install:** `npx -y remotion-video-mcp` (dev-arctik) or official docs MCP at remotion.dev/docs/ai/mcp
**Verdict:** AVAILABLE — programmatic video creation via Claude. React-based video engine.
**Use for:** Marketing videos for longevite, lool-ai demos, portfolio showcase
**Needs:** Remotion license for production renders (free for dev/preview)

### Stripe MCP ⭐ QUEUED
**Options:** `dahlinomine/mcp-stripe-bridge-1683` (subscriptions/invoices)
**Verdict:** AVAILABLE — community Stripe MCP. Handle subscriptions via natural language.
**Needs:** Stripe account + API key. Queue for revenue phase.
