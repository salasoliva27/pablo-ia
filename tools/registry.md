# TOOLS REGISTRY
## Pablo IA | Last updated: 2026-04-22

Single source of truth for all MCP tools across Pablo IA.
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
Read/write repos. Auto-commit, push, create repos.
`GITHUB_TOKEN` loads from dotfiles. Used on every session.

### Brave Search MCP
**Verdict:** GOOD
Core tool for research agent. Works well for current web results.

### Google Workspace MCP
**Verdict:** DISABLED — triggers Chrome OAuth popup every session (redirect_uri_mismatch)
**Install:** `@googleworkspace/cli mcp -s drive,gmail,calendar,sheets,slides,docs,forms,tasks,chat`
**Keys:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
Re-enable only when: tokens can be persisted in dotfiles OR a service account approach is configured. Gmail already works via `mcp__claude_ai_Gmail` integration.

### Google Drive CLI (scripts/gdrive)
**Verdict:** GOOD — autonomous Drive control via OAuth refresh token (no browser popups after one-time auth)
**Install:** Ships with this repo at `scripts/gdrive`. Python 3 + `requests` only.
**Keys:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` (mint via `scripts/gdrive auth` once, then persist in the user's dotfiles `.env`)
**Why it exists:** The `claude_ai_Google_Drive` integration MCP exposes read + create_file only — no create_folder, no delete, no move. This CLI fills the gap so any session can autonomously create/delete/move/share Drive content under `/Pablo_AI/`.
**Commands:** `auth`, `ls`, `mkdir` (recursive), `mv`, `rm` (`--purge` for hard-delete), `upload`, `download`, `find`, `id`, `share`.
**Paths:** slash-delimited, rooted at My Drive. Use `""` or `"/"` for root.

### Memory MCP (Supabase)
**Verdict:** GOOD
**Install:** Custom server at `mcp-servers/memory/` — run `npm install` in that dir after fresh Codespace
**Keys:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (both required), `VOYAGE_API_KEY` (optional, for semantic search)
**Known issue:** `npm install` must be run in `/workspaces/pablo-ia/mcp-servers/memory/` on every new Codespace — `node_modules` not committed.
Full-text search works without `VOYAGE_API_KEY`; semantic search is an optional upgrade.

### Playwright MCP
**Verdict:** GOOD
Visual verification for all frontend changes. Owned by ux agent.
Note: run `npx playwright install chromium` once per Codespace.

### Spline MCP (spline-mcp-server)
**Verdict:** SITUATIONAL — use for Spline 3D scene generation code
**Install:** `git clone https://github.com/Tarif-dev/spline-mcp-server /tmp/spline-mcp-server && cd /tmp/spline-mcp-server && npm install && npx tsc`
**Config:** `~/.claude/settings.json` → `mcpServers.spline` (points to `/tmp/spline-mcp-server/dist/index.js`)
**Keys:** `SPLINE_API_KEY` (optional), `SPLINE_DEFAULT_FRAMEWORK=react`
**Scope:** Code generation for `@splinetool/react-spline` embeds. Does NOT create/edit scenes — use Spline editor for that.
**Note:** Python `lesleslie/spline-mcp` requires Python 3.13+ (incompatible with Codespace 3.12).

### Filesystem, Fetch, Sequential Thinking
**Verdict:** GOOD — built-in, no credentials

### n8n MCP
**Verdict:** UNTESTED — `N8N_API_KEY` + `N8N_BASE_URL` needed

### Cloudflare MCP
**Verdict:** UNTESTED — activate when campaigns module goes live

### Context7
**Verdict:** GOOD
**Install:** `npx -y @upstash/context7-mcp` | **Keys:** None
Use for any library/framework/API documentation lookup.

---

## KNOWLEDGE MANAGEMENT

### Obsidian MCP (obsidian-mcp)
**Verdict:** UNTESTED — HIGH PRIORITY for knowledge base integration
**Install options:**
- Option A (community plugin): Install "Local REST API" plugin in Obsidian → enable → set API key → `claude mcp add obsidian https://localhost:27123`
- Option B (standalone): `npx -y obsidian-mcp` (reads vault directly from filesystem, no plugin needed)
**Keys:** Obsidian API key (if using Local REST API plugin), or vault path (if filesystem mode)
**Setup:** Set vault path in dotfiles as `OBSIDIAN_VAULT_PATH`
**Why:** Read/write the Obsidian vault directly from Claude sessions. Useful for: capturing research notes, reading existing knowledge base, syncing learnings from sessions back to vault.
**Agent ownership:** research agent + calendar agent (for meeting notes)
**Coordination:** Learnings that belong in vault → write to Obsidian. Learnings that belong in pablo-ia → write to `learnings/` files. Don't double-write.

