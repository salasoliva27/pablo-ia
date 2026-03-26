# MCP REGISTRY — CURATED EXPERIENCE LOG
## Venture OS | Last updated: 2026-03-25

The system's accumulated knowledge about MCP tools and skills. Grows automatically — a brief entry after every session where a tool or skill is used, a full assessment after every project completes.

**Verdicts:** GOOD · SITUATIONAL · BAD/AVOID · UNTESTED
**Entry format:** `[DATE] — [PROJECT] — [VERDICT]: [notes]`

---

# SECTION 1: MCP TOOLS

---

## ACTIVELY CONFIGURED

### GitHub MCP
**Verdict:** GOOD | **Install:** Built into `.mcp.json`
- Repo management, auto-commit, push — reliable across all projects
- GITHUB_TOKEN loads correctly from dotfiles
- Session log: used across all projects, no failures
- [2026-03-26] — longevite-therapeutics — GOOD: searched repo, read files, pushed 3 files cleanly

### Brave Search MCP
**Verdict:** GOOD | **Install:** Built into `.mcp.json`
- Mexico/LATAM queries return useful results for market research
- Core tool for validation phase and GTM research
- Session log: lool-ai validation, freelance-system lead search

### Google Workspace MCP
**Verdict:** UNTESTED — needs one-time `gws auth setup`
**Install:** `@googleworkspace/cli mcp -s drive,gmail,calendar,sheets,slides,docs,forms,tasks,chat`
**Keys:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- Covers all Google tools in one server after auth

### Memory MCP (Supabase)
**Verdict:** UNTESTED — needs Supabase setup + setup.sql
**Install:** Custom server at mcp-servers/memory/
**Keys:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Full-text search works without VOYAGE_API_KEY; semantic search optional upgrade

### Playwright MCP
**Verdict:** GOOD | **Install:** Built into `.mcp.json`
- Portfolio screenshots work reliably
- [2026-03-26] — longevite-therapeutics — GOOD: browser_install needed once per environment (npx playwright install chromium first, then use browser_install tool). After that, navigate + screenshot work perfectly.

### Filesystem, Fetch, Sequential Thinking
**Verdict:** GOOD | Built-in, no credentials needed

### n8n MCP
**Verdict:** UNTESTED | **Keys:** `N8N_API_KEY`, `N8N_BASE_URL`

### Cloudflare MCP
**Verdict:** UNTESTED | **Keys:** `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
- Activate when campaigns module goes live

---

## DISCOVERED — HIGH PRIORITY

### Context7
**Verdict:** CONFIGURED — needs real-use test
- [2026-03-26] — venture-os — Added to .mcp.json. Will activate on next session start.
**Install:** `npx -y @upstash/context7-mcp` | **Keys:** None
**Why:** Live version-specific docs before generating code. Add "use context7" to any prompt. 89,000+ installs on related skill. Eliminates outdated API answers.
**Session log:** none yet

### claude-skills-mcp ⚡ NEW
**Verdict:** UNTESTED — HIGH PRIORITY
**Install:** `uvx claude-skills-mcp` | **Keys:** None
**Why:** Semantic search across 40,000+ skills without leaving Claude Code. find_helpful_skills() / read_skill_document() / list_skills(). Solves skill discovery permanently.
**Session log:** none yet

### Supabase MCP (official)
**Verdict:** UNTESTED — HIGH PRIORITY
**Install:** `npx -y @supabase/mcp-server-supabase`
**Keys:** Supabase project URL + service role key
**Why:** Already using Supabase for memory — full MCP adds table management, auth, SQL, edge functions
**Session log:** none yet

### Figma MCP (Official)
**Verdict:** UNTESTED — HIGH PRIORITY for lool-ai frontend
**Install:** Via Figma Dev Mode settings | **Keys:** Figma Dev Mode token
**Why:** Live layer structure for design-to-code on the widget UI
**Session log:** none yet

### Firecrawl
**Verdict:** UNTESTED — HIGH PRIORITY for lool-ai GTM
**Install:** `npx -y firecrawl-mcp` | **Keys:** `FIRECRAWL_API_KEY` (free tier)
**Why:** Web scraping for optical store research — contacts, existing digital presence
**Session log:** none yet

---

## DISCOVERED — RECOMMENDED

### Exa Search
**Verdict:** UNTESTED
**Install:** `npx -y exa-mcp-server` | **Keys:** `EXA_API_KEY` (free tier)
**Why:** Semantic search — finds conceptually similar results, better for nuanced research than Brave
**Session log:** none yet

### Linear MCP
**Verdict:** UNTESTED
**Install:** OAuth via Linear settings
**Why:** Structured task tracking for complex builds
**Session log:** none yet

### Docker MCP
**Verdict:** UNTESTED
**Install:** `npx -y @docker/mcp-server` | **Keys:** None (local Docker)
**Why:** Container management for lool-ai and espacio-bosques deployment
**Session log:** none yet

### Netlify MCP
**Verdict:** UNTESTED
**Install:** OAuth via Netlify
**Why:** Deploy sites, manage functions and domains from Claude
**Session log:** none yet

### Apify Actors
**Verdict:** UNTESTED
**Install:** `npx -y @apify/mcp-server` | **Keys:** Apify API key (free tier)
**Why:** 4,000+ scrapers — Instagram, LinkedIn, Google Maps for GTM research
**Session log:** none yet

---

## DISCOVERED — ADD WHEN READY

### Stripe MCP
**Verdict:** UNTESTED — add when lool-ai has first paying customer
**Install:** Via Stripe agent toolkit | **Keys:** Stripe API key
**Session log:** none yet

### Sentry MCP
**Verdict:** UNTESTED — add when lool-ai goes live
**Install:** OAuth via `mcp.sentry.dev/mcp`
**Session log:** none yet

### Human MCP
**Verdict:** UNTESTED — campaigns module
**Install:** `npx -y human-mcp`
**Keys:** Google Gemini API, MiniMax API, ElevenLabs API
**Why:** Image gen, video gen, music, SFX, TTS — 29 tools in one
**Session log:** none yet

### Ayrshare MCP
**Verdict:** UNTESTED — campaigns module
**Install:** `npx -y ayrshare-mcp` | **Keys:** Ayrshare API (~$29/month)
**Why:** Post to 13+ social platforms from Claude
**Session log:** none yet

### Cowork Computer Use ⚡ RELEASED MARCH 24 2026
**Verdict:** UNTESTED
**Install:** Claude Desktop → Settings → Enable computer use (Pro/Max, Mac only, research preview)
**Why:** Claude controls your Mac — open files, browsers, forms. Pairs with Dispatch for phone-to-desktop task assignment.
**Session log:** none yet

---

## REJECTED / AVOID (MCP TOOLS)
*(Empty — will populate as bad experiences accumulate)*

## SITUATIONAL (MCP TOOLS)
*(Empty — will populate with nuanced verdicts)*

---

# SECTION 2: SKILLS

---

## INSTALLED AND WORKING

### docx, pdf, pptx, xlsx
**Verdict:** GOOD | **Location:** /mnt/skills/public/
**Session log:** Used throughout — reliable on all document creation tasks

### frontend-design
**Verdict:** GOOD | **Location:** /mnt/skills/public/frontend-design/
**Notes:** 277,000+ installs. Breaks generic AI design. Use on every frontend task.
**Session log:** Improved lool-ai widget UI

### file-reading, pdf-reading, product-self-knowledge
**Verdict:** GOOD | **Location:** /mnt/skills/public/

### skill-creator
**Verdict:** GOOD | **Location:** /mnt/skills/examples/

---

## DISCOVERED — HIGH PRIORITY (SKILLS)

### feature-dev ⚡ 89,000 INSTALLS
**Verdict:** INSTALLED — not yet invoked via /feature-dev
**Install:** Already in /home/codespace/.claude/plugins/marketplaces/claude-plugins-official/plugins/feature-dev/
**Why:** 7-phase structured workflow — discovery, exploration, clarifying Qs, architecture design, implementation, quality review, summary. Commands: /feature-dev, agents: code-explorer, code-architect, code-reviewer.
**Session log:** [2026-03-26] — confirmed installed, /feature-dev command available

### /code-review (official Anthropic)
**Verdict:** UNTESTED
**Install:** `claude plugin install code-review` (free, official)
**Why:** Official code review plugin, no extra cost
**Session log:** none yet

### review-claudemd
**Verdict:** UNTESTED — core of learning loop
**Install:** `curl -sL https://raw.githubusercontent.com/BehiSecc/awesome-claude-skills/main/review-claudemd/SKILL.md -o ~/.claude/skills/review-claudemd/SKILL.md`
**Why:** Reviews recent conversations and suggests CLAUDE.md improvements
**Session log:** none yet

