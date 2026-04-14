# External Integrations

**Analysis Date:** 2026-04-13

## APIs & External Services

**AI / LLM:**
- Anthropic Claude API - AI-assisted project creation (espacio-bosques blueprints), nutrition agent (nutria-app)
  - SDK: `@anthropic-ai/sdk` ^0.37
  - Auth: `ANTHROPIC_API_KEY`
  - Model: `claude-sonnet-4-20250514` (configurable via `ANTHROPIC_MODEL`)
  - Max tokens: 4096 (configurable via `ANTHROPIC_MAX_TOKENS`)
  - Used in: `/workspaces/espacio_bosques/backend/` for chat/blueprint endpoints

**Crypto / Payments:**
- Bitso API - MXN-to-ETH exchange quotes for crowdfunding deposits
  - Client: `axios` direct HTTP calls
  - Auth: `BITSO_API_KEY`, `BITSO_API_SECRET`
  - Sandbox: `https://api-dev.bitso.com/v3`
  - Production: `https://api.bitso.com/v3`
  - Used in: espacio-bosques backend

**Blockchain:**
- Ethereum (Hardhat local node / Sepolia testnet)
  - SDK: `ethers` ^6.8 (both backend and frontend)
  - RPC: `RPC_URL` (default `http://127.0.0.1:8545`)
  - Contract: `CONTRACT_ADDRESS` env var
  - Wallet: `BACKEND_WALLET_PRIVATE_KEY`, `BACKEND_WALLET_ADDRESS`
  - Smart contracts: OpenZeppelin 5.0 base (ERC20, upgradeable proxies)
  - Used in: `/workspaces/espacio_bosques/contracts/`, `/workspaces/espacio_bosques/backend/`

**Search:**
- Brave Search API - Market research, competitor analysis
  - MCP: `@modelcontextprotocol/server-brave-search`
  - Auth: `BRAVE_API_KEY`
  - Used by: research agent in venture-os

**Computer Vision:**
- MediaPipe Face Mesh - Real-time face landmark detection for virtual eyewear try-on
  - SDK: `@mediapipe/face_mesh` ^0.4
  - Auth: None (runs client-side)
  - Used in: `/workspaces/lool-ai/`

- IMG.LY Background Removal - Remove background from product images
  - SDK: `@imgly/background-removal` ^1.7
  - Auth: None (runs client-side)
  - Used in: `/workspaces/lool-ai/`

## Data Storage

**Databases:**
- Supabase (PostgreSQL) - Shared instance across all projects
  - Project ref: `rycybujjedtofghigyxm`
  - Connection: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`
  - Client: `@supabase/supabase-js` ^2.101
  - Table prefixes: `bosques_*` (espacio-bosques), `nutria_*` (nutria-app), `janus_memories` (venture-os memory)
  - Schema: `/workspaces/venture-os/database/janus-memory-schema.sql`
  - Registry: `learnings/supabase-registry.md` lists all tables

- Prisma (legacy ORM layer) - espacio-bosques backend
  - Client: `@prisma/client` ^5.6
  - Connection: `DATABASE_URL` (points to same Supabase PostgreSQL)
  - Status: Legacy, migrating to direct Supabase client

**File Storage:**
- MinIO (S3-compatible) - Document/file uploads
  - Client: `minio` ^7.1
  - Used in: espacio-bosques backend
- IPFS - Decentralized document storage
  - Client: `ipfs-http-client` ^60.0
  - Used in: espacio-bosques backend

**Caching:**
- None detected (in-memory simStore used in dev mode)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth - Primary auth for espacio-bosques and nutria-app
  - Client-side: `@supabase/supabase-js` auth module
  - Frontend: `/workspaces/espacio_bosques/frontend/` uses `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
  - Backend: JWT verification via `jsonwebtoken` ^9.0
  - JWT config: `JWT_SECRET`, `JWT_EXPIRES_IN=7d`

- Google OAuth - Available but not primary
  - Config: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - Status: Configured in `.env.example`, not confirmed active

- Simulation Mode Auth - Dev/test bypass
  - Enabled: `SIMULATION_MODE=true`
  - Accepts `test-sim-token` as Bearer token