---

## HIGH PRIORITY — NOT YET CONFIGURED

### NotebookLM MCP
**Verdict:** UNTESTED — HIGH PRIORITY for research agent
**Install:** `claude mcp add notebooklm npx notebooklm-mcp@latest`
**Auth:** One-time Google login (use dedicated Google account)
**Why:** Source-grounded, citation-backed answers from uploaded docs. Zero hallucinations — only answers from what you uploaded. 20M token context window. Supports audio overviews, mind maps, quizzes.
**Use cases:** Market research notebooks, product documentation, competitor analysis.
**Owned by:** research agent
**Automation script:** `tools/configs/notebooklm_automation.py`

### Supabase MCP (official)
**Verdict:** UNTESTED — HIGH PRIORITY
**Install:** `npx -y @supabase/mcp-server-supabase`
**Keys:** Supabase project URL + service role key
**Why:** Already using Supabase for memory — full MCP adds table management, auth, SQL, edge functions.

### Figma MCP
**Verdict:** UNTESTED — HIGH PRIORITY for design work
**Install:** Via Figma Dev Mode settings | **Keys:** Figma Dev Mode token
**Why:** Design-to-code. Reads live Figma layer structure.

### Firecrawl MCP
**Verdict:** UNTESTED — HIGH PRIORITY for GTM research
**Install:** `npx -y firecrawl-mcp` | **Keys:** `FIRECRAWL_API_KEY` (free tier)
**Why:** Web scraping for competitor sites and targeted market research.

### claude-skills-mcp
**Verdict:** UNTESTED — HIGH PRIORITY for skill discovery
**Install:** `uvx claude-skills-mcp` — semantic search across 40,000+ skills from inside sessions

---

## RECOMMENDED — ADD WHEN READY

### Netlify MCP
**Verdict:** READY TO ACTIVATE — needs `NETLIFY_AUTH_TOKEN` in dotfiles
**Install:** OAuth via Netlify
**Why:** Deploy sites, manage functions and domains from Claude.
**Action needed:** app.netlify.com → User settings → Applications → Personal access tokens → add to dotfiles as `NETLIFY_AUTH_TOKEN`.

### Exa Search
**Verdict:** UNTESTED
**Install:** `npx -y exa-mcp-server` | **Keys:** `EXA_API_KEY` (free tier)
**Why:** Semantic search — finds conceptually similar results, better for nuanced research than Brave.

### Notion MCP
**Verdict:** UNTESTED — NOTE: Notion tools already appear via claude.ai integration (`mcp__claude_ai_Notion`)
**Install:** `npx -y @notionhq/notion-mcp-server` | **Keys:** Notion API key
**Why:** May already be functional via existing integration — test first before installing separately.

### Linear MCP
**Verdict:** UNTESTED
**Install:** OAuth via Linear settings
**Why:** Structured task tracking for complex builds.

### Apify Actors
**Verdict:** UNTESTED
**Install:** `npx -y @apify/mcp-server` | **Keys:** Apify API key (free tier)
**Why:** 4,000+ scrapers — Instagram, LinkedIn, Google Maps for GTM research.

### Stripe MCP
**Verdict:** UNTESTED — add when first paying customer lands
**Install:** Via Stripe agent toolkit | **Keys:** Stripe API key

### Sentry MCP
**Verdict:** UNTESTED — add once something is live
**Install:** OAuth via `mcp.sentry.dev/mcp`

### Human MCP
**Verdict:** UNTESTED — campaigns module
**Install:** `npx -y human-mcp`
**Keys:** Google Gemini API, MiniMax API, ElevenLabs API
**Why:** Image gen, video gen, music, SFX, TTS — 29 tools in one.

### Ayrshare MCP
**Verdict:** UNTESTED — campaigns module
**Install:** `npx -y ayrshare-mcp` | **Keys:** Ayrshare API (~$29/month)
**Why:** Post to 13+ social platforms from Claude.

