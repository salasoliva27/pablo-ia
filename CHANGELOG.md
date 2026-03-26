# CHANGELOG
## Venture OS

### 2026-03-25 — V2 Tools and Skills overhaul
- TOOLS.md rebuilt with dynamic MCP and skill discovery protocols
- Added claude-skills-mcp for semantic skill search from inside sessions
- Added Claude Code built-in MCP Tool Search (lazy loading, 95% context savings)
- learnings/mcp-registry.md restructured into three sections: MCP Tools, Skills, Project Assessments
- 16 new MCP tools documented including Cowork computer use (released March 24 2026)
- 15 new skills documented including feature-dev (89k installs), gstack, /batch, /code-review
- CLAUDE.md updated: Tools/Skills distinction clarified, registry feedback added to session end protocol

### 2026-03-16 — V1 Initial build
- Master repo created with full agent architecture
- Eight agents defined: intake, legal, financial, calendar, performance, trickle-down, developer (+ project agent per repo)
- Module library created: validation, build, gtm, campaigns, performance, learnings, financial, legal
- Three projects registered: freelance-system, lool-ai, espacio-bosques
- Learning database seeded with validated patterns from design sessions
- Storage strategy defined: GitHub + Google Drive 2TB + Cloudflare R2
- Dotfiles configured for automatic credential propagation across all repos
- freelance-system registered and updated with venture-os reporting protocol