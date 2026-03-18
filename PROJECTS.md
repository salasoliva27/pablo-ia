# PROJECTS REGISTRY
## Last updated: 2026-03-18

This is the heartbeat of Venture OS. Every project is registered here. The master agent reads this at the start of every session.

---

## ACTIVE PROJECTS

### freelance-system
- **Repo:** github.com/salasoliva27/freelance-system
- **Type:** Automation pipeline (existing, operational)
- **Interaction model:** Gate-driven — pauses at every client decision point
- **Stage:** Operational — ready for first real leads
- **Modules:** build ✅, gtm ✅, performance ✅, learnings ✅, financial ✅
- **Modules excluded:** validation (already validated), campaigns (not applicable), legal (not needed for service delivery)
- **Target market:** Freelance clients on Upwork, Fiverr, PeoplePerHour — tech stack matched
- **Positioning rule:** Open with willingness to underbid in exchange for reviews. Immediately establish credibility with client's specific tech stack and years of experience. Frame as a deliberate trade — senior-level delivery at below-market rate in exchange for review. Never apologetic, never desperate.
- **Status:** ✅ Ready to run. No leads yet in CSV.
- **Notes:** Nocturne Solutions collab cases pre-loaded in portfolio.

---

### lool-ai
- **Repo:** github.com/salasoliva27/lool-ai
- **Type:** B2B SaaS — virtual try-on widget for Mexican optical SMEs
- **Interaction model:** Spec-fed — Jano defines product parameters; field notes fed manually or via Gmail after store visits
- **Stage:** Build in progress — core widget functional
- **Modules:** validation ✅, build 🔄, gtm ⬜, campaigns ⬜ (later), performance ⬜, learnings ⬜, financial ⬜, legal ⬜ (LFPDPPP — image data)
- **Target market:** Independent optical stores in Roma, Condesa, Polanco, Lomas, other CDMX SME-dense neighborhoods
- **Validated version:** B2B SaaS widget — white-label virtual try-on embedded on store website or WhatsApp catalog. Priced in MXN (~800–1,500 MXN/month). Onboarded in Spanish. Simple catalog upload (product photos, no 3D modeling required). B2C layer comes after 20+ stores have live catalogs.
- **Key legal flag:** Handles facial image data → LFPDPPP compliance required before any real user data is collected
- **Build status (2026-03-18):**
  - ✅ Camera + MediaPipe face mesh tracking (iris landmarks 468/473)
  - ✅ Real-time glasses overlay with rotation + scale from IPD
  - ✅ EMA smoothing — no shrink on blinks
  - ✅ High-DPI canvas (devicePixelRatio aware)
  - ✅ Catalog bar with 5 demo frames (Zenni placeholder catalog)
  - ✅ "Agregar al carrito" button → store product URL
  - ⬜ UTM attribution tracking on cart button clicks
  - ⬜ Embeddable widget format (currently standalone app)
  - ⬜ Real client catalog upload flow
  - ⬜ Pricing model decision: flat fee vs. performance % (pending)
- **Business model open question:** Flat monthly fee (~800–1,500 MXN) vs. % of sales attributed to widget. Revenue share requires UTM attribution on cart clicks — already architected, not yet implemented.
- **Status:** 🔄 Core try-on working. Next: attribution tracking → embeddable widget → first store pilot.

---

### espacio-bosques (bosques-poc)
- **Repo:** github.com/salasoliva27/bosques-poc
- **Type:** Blockchain community investment platform
- **Interaction model:** Event-driven — blockchain contract events drive state; Jano handles community relationships
- **Stage:** Smart contract complete (22/22 tests passing) → Sepolia deployment pending
- **Modules:** build ✅ (contract), build ⬜ (React frontend), gtm ⬜, performance ⬜, learnings ⬜, financial ⬜, legal ⬜ (CNBV, blockchain asset regulation — heavy)
- **Target market:** Bosques de las Lomas residents + local service providers
- **Immediate next steps:** Alchemy account → testnet ETH → MetaMask private key in .env → npm run deploy:sepolia → React frontend (4 screens)
- **Key legal flag:** Blockchain-based investment → potential CNBV regulatory territory → validate before real funds
- **Status:** ⬜ Not yet registered under venture-os. Smart contract phase complete.

---

## COMPLETED PROJECTS

None yet.

---

## KILLED / PAUSED IDEAS

None yet.

---

## PORTFOLIO HEALTH SUMMARY

| Project | Stage | On schedule | Financial | Needs attention |
|---|---|---|---|---|
| freelance-system | Operational | ✅ | No revenue yet | Get first lead |
| lool-ai | Build in progress | 🔄 Core widget done | No spend yet | Attribution tracking → embeddable widget |
| espacio-bosques | Deploy pending | ⬜ Blocked | No spend yet | Alchemy setup |
