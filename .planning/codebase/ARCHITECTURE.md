# Architecture

> ⚠️ **STALE — auto-generated snapshot.** Written 2026-04-13 when this repo was named `venture-os`. Path references to `/workspaces/venture-os/` are wrong — the repo is now `/workspaces/janus-ia/` (same files, renamed). Tool names in this file use the old `mcp__janus-memory__*` prefix; the live MCP uses `mcp__memory__*`. For current state read [[CLAUDE]], [[PROJECTS]], [[learnings/cross-project-map]], [[learnings/supabase-registry]], [[tools/registry]]. This file is kept as historical context; do not quote its specifics as current fact.

**Analysis Date:** 2026-04-13

## Pattern Overview

**Overall:** Agent-orchestrated knowledge hub (no runtime application server)

**Key Characteristics:**
- venture-os is NOT a running application — it is an AI agent workspace that orchestrates multiple product repos
- `CLAUDE.md` is the true entry point: a 29KB dispatch protocol that routes every task to the correct agent, tools, and skills
- Product repos live as git submodules under `projects/` — each is an independent codebase with its own stack
- An Obsidian-style vault (markdown + `[[wikilinks]]`) serves as the persistent knowledge graph
- MCP (Model Context Protocol) servers provide tool integrations (GitHub, Supabase, Brave, Playwright, etc.)

## Layers

**Dispatch Layer (CLAUDE.md):**
- Purpose: Route every incoming task to the correct agent, load relevant context, enforce verification
- Location: `/workspaces/venture-os/CLAUDE.md`
- Contains: Task routing table, permission modes, session protocol, pre-task checklists, end-of-session protocol
- Depends on: Agent definitions, tool/skill registries
- Used by: Every Claude session in this workspace

**Agent Layer:**
- Purpose: Behavioral specifications for each functional role (developer, legal, financial, etc.)
- Location: `agents/core/` (13 agents), `agents/domain/` (1 agent), `agents/legal/` (1 project-specific)
- Contains: Markdown files defining how each agent operates, what tools it uses, what outputs it produces
- Depends on: Tool and skill registries
- Used by: Dispatch layer routes tasks here

**Knowledge Layer (Vault):**
- Purpose: Persistent, interconnected knowledge base — the "brain" that compounds across sessions
- Location: `wiki/`, `concepts/`, `learnings/`
- Contains: Project knowledge (`wiki/`), cross-project patterns (`concepts/`), domain knowledge (`learnings/`)
- Depends on: MCP obsidian-vault server for read/write/search
- Used by: Session start protocol loads this; agents update it mid-session

**Project Layer:**
- Purpose: Actual product codebases managed by this orchestrator
- Location: `projects/` (git submodules: espacio-bosques, lool-ai, freelance-system, longevite-therapeutics; plain dirs: mercado-bot-dev)
- Contains: Independent repos with their own stacks (React frontends, Node backends, Solidity contracts, etc.)
- Depends on: Shared Supabase instance, deployment configs
- Used by: Developer agent builds here; deploy agent ships from here

**Module Template Layer:**
- Purpose: Reusable templates copied into new projects at intake
- Location: `modules/` (7 modules: build, financial, gtm, learnings, legal, performance, validation)
- Contains: Markdown templates defining processes for each capability
- Depends on: Nothing
- Used by: Intake agent copies relevant modules when spinning up a new project

**Tool/Skill Layer:**
- Purpose: Registry of MCP servers, CLI tools, and installable skills available to agents
- Location: `tools/registry.md`, `skills/registry.md`, `.mcp.json`
- Contains: Verdicts, install commands, session logs for every tool evaluated
- Depends on: External MCP servers, npm packages
- Used by: Every agent checks registries before task execution

**Output Layer:**
- Purpose: Generated artifacts — documents, screenshots, research, security reports
- Location: `outputs/` (subdirs: documents, screenshots, research, designs, security, espacio-bosques)
- Contains: Deliverables organized by project
- Depends on: Agent execution
- Used by: Jano reviews; some outputs feed back into projects

## Data Flow

**Session Start Flow:**
1. Claude reads `CLAUDE.md` (dispatch protocol)
2. Loads memories via `mcp__janus-memory__recall` (Supabase-backed)
3. Loads vault context via `mcp__obsidian-vault__read_note` (PROJECTS, cross-project-map)
4. Runs cross-synthesis checks (legal, market, tech, capacity, opportunity)
5. Processes user request through dispatch table

