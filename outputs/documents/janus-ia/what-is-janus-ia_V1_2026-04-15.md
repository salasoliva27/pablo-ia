# What Is Janus IA

**Version 1 | April 2026**

---

## Overview

Janus IA is an AI-powered venture orchestration system. It acts as a central intelligence layer that coordinates multiple simultaneous business projects — each at different stages of development, with different technology stacks, target markets, and operational needs.

Rather than being a single product, Janus is a **portfolio operating system**: a master brain that dispatches specialized AI agents, enforces cross-project learning, and prevents the blind spots that come from running several ventures in parallel.

---

## What Problem It Solves

Running multiple projects as a solo founder creates compounding complexity:

- **Knowledge silos** — a lesson learned in one project never reaches the others.
- **Schedule collisions** — committing to new work without accounting for existing capacity.
- **Duplicated effort** — rebuilding patterns that already exist in another repo.
- **Legal and compliance gaps** — missing regulatory requirements that apply across projects.
- **Strategic conflicts** — two projects targeting the same market or using the same relationship capital without awareness.

Janus eliminates these by maintaining a single source of truth across all projects and actively surfacing conflicts, opportunities, and cross-project patterns.

---

## How It Works

### 1. The Dispatch Protocol

Every incoming task is classified and routed to the appropriate specialized agent. The system identifies the task type (code, research, legal, financial, marketing, etc.) and loads the relevant agent, tools, and skills before execution begins.

Task types include:
- New idea intake and validation
- Software development and deployment
- Frontend/UI changes and verification
- Market and competitor research
- Legal and compliance review
- Financial tracking and analysis
- Calendar and scheduling coordination
- Cross-project proposals
- Security audits
- Marketing and content creation

### 2. Specialized Agents

Janus dispatches work to 16 specialized agents, each with defined responsibilities:

| Agent | Role |
|---|---|
| **Intake** | Validates new ideas through market research, conflict checks, and capacity analysis before any code is written |
| **Developer** | Handles architecture, builds, and code across all projects |
| **UX** | Visual verification using Playwright — screenshots, functional testing, cross-viewport checks |
| **Legal** | Compliance monitoring (LFPDPPP, Ley Fintech), contract review, regulatory flags |
| **Financial** | P&L tracking, burn rate, runway calculations, portfolio-level financial health |
| **Calendar** | Google Calendar integration, conflict detection, scheduling |
| **Performance** | Dashboards, metrics, weekly summaries |
| **Deploy** | Dev to UAT to production pipeline, version tagging, drift detection |
| **Research** | Market research, competitor analysis, data gathering |
| **Security** | Vulnerability scanning, OWASP reviews, pre-deploy security gates |
| **Oversight** | Product coherence checks, end-to-end gap detection, launch readiness audits |
| **Marketing** | Brand, content, campaigns, email outreach, video production |
| **Trickle-Down** | Routes cross-project proposals — evaluates whether an idea should be adopted, adapted, or rejected for each project |
| **Evolve** | Self-improvement — discovers new capabilities, consolidates memory, optimizes workflows |
| **Nutrition** | Domain-specific clinical nutrition intelligence (powers the nutrIA product) |

### 3. Cross-Project Intelligence

Before responding to any request, Janus runs a mandatory cross-synthesis check:

- **Legal:** Does this touch any project with regulatory exposure?
- **Market:** Does this overlap with another project's geography or audience?
- **Tech:** Has this pattern been solved in another project already?
- **Capacity:** Is there room in the schedule for new commitments?
- **Opportunity:** Does anything discovered create a cross-project opportunity?

This prevents duplicated work, missed legal requirements, and strategic blind spots.

### 4. The Learning System

Every major phase in every project generates learnings that feed back into the system:

- **Project-specific learnings** go to that project's knowledge base
- **Cross-project patterns** go to a shared patterns registry
- **Market knowledge** (Mexico City / LATAM focus) accumulates in a market intelligence file
- **Technical reality** (actual build times vs. estimates) is tracked and used to challenge future commitments
- **GTM results** (what worked, what didn't) inform future go-to-market strategies

This is the compounding value layer — each project makes every other project smarter.

### 5. Conflict Detection (Always Running)

Janus continuously watches for:

- **Schedule conflicts** — flagging when estimates don't match historical reality
- **Resource conflicts** — two projects targeting the same market segment simultaneously
- **Strategic conflicts** — projects competing for the same relationship capital
- **Assumption conflicts** — scoping that contradicts past learnings
- **Capacity conflicts** — overcommitment relative to available hours

These are surfaced proactively, not just logged.

---

## The Project Portfolio

Janus currently orchestrates:

| Project | Description | Stage |
|---|---|---|
| **nutrIA** | AI-powered clinical nutrition platform | Development |
| **lool-ai** | AI product (B2B) | Development |
| **espacio-bosques** | Smart contract + resident platform for a real estate community | Frontend pending |
| **longevite-therapeutics** | Therapeutics platform V2 | Pending deploy |
| **freelance-system** | Freelance operations management | Operational |

---

## Technical Architecture

### Tools and Integrations

Janus connects to external services through MCP (Model Context Protocol) servers:

- **GitHub** — code management across all project repos
- **Supabase** — shared database instance across all projects (table-prefixed per project)
- **Brave Search** — market research and competitor analysis
- **Google Calendar** — scheduling and conflict detection
- **Gmail** — project context extraction
- **Playwright** — automated UI testing and visual verification
- **Obsidian Vault** — knowledge graph (wiki, concepts, learnings)
- **Filesystem** — local file operations

### Verification Protocol

Every change goes through a multi-layer verification before being marked complete:

1. **Code review** — read changed files, check for issues
2. **Server check** — confirm it runs without errors
3. **Visual check** — Playwright screenshots at desktop and mobile viewports
4. **Functional testing** — click through the main flows
5. **Cross-environment check** — if the change touches shared components
6. **Security check** — if the change touches auth, data, or APIs

### Storage Routing

| Content | Destination |
|---|---|
| Code, configs, markdown | GitHub |
| Client deliverables, shared docs | Google Drive |
| AI-generated media | Cloudflare R2 |

---

## Design Principles

1. **Simulation-first development** — test harnesses and seed data before UI work.
2. **No-delete rule** — existing content is never removed without explicit instruction. Add, don't replace.
3. **Cross-project learning** — every project feeds the shared knowledge base.
4. **Active conflict detection** — the system challenges, it doesn't just log.
5. **Continuous context** — sessions compact rather than restart, maintaining continuity.
6. **Spanish-first for Mexico market** — all user-facing content for the local market defaults to Spanish.

---

## In Summary

Janus IA is the operational brain behind a multi-project venture portfolio. It routes tasks to specialized agents, enforces cross-project awareness, accumulates institutional knowledge, and actively prevents the failure modes that come from running several businesses in parallel as a solo founder. Every project it touches makes the system — and every other project — incrementally smarter.