## Monitoring & Observability

**Error Tracking:**
- None (Sentry MCP listed as untested/future in `tools/registry.md`)

**Logs:**
- `winston` ^3.11 - Structured logging (espacio-bosques backend)
- `morgan` ^1.10 - HTTP request logging (espacio-bosques backend)
- `console` - All other projects

**Telemetry:**
- Config exists: `TELEMETRY_RETENTION_DAYS=90`, `REPORT_GENERATION_INTERVAL_HOURS=24`
- Implementation status: Configured but not confirmed active

## CI/CD & Deployment

**Hosting:**
- GitHub Codespaces - Development environment (all projects)
- Netlify - Target for nutria-app (config written, not yet deployed)
- Ethereum Sepolia - Smart contract testnet deployment

**CI Pipeline:**
- None detected (no `.github/workflows/` found)
- husky + lint-staged for pre-commit hooks (espacio-bosques)

**Version Control:**
- GitHub - All repos under `salasoliva27` org
  - `salasoliva27/venture-os`
  - `salasoliva27/espacio_bosques`
  - `salasoliva27/lool-ai`
  - `salasoliva27/nutria-app`
  - `salasoliva27/LongeviteTherapeutics`

## MCP Servers (Model Context Protocol)

venture-os orchestrates Claude Code sessions via 14 configured MCP servers in `.mcp.json`:

**Active & Working:**
| Server | Package | Purpose |
|---|---|---|
| github | `@modelcontextprotocol/server-github` | Repo management, commits, PRs |
| brave-search | `@modelcontextprotocol/server-brave-search` | Market research |
| filesystem | `@modelcontextprotocol/server-filesystem` | Read/write `/workspaces` |
| fetch | `@modelcontextprotocol/server-fetch` | HTTP requests |
| sequential-thinking | `@modelcontextprotocol/server-sequential-thinking` | Reasoning chains |
| playwright | `@playwright/mcp` | Browser automation, UI verification |
| context7 | `@upstash/context7-mcp` | Library documentation lookup |

**Configured but Untested:**
| Server | Package | Purpose |
|---|---|---|
| memory | Custom (`/workspaces/janus-ia/mcp-servers/memory/`) | Cross-session semantic memory via Supabase |
| obsidian-vault | `@bitbonsai/mcpvault` | Read/write vault markdown |
| knowledge-graph | `obra-knowledge-graph` | Graph traversal on vault |
| supabase | HTTP MCP at `mcp.supabase.com` | Direct Supabase management |
| n8n | `n8n-mcp` | Workflow automation (needs `N8N_API_KEY`) |
| cloudflare | `@cloudflare/mcp-server-cloudflare` | CDN/R2 management (needs `CLOUDFLARE_API_TOKEN`) |

**Custom MCP Server:**
- Janus Memory Server at `/workspaces/venture-os/mcp-servers/memory/`
  - Runtime: Node.js ES Module
  - Dependencies: `@modelcontextprotocol/sdk` ^1.0, `@supabase/supabase-js` ^2.39
  - Storage: `janus_memories` table in shared Supabase
  - Optional: `VOYAGE_API_KEY` for semantic search embeddings

## Environment Configuration

**Required env vars (espacio-bosques full stack):**
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`
- `BITSO_API_KEY`, `BITSO_API_SECRET`
- `JWT_SECRET`
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`

**Required env vars (venture-os orchestration):**
- `GITHUB_TOKEN`
- `BRAVE_API_KEY`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

**Secrets location:**
- `salasoliva27/dotfiles` private repo - auto-loaded into all Codespaces
- `.env` files per project - reference env vars, never committed with real values
- `.env.example` at `/workspaces/espacio_bosques/.env.example` - documents all vars

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected

## 3D / Visual Integrations

**Spline 3D:**
- SDK: `@splinetool/react-spline` ^4.1, `@splinetool/runtime` ^1.12
- Scenes: Loaded via `VITE_SPLINE_HERO` and `VITE_SPLINE_ACCENT` env vars (.splinecode URLs)
- Used in: espacio-bosques frontend landing page

---

*Integration audit: 2026-04-13*