**Task Execution Flow:**
1. Dispatch identifies task type from routing table in CLAUDE.md
2. Reads relevant agent file from `agents/core/` or `agents/domain/`
3. Agent checks `tools/registry.md` and `skills/registry.md` for available tools
4. Executes work (code changes in `projects/`, research via Brave, etc.)
5. Verifies via UX agent protocol (Playwright screenshots, API curl checks)
6. Routes output to correct location (GitHub, outputs/, vault)

**Knowledge Update Flow:**
1. Insights surface during work
2. Search vault for existing notes (`mcp__obsidian-vault__search_notes`)
3. Patch existing notes or create new concept nodes with `[[wikilinks]]`
4. Update `PROJECTS.md` and `learnings/cross-project-map.md` at session end

**State Management:**
- Session state: Claude's context window + memories from Supabase
- Project state: `PROJECTS.md` (status registry) + `projects/dev/`, `projects/uat/`, `projects/prod/` (deployment stage dirs, currently empty — stages tracked in PROJECTS.md text)
- Knowledge state: Obsidian vault (wiki + concepts + learnings)
- Financial state: `finances/` directory

## Key Abstractions

**Agents:**
- Purpose: Specialized behavioral roles that define HOW to perform a category of work
- Examples: `agents/core/developer.md`, `agents/core/legal.md`, `agents/core/intake.md`
- Pattern: Each agent is a markdown file read before task execution; defines tools needed, verification steps, output format

**Modules:**
- Purpose: Reusable process templates assigned to projects at creation
- Examples: `modules/build/build.md`, `modules/legal/legal.md`, `modules/validation/validation.md`
- Pattern: Copied into new project repos; define lifecycle processes (not code)

**Concepts:**
- Purpose: Cross-project patterns that have been observed in 2+ projects — the compounding knowledge layer
- Examples: `concepts/simulation-first-dev.md`, `concepts/b2b-before-b2c.md`, `concepts/cdmx-neighborhood-targeting.md`
- Pattern: Created when a pattern repeats; linked via `[[wikilinks]]` to project wiki pages

**MCP Servers:**
- Purpose: External tool integrations available to all agents
- Examples: GitHub, Brave Search, Playwright, Supabase, Obsidian vault, knowledge-graph, sequential-thinking
- Pattern: Configured in `.mcp.json`; custom memory server in `mcp-servers/memory/`

## Entry Points

**Primary — CLAUDE.md:**
- Location: `/workspaces/venture-os/CLAUDE.md`
- Triggers: Every new Claude session in this workspace
- Responsibilities: Full dispatch protocol, session init, agent routing, verification enforcement

**MCP Config — .mcp.json:**
- Location: `/workspaces/venture-os/.mcp.json`
- Triggers: Claude session MCP server initialization
- Responsibilities: Declares 13 MCP servers with their commands and env vars

**Project Status — PROJECTS.md:**
- Location: `/workspaces/venture-os/PROJECTS.md`
- Triggers: Session start (loaded automatically), session end (updated)
- Responsibilities: Live registry of all projects, their stages, and current status

**Brain Viewer — tools/brain-viewer/server.js:**
- Location: `/workspaces/venture-os/tools/brain-viewer/server.js`
- Triggers: Manual launch for D3 force-graph visualization
- Responsibilities: Serves interactive graph of vault nodes and edges

## Error Handling

**Strategy:** Agent-level verification protocols (no application-level error handling — this is not a runtime)

**Patterns:**
- UX agent defines 6 verification layers (code review → server check → visual → functional → cross-env → security)
- Developer agent requires test harness endpoints and `scripts/test-api.sh` in every backend project
- Deploy agent checks drift between tagged versions and current HEAD

## Cross-Cutting Concerns

**Logging:** Session memories stored via `mcp__janus-memory__remember` to Supabase; tool/skill feedback logged to registries
**Validation:** Intake agent runs market validation before project creation; oversight agent audits product coherence
**Authentication:** Credentials auto-loaded from dotfiles repo via env vars; never stored in project repos
**Knowledge Compounding:** Vault plasticity rules ensure knowledge is rewritten (not appended) and cross-linked

---

*Architecture analysis: 2026-04-13*
