
# Portfolio Mind Map
## Jano's Venture OS — Repo Interaction Map
_Last updated: April 2026_

---

## Structure — all repos at a glance

```mermaid
mindmap
  root((Jano Portfolio))
    venture-os
      Janus IA master brain
      CLAUDE.md dispatch protocol
      Agents core + domain
      Skills + Tools registries
      Dashboard React+Express
    espacio-bosques-dev
      frontend React+Vite+Tailwind
      backend Express+simStore
      Bitso MXN integration
    lool-ai-dev
      React SPA
      MediaPipe face mesh
    nutria-app-dev
      app React PWA
      widget IIFE bundle
    longevite-therapeutics-dev
      Static HTML+CSS+JS
      GSAP animations
    mercado-bot-dev
      React dashboard
      Python backend planned
    jp-ai
      CLAUDE.md brain for Ozum
      10 agents + CRM spec
    freelance-system
      Automation pipeline
      Upwork+Fiverr outreach
```

---

## Interactions — data flows and shared services

```mermaid
graph TD
  subgraph ORCH["venture-os (Janus IA)"]
    JA[CLAUDE.md<br/>Master Brain]
    PR[PROJECTS.md<br/>Portfolio State]
    AG[Agents<br/>core + domain]
  end

  subgraph EB["espacio-bosques"]
    EBF[frontend<br/>React + Vite + Tailwind]
    EBB[backend<br/>Express + simStore]
    EBC[contracts<br/>Hardhat / Solidity]
    EBF -->|REST /api/*| EBB
    EBB -->|future deploy| EBC
  end

  subgraph NA["nutria-app"]
    NAA[app<br/>React PWA]
    NAW[widget<br/>IIFE bundle]
    NAA -->|same session| NAW
  end

  subgraph LT["longevite-therapeutics-dev"]
    LTS[Static site<br/>index.html + GSAP]
    LTS -->|embeds| NAW
  end

  subgraph LA["lool-ai"]
    LAR[React SPA<br/>MediaPipe + canvas]
  end

  subgraph EXT["Shared External Services"]
    SB[(Supabase<br/>rycybujjedtofghigyxm<br/>bosques_* + nutria_* tables)]
    CL[Claude API<br/>claude-sonnet-4-6]
    BT[Bitso sandbox<br/>MXN → ETH quotes]
  end

  EBF -->|Supabase Auth| SB
  EBB -->|blueprints + chat| CL
  EBB -->|quotes| BT
  NAA -->|Auth + conversations| SB
  NAA -->|nutrition agent| CL
  NAW -->|session-only chat| CL

  JA -->|orchestrates| EB
  JA -->|orchestrates| NA
  JA -->|orchestrates| LT
  JA -->|orchestrates| LA
```

---

## Per-repo quick reference

| Repo | Type | Stack | External deps | Status |
|---|---|---|---|---|
| **venture-os** | Orchestrator + Dashboard | Markdown + agents + React + Express | GitHub, Gmail, Supabase, Brave, Obsidian MCPs | Always active |
| **espacio-bosques-dev** | Community funding platform | React · Express · Tailwind · Supabase Auth | Supabase, Claude API, Bitso | POC complete |
| **lool-ai-dev** | B2B virtual try-on widget | React · MediaPipe | None (standalone) | Core widget done |
| **nutria-app-dev** | Nutrition AI — app + widget | React · Supabase · Claude API | Supabase, Claude API | V1 built, needs deploy |
| **longevite-therapeutics-dev** | Clinic website | Static HTML · GSAP | nutria-app widget | V2 built, not deployed |
| **mercado-bot-dev** | Prediction market bot | React dashboard · Python backend | Claude API | Dashboard v1, backend pending |
| **jp-ai** | AI-OS for Ozum events | CLAUDE.md + 10 agents | Supabase (ozum_*), Claude API | Setup complete, CRM pending |
| **freelance-system** | Freelance automation | Pipeline + portfolio | Upwork, Fiverr | Operational, needs leads |

---

## Shared infrastructure

| Service | Project ref | Used by | Table prefix |
|---|---|---|---|
| Supabase | `rycybujjedtofghigyxm` | venture-os, espacio-bosques, nutria-app, jp-ai | `janus_*`, `eb_*`, `nutria_*`, `ozum_*` (pending) |
| Claude API | `claude-sonnet-4-6` | espacio-bosques, nutria-app, mercado-bot, jp-ai | — |
| Bitso sandbox | sandbox API | espacio-bosques | — |
| Cloudflare R2 | `janus-media` bucket | lool-ai, longevite (planned) | — |

**Rule:** All credentials live in `salasoliva27/dotfiles` and are injected as env vars into every Codespace. Never hardcode in any repo.

---

## How the repos relate

- **venture-os** is the brain — it doesn't run code, it orchestrates all others
- **nutria-app widget** embeds into **longevite-therapeutics-dev** via `<script src="widget.js">`
- **espacio-bosques** is fully self-contained (frontend + backend + contracts), shares only Supabase and Claude
- **lool-ai** is standalone — no backend, no auth, no shared services yet
- **Supabase** is the only shared database — table prefixes prevent collisions between projects

---

## Test endpoints (simulation mode)

All backends in dev must expose `/api/test/*`. See `scripts/test-api.sh` in each repo.

| Endpoint | What it tests |
|---|---|
| `GET /api/test` | List all test endpoints |
| `GET /api/test/state` | Dump current store state |
| `POST /api/test/invest` | Simulate an investment (100 MXN min) |
| `POST /api/test/reset` | Reset sim data to seed |

## Vault connections
- [[CLAUDE]] · [[PROJECTS]] · [[wiki/index]]
- [[wiki/espacio-bosques]] · [[wiki/lool-ai]] · [[wiki/nutria]] · [[wiki/longevite]] · [[wiki/mercado-bot]] · [[wiki/jp-ai]] · [[wiki/freelance-system]]
