# Codebase Structure

> ⚠️ **STALE — auto-generated snapshot.** Written 2026-04-13 when the repo root was `venture-os/`. The tree below shows the old name; actual path is `/workspaces/janus-ia/` with identical layout. For the live structure run `ls -1` at repo root or read [[PROJECTS]]. Do not quote this file's tree as current fact.

**Analysis Date:** 2026-04-13

## Directory Layout

```
venture-os/
├── agents/                # Agent behavioral specs (markdown)
│   ├── core/              # 13 functional agents (developer, legal, deploy, etc.)
│   ├── domain/            # Domain-specific agents (nutrition)
│   └── legal/             # Project-specific legal agents
├── concepts/              # Cross-project pattern nodes (Obsidian vault)
├── database/              # SQL schemas for shared services
├── docs/                  # How-to guides for extending the system
├── dump/                  # Inbox for unrouted files (auto-dispatched)
├── finances/              # Financial tracking
├── learnings/             # Domain knowledge (market, technical, patterns)
├── mcp-servers/           # Custom MCP server implementations
│   └── memory/            # Janus memory server (Supabase + Voyage AI)
├── modules/               # Reusable project templates
│   ├── build/             # Software development process
│   ├── financial/         # Financial tracking template
│   ├── gtm/               # Go-to-market template
│   ├── learnings/         # Learning capture template
│   ├── legal/             # Legal compliance template
│   ├── performance/       # Metrics tracking template
│   └── validation/        # Idea validation template
├── outputs/               # Generated artifacts
│   ├── documents/         # Reports, deliverables (by project)
│   ├── screenshots/       # Playwright captures (by project)
│   ├── research/          # Market research outputs
│   ├── designs/           # Design artifacts
│   └── security/          # Security audit reports
├── portfolio/             # Portfolio showcase
├── projects/              # Product repos (git submodules + plain dirs)
│   ├── espacio-bosques/   # [submodule] Real estate crowdfunding platform
│   ├── lool-ai/           # [submodule] AI product
│   ├── freelance-system/  # [submodule] Freelance management
│   ├── longevite-therapeutics/ # [submodule] Therapeutics website
│   ├── mercado-bot-dev/   # [plain dir] Trading bot
│   ├── dev/               # Stage marker (empty)
│   ├── uat/               # Stage marker (empty)
│   └── prod/              # Stage marker (empty)
├── scripts/               # Utility scripts
├── skills/                # Installable Claude skills
│   ├── installed/         # Downloaded skill packages
│   └── registry.md        # Skill verdicts and logs
├── tools/                 # Tool configs and utilities
│   ├── brain-viewer/      # D3 force-graph vault visualizer (Node.js)
│   ├── configs/           # Tool-specific configs
│   └── registry.md        # Tool verdicts and logs
├── wiki/                  # Project knowledge pages (Obsidian vault)
├── .mcp.json              # MCP server configuration (13 servers)
├── .obsidian/             # Obsidian app settings
├── CLAUDE.md              # Master dispatch protocol (primary entry point)
├── CREDENTIALS.md         # Credential documentation (not secrets)
├── PORTFOLIO-MAP.md       # Cross-repo architecture map
├── PROJECTS.md            # Live project status registry
└── TOOLS.md               # Tool discovery and evaluation
```

## Directory Purposes

**`agents/core/`:**
- Purpose: Behavioral specs for each orchestrator role
- Contains: 13 markdown files, one per agent (developer, legal, financial, calendar, deploy, intake, marketing, oversight, performance, research, security, trickle-down, ux)
- Key files: `agents/core/developer.md`, `agents/core/intake.md`, `agents/core/ux.md`

**`concepts/`:**
- Purpose: Cross-project pattern nodes — ideas observed in 2+ projects
- Contains: 9 concept markdown files with `[[wikilinks]]`
- Key files: `concepts/simulation-first-dev.md`, `concepts/test-harness-first.md`, `concepts/b2b-before-b2c.md`

**`learnings/`:**
- Purpose: Accumulated domain knowledge across all projects
- Contains: Market insights, technical patterns, Supabase registry, MCP registry, cross-project relationship map
- Key files: `learnings/cross-project-map.md`, `learnings/supabase-registry.md`, `learnings/patterns.md`

**`wiki/`:**
- Purpose: One knowledge page per project — what it is, its stack, its state
- Contains: 8 project pages + index
- Key files: `wiki/index.md`, `wiki/espacio-bosques.md`, `wiki/lool-ai.md`

**`modules/`:**
- Purpose: Templates copied into new projects during intake
- Contains: 7 module directories, each with a single markdown template
- Key files: `modules/build/build.md`, `modules/validation/validation.md`

