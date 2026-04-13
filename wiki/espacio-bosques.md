---
type: project-wiki
project: espacio-bosques
tags: [espacio-bosques, blockchain, dao, cdmx, bitso, simulation]
updated: 2026-04-13
---
# espacio-bosques

Community DAO platform for Bosques de las Lomas. Fiat-first, no MetaMask.

## Status
✅ POC complete — simulation mode working. Next: first real demo.

## Key decisions
- Bitso API as licensed IFPE (Ley Fintech compliance)
- SIMULATION_MODE=true — zero real money in testing
- Supabase auth (email/PIN + Google)
- eb_ table prefix in shared Supabase instance
- Claude model: claude-sonnet-4-6

## POC done
- ✅ Supabase email/password + Google OAuth
- ✅ AI blueprint creation + conversational chat refinement
- ✅ Bitso MXN→ETH quote + simulated investment flow
- ✅ Full EN/ES i18n
- ✅ User profile page, SAT RFC validation
- ✅ Evidence review + voting thresholds + notification bell
- ⬜ First real demo
- ⬜ Seed 5+ investors for PENDING_VOTES threshold path

## Connections

### Projects
- [[wiki/nutria]] — same Supabase instance, same auth pattern
- [[wiki/lool-ai]] — overlapping CDMX geography
- [[wiki/freelance-system]] — SAT/CFDI overlap for provider payments

### Agents
- [[agents/core/legal]] — Ley Fintech / CNBV flag
- [[agents/core/developer]] — built the POC
- [[agents/core/ux]] — Playwright verification protocol
- [[agents/core/financial]] — no revenue yet
- [[agents/core/deploy]] — dev→UAT→prod pipeline

### Concepts used
- [[concepts/simulation-first-dev]] — entire POC runs in SIMULATION_MODE
- [[concepts/test-harness-first]] — /api/test/* harness caught 5 silent bugs
- [[concepts/ley-fintech-compliance]] — Bitso as licensed IFPE
- [[concepts/supabase-shared-instance]] — eb_ prefix on shared instance
- [[concepts/spanish-first-mx]] — full EN/ES i18n, MXN pricing via Bitso
- [[concepts/cdmx-neighborhood-targeting]] — Bosques de las Lomas

### Learnings
- [[learnings/cross-project-map]]
- [[learnings/supabase-registry]]

## Legal flag
⚠️ Ley Fintech / CNBV — custodial model, using Bitso as licensed IFPE