### Task Master AI
**Verdict:** UNTESTED
**Install:** `npm install -g task-master-ai`
**Why:** Turns PRDs into structured task lists agents can mark complete. Good for lool-ai and espacio-bosques.
**Session log:** none yet

### /batch
**Verdict:** UNTESTED
**Install:** Via Claude Code plugin marketplace
**Why:** Decomposes work into parallel git worktrees, creates PRs automatically. Key for complex builds.
**Session log:** none yet

### gstack (Garry Tan / Y Combinator)
**Verdict:** UNTESTED
**Install:** github.com/garry-tang/gstack
**Why:** 6 skills — CEO-level product thinking, automated PR shipping, browser QA
**Session log:** none yet

---

## DISCOVERED — RECOMMENDED (SKILLS)

### owasp-security
**Verdict:** UNTESTED — required before lool-ai handles real user data
**Install:** github.com/BehiSecc/awesome-claude-skills
**Why:** OWASP Top 10:2025, ASVS 5.0, code review checklists for 20+ languages. Required for LFPDPPP compliance.
**Session log:** none yet

### systematic-debugging
**Verdict:** UNTESTED
**Install:** github.com/BehiSecc/awesome-claude-skills
**Why:** Root cause tracing before fix proposals
**Session log:** none yet

### deep-research
**Verdict:** UNTESTED
**Install:** github.com/daymade/claude-code-skills
**Why:** Format-controlled research reports with citations
**Session log:** none yet

### continue-claude-work
**Verdict:** UNTESTED
**Install:** github.com/daymade/claude-code-skills
**Why:** Intelligently resumes from previous sessions — reads compaction summaries, recovers subagent state
**Session log:** none yet

### Magic UI MCP
**Verdict:** UNTESTED
**Install:** `npx -y magic-ui-mcp` (verify current package name)
**Why:** React+Tailwind component library — say "add a marquee" → get production JSX
**Session log:** none yet

---

## REJECTED / AVOID (SKILLS)
*(Empty — will populate)*

## SITUATIONAL (SKILLS)
*(Empty — will populate)*

---

# SECTION 3: PROJECT COMPLETION ASSESSMENTS

*(Empty — will populate after first project completes)*

Format:
```
### [Project] — completed [date]
MCP tools used: [list with verdicts]
Skills used: [list with verdicts]
Registry updates made: [list]
Full assessment: [what worked, what didn't, what to try next time]
```
