# Requirements: Venture OS UI

**Defined:** 2026-04-14
**Core Value:** Everything Jano can do in Claude Code terminal, he can do here — but with a living visual layer that shows how the system thinks, builds, and connects.

## v1 Requirements

### Bridge Server

- [ ] **BRIDGE-01**: Express + WebSocket server starts Claude Code CLI as a subprocess
- [ ] **BRIDGE-02**: User messages from web UI are piped to Claude Code stdin
- [ ] **BRIDGE-03**: Claude Code stdout streams back to web UI via WebSocket (markdown, tool calls, responses)
- [ ] **BRIDGE-04**: Tool permission prompts (approve/deny) are forwarded to UI and resolved via WebSocket callback
- [ ] **BRIDGE-05**: Claude Code hooks emit tool call events to bridge server for activity feed
- [ ] **BRIDGE-06**: Bridge watches filesystem for vault/project changes and emits events
- [ ] **BRIDGE-07**: Single `venture-os` command starts bridge + opens web UI

### Chat Panel

- [ ] **CHAT-01**: User can type messages and send to Claude (same as terminal input)
- [ ] **CHAT-02**: Claude responses stream with markdown rendering (code blocks, tables, lists)
- [ ] **CHAT-03**: Tool calls appear as collapsible cards showing tool name, parameters, and result
- [ ] **CHAT-04**: Approve/Deny buttons for permission-gated tool calls
- [ ] **CHAT-05**: Chat history persists within session (scrollable)
- [ ] **CHAT-06**: Input supports multiline and keyboard shortcuts (Ctrl+Enter to send)

### System Graph

- [ ] **GRAPH-01**: D3/Canvas force-directed graph renders all nodes: projects, agents, tools, MCP servers, vault concepts
- [ ] **GRAPH-02**: Nodes are data-driven — reading agents/*.md, tools/registry.md, skills/registry.md, projects/* at startup
- [ ] **GRAPH-03**: Nodes are categorized with distinct visual styles (color, size, shape per type)
- [ ] **GRAPH-04**: Edges represent relationships (agent→project, tool→agent, concept→concept)
- [ ] **GRAPH-05**: Graph supports zoom, pan, drag nodes, hover tooltips
- [ ] **GRAPH-06**: New nodes appear dynamically (bloom animation) when files are created during session
- [ ] **GRAPH-07**: Click node to open pull-up detail panel

### Process Animations

- [ ] **ANIM-01**: File read → pulse animation on source node
- [ ] **ANIM-02**: Git push → ripple animation outward from project node
- [ ] **ANIM-03**: New vault note created → bloom animation (scale-up with elastic ease)
- [ ] **ANIM-04**: Agent dispatched → beam animation from dispatch center to target project
- [ ] **ANIM-05**: Tool invocation → edge glow + particle flow from agent to tool node
- [ ] **ANIM-06**: Build/process failure → red flicker on project node
- [ ] **ANIM-07**: Cross-project pattern → new edge draws itself between project nodes

### Workspace Panel

- [ ] **WORK-01**: Embedded iframe preview pane pointing to running dev servers
- [ ] **WORK-02**: Auto-detect active ports (3001, 4002, 5174, etc.) and show tabs per project
- [ ] **WORK-03**: Tabs switch between preview, documents, and repo access
- [ ] **WORK-04**: Document viewer shows generated documents from outputs/documents/
- [ ] **WORK-05**: Repo access links open GitHub repos for each project

### Activity Feed

- [ ] **FEED-01**: Bottom strip shows real-time stream of events (tool calls, file edits, vault changes, git ops)
- [ ] **FEED-02**: Each entry has project-colored left border and timestamp
- [ ] **FEED-03**: Entries slide-in animate on arrival
- [ ] **FEED-04**: Feed is scrollable and auto-scrolls to latest

### Layout & Panels

- [ ] **LAYOUT-01**: Three-panel layout: chat (left), graph (center), workspace (right)
- [ ] **LAYOUT-02**: All panel borders are draggable to resize (react-resizable-panels)
- [ ] **LAYOUT-03**: Panel sizes persist to localStorage across sessions
- [ ] **LAYOUT-04**: Pull-up panels slide from bottom for brain zoom, project detail, tool registry
- [ ] **LAYOUT-05**: Panels can be collapsed/expanded via keyboard shortcuts

### Theme Editor

- [ ] **THEME-01**: CSS custom properties engine for all visual tokens (colors, fonts, spacing)
- [ ] **THEME-02**: Theme presets: dark, midnight, terminal, cyberpunk, custom
- [ ] **THEME-03**: Full color customization via color picker (react-colorful)
- [ ] **THEME-04**: Font and spacing customization
- [ ] **THEME-05**: Animation speed/intensity/particle count customization
- [ ] **THEME-06**: Theme persists to localStorage, hydrates on startup without flash

### Document Agent

- [ ] **DOC-01**: New agents/core/documents.md agent definition
- [ ] **DOC-02**: Generate investor updates from project state
- [ ] **DOC-03**: Generate status reports (HTML, preview in workspace panel)
- [ ] **DOC-04**: Generate slide decks (HTML presentations)
- [ ] **DOC-05**: Document output routed to outputs/documents/[project]/

## v2 Requirements

### Advanced Interactions

- **ADV-01**: Playwright ghost cursor — show element highlights in preview when Claude tests via Playwright
- **ADV-02**: Inline file editor — click file paths in activity feed to view/edit source
- **ADV-03**: Voice input — speech-to-text for chat input
- **ADV-04**: Session timeline — horizontal bar showing past session history from claude-mem

### Financial Dashboard

- **FIN-01**: Portfolio-level financial overview (burn, revenue per project)
- **FIN-02**: API cost tracking per session
- **FIN-03**: Runway visualization

### Multi-Session

- **MULTI-01**: Multiple concurrent Claude Code sessions
- **MULTI-02**: Session history browser with replay

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full computer use (screen/mouse/keyboard) | Codespace has no desktop — Playwright covers automated testing |
| Mobile responsive | Desktop power tool, Codespace-only |
| Multi-user collaboration | Jano is sole user |
| Replacing Claude Code internals | Bridge wraps CLI, doesn't reimplement |
| Cloud deployment | Runs locally in Codespace only |
| Custom LLM providers | Anthropic only via Claude Code |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| (populated during roadmap creation) | | |

**Coverage:**
- v1 requirements: 45 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 45

---
*Requirements defined: 2026-04-14*
*Last updated: 2026-04-14 after initial definition*
