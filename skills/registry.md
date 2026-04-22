# SKILLS REGISTRY
## Pablo IA | Last updated: 2026-04-22

All skills available across Pablo IA projects.
Skills teach Claude how to do something before a task starts.
MCP tools give access to external systems. They compose.

**Verdicts:** GOOD · SITUATIONAL · BAD/AVOID · UNTESTED
**Location:** /mnt/skills/public/ (built-in) or ~/.claude/skills/ (installed)

---

## HOW AGENTS USE THIS FILE

Before starting a task, check this registry:
1. Is there a skill that teaches how to do this well?
2. Is it GOOD and installed?
3. Load it by reading the SKILL.md before starting
4. If not installed: search and install (see TOOLS.md discovery protocol)

---

## INSTALLED AND WORKING

### docx · pdf · pptx · xlsx
**Verdict:** GOOD | /mnt/skills/public/
Document creation — all reliable. Use for any file output task.

### frontend-design
**Verdict:** GOOD | /mnt/skills/public/frontend-design/
277,000+ installs. Prevents generic AI design.
**Rule:** Read before ANY frontend task.

### file-reading · pdf-reading · product-self-knowledge
**Verdict:** GOOD | /mnt/skills/public/

### skill-creator
**Verdict:** GOOD | /mnt/skills/examples/
Use to build new custom skills for Pablo IA.

### feature-dev
**Verdict:** INSTALLED — not yet invoked via /feature-dev
7-phase structured workflow. Most popular Claude Code skill (89k installs).
Located: /home/codespace/.claude/plugins/marketplaces/...

---

## MARKETING SKILLS

### marketingskills (coreyhaines31)
35 marketing skills for CRO, SEO, copywriting, growth, GTM, and analytics.
19.9k stars. Works with Claude Code, Codex, Cursor.
**Foundation skill:** `product-marketing-context` — all others read this first.
Install individual skills: `npx skills add https://github.com/coreyhaines31/marketingskills/skills/[skill-name]`
Install all: `npx skills add https://github.com/coreyhaines31/marketingskills`

**Full skill list:**
`ab-test-setup` · `ad-creative` · `ai-seo` · `analytics-tracking` · `churn-prevention` · `cold-email` · `community-marketing` · `competitor-alternatives` · `content-strategy` · `copy-editing` · `copywriting` · `customer-research` · `email-sequence` · `form-cro` · `free-tool-strategy` · `launch-strategy` · `lead-magnets` · `marketing-ideas` · `marketing-psychology` · `onboarding-cro` · `page-cro` · `paid-ads` · `paywall-upgrade-cro` · `popup-cro` · `pricing-strategy` · `product-marketing-context` · `programmatic-seo` · `referral-program` · `revops` · `sales-enablement` · `schema-markup` · `seo-audit` · `signup-flow-cro` · `site-architecture` · `social-content`

---

## HIGH PRIORITY — NOT YET INSTALLED

### /code-review (official Anthropic)
Free. `claude plugin install code-review`

### review-claudemd
Suggests CLAUDE.md improvements from recent sessions.
`curl -sL https://raw.githubusercontent.com/BehiSecc/awesome-claude-skills/main/review-claudemd/SKILL.md -o ~/.claude/skills/review-claudemd/SKILL.md`

### Task Master AI
Turns PRDs into structured agent-readable task lists.
`npm install -g task-master-ai`

### /batch
Parallel git worktrees for complex builds.
Via Claude Code plugin marketplace.

### gstack (Garry Tan / YC)
6 skills: product thinking + PR automation + browser QA.
github.com/garry-tang/gstack

### owasp-security
Required before any product handles real user data.
OWASP Top 10:2025, ASVS 5.0. github.com/BehiSecc/awesome-claude-skills

### systematic-debugging
Root cause tracing before fix proposals.
github.com/BehiSecc/awesome-claude-skills

### NotebookLM skill
**Alternative to MCP** — Python-based, runs directly in Claude Code.
Use if MCP has auth issues.

### deep-research
Format-controlled research reports with citations.
github.com/daymade/claude-code-skills

### ui-ux-pro-max
Multi-domain design reasoning engine. 67 UI styles, 161 palettes, 57 font pairings.
`npm install -g uipro-cli && uipro init --ai claude --global`
Or: `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill`

### GSAP Skills (official)
Official GSAP skill from GreenSock — 8 modules.
`npx skills add https://github.com/greensock/gsap-skills`
Or: `/plugin marketplace add greensock/gsap-skills`

---

### cost-mode
30-60% token cost reduction. Enforces concise responses and smart model routing.
Activate with `/cost-mode` or "enable cost mode".

### excalidraw-diagram
Creates Excalidraw JSON diagram files for architecture visualization.
Use when visualizing workflows, system architecture, or portfolio structure.

---

## REJECTED / AVOID
*(Populate as bad experiences accumulate)*

## SITUATIONAL
*(Populate with nuanced verdicts)*