**`projects/`:**
- Purpose: Houses all product repos as git submodules
- Contains: 4 submodules + 1 plain dir + 3 empty stage markers
- Key files: Each submodule is an independent repo with its own structure

**`mcp-servers/memory/`:**
- Purpose: Custom MCP server for cross-session semantic memory
- Contains: `index.js` (Node.js), `setup.sql`, `package.json`
- Key files: `mcp-servers/memory/index.js`

**`tools/brain-viewer/`:**
- Purpose: D3 force-graph visualization of the vault knowledge graph
- Contains: `server.js` (Node.js express server), `package.json`
- Key files: `tools/brain-viewer/server.js`

**`outputs/`:**
- Purpose: All generated artifacts organized by type and project
- Contains: Subdirectories for documents, screenshots, research, designs, security
- Generated: Yes
- Committed: Yes

## Key File Locations

**Entry Points:**
- `CLAUDE.md`: Master dispatch protocol — read by every session
- `.mcp.json`: MCP server declarations (13 servers)
- `PROJECTS.md`: Live project status registry

**Configuration:**
- `.mcp.json`: MCP server config
- `.gitmodules`: Git submodule declarations (4 product repos)
- `.obsidian/`: Obsidian vault settings
- `tools/configs/notebooklm_automation.py`: NotebookLM tool config

**Core Logic:**
- `mcp-servers/memory/index.js`: Custom memory MCP server (Supabase + Voyage AI embeddings)
- `tools/brain-viewer/server.js`: Vault graph visualizer
- `scripts/migrate-memories.js`: Memory migration utility

**Knowledge Base:**
- `wiki/*.md`: Per-project knowledge
- `concepts/*.md`: Cross-project patterns
- `learnings/*.md`: Domain knowledge
- `PORTFOLIO-MAP.md`: Cross-repo architecture diagram

**Documentation:**
- `docs/how-to-add-agent.md`: Guide for new agents
- `docs/how-to-add-product.md`: Guide for new products
- `docs/how-to-add-skill.md`: Guide for new skills
- `docs/how-to-add-tool.md`: Guide for new tools
- `docs/how-to-deploy.md`: Deployment guide

## Naming Conventions

**Files:**
- Agent specs: `kebab-case.md` (e.g., `trickle-down.md`)
- Concept nodes: `kebab-case.md` (e.g., `simulation-first-dev.md`)
- Root docs: `UPPERCASE.md` (e.g., `PROJECTS.md`, `CLAUDE.md`)
- Wiki pages: `kebab-case.md` matching project name

**Directories:**
- Lowercase with hyphens: `brain-viewer/`, `mcp-servers/`
- Plural for collections: `agents/`, `concepts/`, `learnings/`, `modules/`
- Singular for tools: `dump/`, `portfolio/`

## Where to Add New Code

**New Agent:**
- Implementation: `agents/core/{name}.md` (or `agents/domain/` for domain-specific)
- Documentation: `docs/how-to-add-agent.md`
- Register in: `CLAUDE.md` dispatch table

**New Product/Project:**
- Repo: Create external repo, add as submodule under `projects/`
- Wiki page: `wiki/{project-name}.md`
- Status entry: `PROJECTS.md`
- Documentation: `docs/how-to-add-product.md`

**New Concept Node:**
- File: `concepts/{slug}.md` with frontmatter and `[[wikilinks]]`
- Link from: relevant `wiki/` and `learnings/` pages

**New Learning:**
- File: `learnings/{topic}.md` or patch existing file
- Cross-link: Update `learnings/cross-project-map.md`

**New MCP Server:**
- Implementation: `mcp-servers/{name}/`
- Config: Add entry to `.mcp.json`
- Registry: Update `tools/registry.md`

**New Tool/Utility:**
- Implementation: `tools/{name}/`
- Registry: Update `tools/registry.md`

**New Skill:**
- Install to: `skills/installed/`
- Registry: Update `skills/registry.md`

**New Output:**
- Documents: `outputs/documents/{project}/`
- Screenshots: `outputs/screenshots/{project}/`
- Research: `outputs/research/{project}/`

## Special Directories

**`dump/`:**
- Purpose: Inbox for unrouted files — auto-dispatched by session start protocol
- Generated: No (manually placed)
- Committed: Yes (directory only)

**`projects/dev/`, `projects/uat/`, `projects/prod/`:**
- Purpose: Deployment stage markers (currently empty — stages tracked in PROJECTS.md text)
- Generated: No
- Committed: Yes (empty dirs)

**`.planning/`:**
- Purpose: GSD planning and codebase analysis documents
- Generated: Yes (by GSD commands)
- Committed: Yes

**`.playwright-mcp/`:**
- Purpose: Playwright MCP server artifacts (screenshots, traces)
- Generated: Yes
- Committed: Partial

---

*Structure analysis: 2026-04-13*