### Remotion (video generation framework)
**Verdict:** UNTESTED — HIGH PRIORITY
**Type:** Build tool (npm package, not an MCP server)
**Install:** `npm create video@latest` (new project) or `npm install remotion @remotion/bundler @remotion/renderer` (existing)
**Keys:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` (Lambda renders). Local rendering works without these.
**Why:** React → MP4 at ~$0.01/render-minute (Lambda) or free locally.

---

## VAULT + MEMORY TOOLS

### claude-mem
**Verdict:** GOOD
**Install:** `npx claude-mem install` (plugin marketplace)
**Why:** Automatic session compression + memory. Hooks into lifecycle. Web viewer at `localhost:37777`. Replaces manual `remember()` for standard sessions.

### mcpvault (obsidian-vault MCP)
**Verdict:** SITUATIONAL — connects but fragile. Directory listing can fail; individual note reads may fail.
**Package:** `@bitbonsai/mcpvault`
**Vault path:** `/workspaces/pablo-ia`
**Why:** Read/write vault markdown from Codespace. Enables Claude to navigate `wiki/` and `[[wiki links]]` programmatically.
**Known issues:**
1. Root listing crashes if `node_modules/` has symlinks (ENOENT). The vault root shares space with project code.
2. `read_note` and `search_notes` may return empty/error even when files exist at the specified path.
3. MCP can disconnect mid-session and not reconnect — requires session restart.
**Workaround:** Use direct file reads (`Read` tool) for vault content until this MCP stabilizes. Write vault updates via direct file writes.

### obra/knowledge-graph
**Verdict:** UNTESTED — in `.mcp.json`, needs first use to validate
**Package:** `obra-knowledge-graph`
**Why:** Graph traversal on vault. `kg_search`, `kg_paths`, `kg_common`, `kg_subgraph`.

### Supabase MCP (HTTP, remote)
**Verdict:** GOOD
**Type:** HTTP MCP (remote)
**URL:** `https://mcp.supabase.com/mcp`
**Required env:** `SUPABASE_ACCESS_TOKEN` (get from supabase.com/dashboard/account/tokens), `SUPABASE_PROJECT_REF`
**Why:** Manage Supabase tables, run migrations, inspect RLS policies directly from Claude Code. No more copy-paste SQL.

### Graphify
**Verdict:** BAD/AVOID — packages not stable
**pip graphify:** Does not exist (404 on PyPI)
**npm `@mohammednagy/graphify-ts`:** Broken peer dep (missing typescript module).
**Why:** Intended for codebase structure graph. Check back in a few months.

---

## VISUALIZATION & FINANCIAL DATA MCPs

### antvis/mcp-server-chart
**Install:** `npx -y @antv/mcp-server-chart`
**Verdict:** AVAILABLE — 25+ chart types (line, bar, pie, scatter, heatmap). Useful for financial dashboards and portfolio P&L visualization. No API key needed.

### OctagonAI/octagon-mcp-server
**Install:** `npx -y octagon-mcp`
**Verdict:** AVAILABLE — public SEC filings, earnings transcripts, financial metrics, private market transactions, deep web research. Free tier available.

### Vega-Lite MCP (isaacwasserman)
**Install:** `claude mcp add vega-lite -- npx -y @isaacwasserman/mcp-vegalite-server`
**Verdict:** AVAILABLE — interactive data visualizations from JSON specs directly in Claude. PNG or artifact output.

### agentic-ops/legal-mcp
**Install:** `npx -y legal-mcp` (check repo for latest)
**Verdict:** AVAILABLE — comprehensive legal workflows MCP, document analysis, case research. US-focused but adaptable.

### TCoder920x/open-legal-compliance-mcp
**Install:** see `github.com/TCoder920x/open-legal-compliance-mcp`
**Verdict:** RESEARCHED — uses free/open government APIs for compliance.

### VoltAgent/awesome-design-md
**Install:** Copy DESIGN.md from `https://github.com/VoltAgent/awesome-design-md` into project root
**Verdict:** QUEUED — 66 production-extracted DESIGN.md files (Stripe, Linear, Supabase, Vercel, Apple, Coinbase, etc.)
**Use for:** Any new project at design phase. Drop matching DESIGN.md into repo root, agent reads it for pixel-consistent UI generation. No tooling needed — plain markdown.
**Install CLI:** `npx getdesign@latest add [brand]` — saves DESIGN.md to current directory.

---

## REJECTED / AVOID
*(Populate as bad experiences accumulate)*

## SITUATIONAL
*(Populate with nuanced verdicts)*

---

## Vault connections
- [[CLAUDE]] · [[skills/registry]]
- [[agents/core/developer]] · [[agents/core/ux]] · [[agents/core/security]] · [[agents/core/evolve]]
