# Technology Stack

**Analysis Date:** 2026-04-13

## Languages

**Primary:**
- TypeScript 5.2+ - All product repos (espacio-bosques backend/frontend/contracts, lool-ai, mercado-bot-dev)
- Solidity ^0.8.x - Smart contracts (`/workspaces/espacio_bosques/contracts/`)
- Markdown - venture-os orchestration layer (agents, concepts, learnings, wiki)

**Secondary:**
- JavaScript (ES Modules) - MCP servers (`/workspaces/venture-os/mcp-servers/memory/index.js`), vite configs
- SQL - Supabase schema (`/workspaces/venture-os/database/janus-memory-schema.sql`)
- HTML/CSS - LongeviteTherapeutics static site

## Runtime

**Environment:**
- Node.js v24.14.0
- Runs in GitHub Codespaces (Linux, azure kernel)

**Package Managers:**
- npm 11.9.0 - lool-ai, mercado-bot-dev, venture-os MCP servers
- Yarn 1.22.22 - espacio-bosques (monorepo workspaces)
- Lockfiles: `package-lock.json` (npm projects), `yarn.lock` (espacio-bosques)

## Frameworks

**Core:**
- React 18.2-18.3 - All frontends
- Express 4.18 - espacio-bosques backend (`/workspaces/espacio_bosques/backend/`)
- Vite 4-5 - All frontend build tooling
- Hardhat 2.18 - Ethereum smart contract compilation/testing/deploy (`/workspaces/espacio_bosques/contracts/`)

**Testing:**
- Jest 29.7 + ts-jest - espacio-bosques backend unit tests
- Playwright 1.40 - espacio-bosques frontend E2E
- Hardhat test runner (Mocha + Chai) - smart contract tests

**Build/Dev:**
- Vite 5.0 - espacio-bosques frontend, mercado-bot-dev
- Vite 4.3 - lool-ai
- tsx 4.1 - espacio-bosques backend dev server (`tsx watch`)
- TypeScript 5.2 - all TS projects
- concurrently 8.2 - espacio-bosques parallel backend+frontend dev

## Key Dependencies

**Critical (espacio-bosques backend):**
- `@supabase/supabase-js` ^2.101 - Auth + database
- `@anthropic-ai/sdk` ^0.37 - Claude API for AI-assisted project creation
- `ethers` ^6.8 - Ethereum blockchain interaction
- `express` ^4.18 - HTTP server
- `zod` ^3.22 - Request validation
- `jsonwebtoken` ^9.0 - JWT auth

**Critical (espacio-bosques frontend):**
- `@supabase/supabase-js` ^2.101 - Auth (client-side)
- `zustand` ^4.4 - State management
- `@tanstack/react-query` ^5.8 - Server state/caching
- `ethers` ^6.8 - Wallet interaction
- `recharts` ^2.10 - Charts/data visualization
- `@splinetool/react-spline` ^4.1 - 3D hero scenes
- `react-router-dom` ^6.18 - Routing
- `lucide-react` ^1.7 - Icons

**Critical (lool-ai):**
- `@mediapipe/face_mesh` ^0.4 - Face detection for virtual try-on
- `@imgly/background-removal` ^1.7 - Background removal (dev dep, used at build)
- `react-router-dom` ^7.14 - Routing

**Critical (smart contracts):**
- `@openzeppelin/contracts` ^5.0 - Audited contract base (ERC20, access control)
- `@openzeppelin/contracts-upgradeable` ^5.0 - Upgradeable proxy pattern

**Infrastructure (espacio-bosques backend):**
- `helmet` ^7.1 - Security headers
- `express-rate-limit` ^7.1 - Rate limiting
- `cors` ^2.8 - CORS middleware
- `winston` ^3.11 - Structured logging
- `morgan` ^1.10 - HTTP request logging
- `multer` ^2.1 - File uploads
- `minio` ^7.1 - S3-compatible object storage client
- `ipfs-http-client` ^60.0 - IPFS for document storage
- `axios` ^1.14 - HTTP client (Bitso API)
- `@prisma/client` ^5.6 - ORM (legacy, migrating to Supabase direct)

**Orchestration (venture-os MCP servers):**
- `@modelcontextprotocol/sdk` ^1.0 - MCP protocol
- `@supabase/supabase-js` ^2.39 - Memory storage

## Configuration

**Environment:**
- All credentials injected from `salasoliva27/dotfiles` repo into Codespace env vars
- `.env` files exist per project but reference env vars (never committed with real values)
- `.env.example` at `/workspaces/espacio_bosques/.env.example` documents all required vars
- Key env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `BITSO_API_KEY`, `GITHUB_TOKEN`, `BRAVE_API_KEY`
- `SIMULATION_MODE=true` enables test harness endpoints in backend

**Build:**
- `tsconfig.json` - per workspace TypeScript config
- `vite.config.js` / `vite.config.ts` - Vite build config per frontend
- `hardhat.config.ts` - Solidity compiler + network config
- `tailwind.config.js` + `postcss.config.js` - CSS toolchain (all frontends use Tailwind 3.3)
- `.mcp.json` at venture-os root - MCP server configuration (14 servers)

**Linting/Formatting:**
- ESLint 8.52+ with `@typescript-eslint` plugin
- Prettier 3.0
- husky + lint-staged (espacio-bosques)

## Platform Requirements

**Development:**
- GitHub Codespaces (primary dev environment)
- Node.js >= 18.0.0
- Yarn >= 1.22.0 (espacio-bosques)
- Playwright chromium (`npx playwright install chromium` once per Codespace)

**Production:**
- Netlify (nutria-app target, `netlify.toml` written)
- Ethereum Sepolia testnet (espacio-bosques contracts)
- Supabase hosted (shared instance `rycybujjedtofghigyxm`)

---

*Stack analysis: 2026-04-13*
