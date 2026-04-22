import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { DashboardState, DashboardActions, Project, ToolStatus, BrainNode, BrainEdge, Notification, Learning, CalendarSlot, FileActivity, CenterView, BrainSource, Document, AgentInfo, MemoryEntry, SessionChatState, ChatMessage, MemoryIndex } from './types/dashboard';
import type { ServerMessage } from './types/bridge';

// ── Static Data (blank-slate fork — populated via discovery) ────────

const PROJECTS: Project[] = [];

// Tools with configuration status — needs-key tools will prompt user
const TOOLS: ToolStatus[] = [
  { id: 'github', name: 'GitHub MCP', shortName: 'GH', callCount: 0, lastCall: 0, active: false, configured: 'ready' },
  { id: 'supabase', name: 'Supabase MCP', shortName: 'SB', callCount: 0, lastCall: 0, active: false, configured: 'ready', envVar: 'SUPABASE_URL', consoleType: 'sql' },
  { id: 'snowflake', name: 'Snowflake', shortName: 'SF', callCount: 0, lastCall: 0, active: false, configured: 'needs-key', envVar: 'SNOWFLAKE_ACCOUNT', consoleType: 'sql' },
  { id: 'playwright', name: 'Playwright', shortName: 'PW', callCount: 0, lastCall: 0, active: false, configured: 'ready' },
  { id: 'brave', name: 'Brave Search', shortName: 'BR', callCount: 0, lastCall: 0, active: false, configured: 'ready', envVar: 'BRAVE_API_KEY' },
  { id: 'obsidian', name: 'Obsidian Vault', shortName: 'OB', callCount: 0, lastCall: 0, active: false, configured: 'ready' },
  { id: 'gmail', name: 'Gmail', shortName: 'GM', callCount: 0, lastCall: 0, active: false, configured: 'needs-auth', authUrl: 'Gmail OAuth' },
  { id: 'calendar', name: 'Google Calendar', shortName: 'GC', callCount: 0, lastCall: 0, active: false, configured: 'needs-auth', authUrl: 'Google Calendar OAuth' },
  { id: 'context7', name: 'Context7', shortName: 'C7', callCount: 0, lastCall: 0, active: false, configured: 'ready' },
  { id: 'claude-sdk', name: 'Claude SDK', shortName: 'CL', callCount: 0, lastCall: 0, active: false, configured: 'ready', envVar: 'ANTHROPIC_API_KEY' },
  { id: 'filesystem', name: 'Filesystem', shortName: 'FS', callCount: 0, lastCall: 0, active: false, configured: 'ready' },
  { id: 'sequential', name: 'Sequential Thinking', shortName: 'ST', callCount: 0, lastCall: 0, active: false, configured: 'ready' },
  { id: 'memory', name: 'Memory MCP', shortName: 'MM', callCount: 0, lastCall: 0, active: false, configured: 'ready' },
];

// Map tool_event toolName strings to our tool IDs
const TOOL_NAME_MAP: Record<string, string> = {
  'mcp__github': 'github', 'mcp__supabase': 'supabase', 'mcp__playwright': 'playwright',
  'mcp__brave-search': 'brave', 'mcp__obsidian-vault': 'obsidian', 'mcp__claude_ai_Gmail': 'gmail',
  'mcp__claude_ai_Google_Calendar': 'calendar', 'mcp__filesystem': 'filesystem',
  'mcp__sequential-thinking': 'sequential', 'mcp__janus-memory': 'memory',
  'Read': 'filesystem', 'Write': 'filesystem', 'Edit': 'filesystem', 'Glob': 'filesystem',
  'Grep': 'filesystem', 'Bash': 'filesystem', 'Agent': 'claude-sdk',
};

function resolveToolId(toolName: string): string | null {
  // Direct match
  if (TOOL_NAME_MAP[toolName]) return TOOL_NAME_MAP[toolName];
  // Prefix match (mcp__github__get_issue -> github)
  for (const [prefix, id] of Object.entries(TOOL_NAME_MAP)) {
    if (toolName.startsWith(prefix)) return id;
  }
  return null;
}

const EXT_LANG: Record<string, string> = {
  '.ts': 'typescript', '.tsx': 'typescript', '.js': 'javascript', '.jsx': 'javascript',
  '.py': 'python', '.rs': 'rust', '.go': 'go', '.java': 'java',
  '.css': 'css', '.scss': 'scss', '.html': 'html', '.htm': 'html',
  '.json': 'json', '.yaml': 'yaml', '.yml': 'yaml', '.toml': 'toml',
  '.md': 'markdown', '.mdx': 'markdown', '.sql': 'sql', '.sh': 'bash',
  '.bash': 'bash', '.zsh': 'bash', '.sol': 'solidity',
  '.svg': 'svg', '.xml': 'xml', '.graphql': 'graphql',
  '.env': 'dotenv', '.txt': 'text', '.csv': 'csv',
  '.png': 'image', '.jpg': 'image', '.jpeg': 'image', '.gif': 'image', '.webp': 'image',
};

export function detectLanguage(filePath: string): string {
  const ext = filePath.slice(filePath.lastIndexOf('.')).toLowerCase();
  return EXT_LANG[ext] || 'text';
}

const NOTIFICATIONS: Notification[] = [];

const LEARNINGS: Learning[] = [];

const TERMINAL_INITIAL = [
  '[bridge] listening on port 3100',
  '[bridge] hook config written to .claude/settings.json',
  '[watcher] watching vault and project directories',
];

// ── Agent Registry (real agents from agents/core/) ─────
export const AGENT_REGISTRY: AgentInfo[] = [
  { id: 'a-dev', name: 'Developer', icon: '>', role: 'Software architecture, build sequencing, technical decisions', description: 'The developer agent handles all code tasks — architecture decisions, build sequencing, feature implementation, and technical debt. It reads project context before touching any code and follows the dispatch protocol for verification.', file: 'agents/core/developer.md', lastUpdated: '2026-04-13T20:13:17Z', tools: ['GitHub', 'Context7', 'Playwright'], linkedAgents: ['a-ux', 'a-security'] },
  { id: 'a-ux', name: 'UX', icon: '◎', role: 'Visual verification, Playwright, design system', description: 'The UX agent verifies every UI change through a multi-layer protocol: code review, server start, desktop + mobile screenshots via Playwright, functional click-through testing, and cross-environment checks.', file: 'agents/core/ux.md', lastUpdated: '2026-04-13T20:13:17Z', tools: ['Playwright'], linkedAgents: ['a-dev'] },
  { id: 'a-legal', name: 'Legal', icon: '§', role: 'Compliance, contracts, regulatory flags', description: 'Handles compliance reviews, contract reviews, and regulatory flags. Automatically surfaces legal concerns when sessions touch regulated projects.', file: 'agents/core/legal.md', lastUpdated: '2026-04-13T20:13:17Z', tools: ['Brave Search'], linkedAgents: [] },
  { id: 'a-financial', name: 'Financial', icon: '$', role: 'Portfolio P&L, burn tracking, runway', description: 'Tracks burn rate, revenue, runway, and P&L across the entire venture portfolio. Produces financial snapshots and flags capacity conflicts when new commitments are proposed.', file: 'agents/core/financial.md', lastUpdated: '2026-04-13T21:40:23Z', tools: ['Google Sheets'], linkedAgents: [] },
  { id: 'a-intake', name: 'Intake', icon: '+', role: 'New idea validation and project spin-up', description: 'Runs the full intake protocol for new ideas: understand, validate (market research), check conflicts, propose structure, and spin up. Challenges weak ideas and capacity conflicts directly.', file: 'agents/core/intake.md', lastUpdated: '2026-04-13T21:20:59Z', tools: ['Brave Search'], linkedAgents: ['a-research'] },
  { id: 'a-research', name: 'Research', icon: '?', role: 'Market research, competitor analysis, discovery', description: 'All research tasks route here. Uses Brave Search, Firecrawl, and NotebookLM with a priority matrix based on research type. Source citations and confidence levels.', file: 'agents/core/research.md', lastUpdated: '2026-04-13T21:56:32Z', tools: ['Brave Search', 'Firecrawl', 'NotebookLM'], linkedAgents: [] },
  { id: 'a-deploy', name: 'Deploy', icon: '↑', role: 'Dev → UAT → prod pipeline, tagging, drift detection', description: 'Manages the deployment pipeline across environments. Handles tagging, drift detection between prod tags and HEAD, and environment promotion with verification gates.', file: 'agents/core/deploy.md', lastUpdated: '2026-04-13T21:20:59Z', tools: ['GitHub'], linkedAgents: [] },
  { id: 'a-calendar', name: 'Calendar', icon: '▦', role: 'Google Cal sync, conflict detection', description: 'Two-way Google Calendar sync via MCP. Detects scheduling conflicts and checks capacity against active projects.', file: 'agents/core/calendar.md', lastUpdated: '2026-04-13T21:20:59Z', tools: ['Google Calendar'], linkedAgents: [] },
  { id: 'a-performance', name: 'Performance', icon: '◆', role: 'Dashboards, weekly summaries, metrics', description: 'Tracks project performance metrics, produces weekly summaries, and maintains dashboards. Monitors build times, test coverage, and delivery velocity.', file: 'agents/core/performance.md', lastUpdated: '2026-04-13T21:20:59Z', tools: ['Google Sheets'], linkedAgents: [] },
  { id: 'a-oversight', name: 'Oversight', icon: '◉', role: 'Product coherence, gap detection, launch readiness', description: 'Sees the full product end-to-end. Walks user flows, finds integration gaps, produces launch readiness checklists, and manages external dependency loops. Works WITH the operator in a loop — does not fix unilaterally.', file: 'agents/core/oversight.md', lastUpdated: '2026-04-13T21:20:59Z', tools: ['Playwright'], linkedAgents: ['a-ux'] },
  { id: 'a-marketing', name: 'Marketing', icon: '◈', role: 'Brand, content, campaigns, email, video', description: 'Handles brand voice, content creation, campaign execution, email outreach via Gmail MCP, and video generation via Remotion. Uses Magic MCP for UI component generation and competitor benchmarking.', file: 'agents/core/marketing.md', lastUpdated: '2026-04-13T20:13:17Z', tools: ['Brave Search', 'Magic MCP', 'Gmail', 'Remotion'], linkedAgents: [] },
  { id: 'a-trickle', name: 'Trickle-Down', icon: '⇣', role: 'Cross-project proposal routing', description: 'When a pattern or proposal should apply across projects, this agent evaluates each project individually and produces ADOPT / ADAPT / REJECT decisions with specific reasoning per project.', file: 'agents/core/trickle-down.md', lastUpdated: '2026-04-13T21:20:59Z', tools: ['GitHub'], linkedAgents: [] },
  { id: 'a-security', name: 'Security', icon: '⊘', role: 'Vulnerability detection, OWASP review, pre-deploy gates', description: 'Runs OWASP top 10 checks, audits auth flows, reviews data handling, and gates deployments. Cross-agent hardening ensures security is checked even when other agents are executing.', file: 'agents/core/security.md', lastUpdated: '2026-04-13T20:13:17Z', tools: ['Playwright', 'GitHub'], linkedAgents: [] },
  { id: 'a-nutrition', name: 'Nutrition', icon: '♥', role: 'Clinical nutrition intelligence', description: 'Domain-specific agent for clinical nutrition. Uses USDA FoodData Central API and Open Food Facts for nutritional data. Provides evidence-based recommendations.', file: 'agents/core/nutrition.md', lastUpdated: '2026-04-13T20:13:17Z', tools: ['USDA API', 'Open Food Facts'], linkedAgents: [] },
  { id: 'a-evolve', name: 'Evolve', icon: '∞', role: 'Self-improvement, capability discovery, memory consolidation', description: 'The system introspection and growth engine. Runs timed loops searching for tools, strengthening knowledge connections, and installing capabilities that benefit all projects. Does not build features — makes the system itself better.', file: 'agents/core/evolve.md', lastUpdated: '2026-04-15T01:58:00Z', tools: ['Brave Search', 'GitHub'], linkedAgents: [] },
];

function makeBrainData(): { nodes: BrainNode[]; edges: BrainEdge[] } {
  // Blank-slate fork — brain populates from the vault/memory during discovery.
  const raw: { id: string; label: string; group: BrainNode['group']; links: string[] }[] = [];

  const groupAngles: Record<string, number> = { wiki: 0, concepts: Math.PI / 2, learnings: Math.PI, agents: (3 * Math.PI) / 2 };
  const cx = 400, cy = 300;

  const nodes: BrainNode[] = raw.map((n) => {
    const base = groupAngles[n.group] || 0;
    const groupNodes = raw.filter(r => r.group === n.group);
    const gi = groupNodes.indexOf(n);
    const spread = 0.8;
    const angle = base + (gi - groupNodes.length / 2) * spread * 0.3;
    const radius = 120 + Math.random() * 100;
    return {
      id: n.id, label: n.label, group: n.group,
      connections: n.links.length,
      x: cx + Math.cos(angle) * radius + (Math.random() - 0.5) * 60,
      y: cy + Math.sin(angle) * radius + (Math.random() - 0.5) * 60,
      vx: 0, vy: 0,
      size: Math.max(4, 3 + n.links.length * 1.5),
    };
  });

  const edges: BrainEdge[] = [];
  for (const n of raw) {
    for (const t of n.links) {
      if (!edges.find(e => (e.source === n.id && e.target === t) || (e.source === t && e.target === n.id))) {
        edges.push({ source: n.id, target: t, firing: false, fireProgress: 0 });
      }
    }
  }
  return { nodes, edges };
}

function makeCalendar(): CalendarSlot[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const slots: CalendarSlot[] = [];
  const now = new Date();
  for (let w = 0; w < 4; w++) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(now);
      date.setDate(now.getDate() + w * 7 + d - now.getDay() + 1);
      slots.push({ date: date.toISOString().slice(0, 10), dayLabel: days[d], load: 0, items: [] });
    }
  }
  return slots;
}

function makeFileActivities(): FileActivity[] {
  const repos: { name: string; color: string }[] = [];
  const files: FileActivity[] = [];
  for (const r of repos) {
    const count = 3 + Math.floor(Math.random() * 8);
    for (let i = 0; i < count; i++) {
      files.push({
        path: `src/${['components', 'hooks', 'utils', 'pages', 'api'][i % 5]}/${['index', 'main', 'auth', 'store', 'types', 'layout', 'modal', 'form'][i % 8]}.tsx`,
        repo: r.name, repoColor: r.color,
        size: 50 + Math.floor(Math.random() * 500),
        lastModified: Date.now() - Math.floor(Math.random() * 604800000),
        changes: Math.floor(Math.random() * 20),
      });
    }
  }
  return files;
}

// ── Context ────────────────────────────────────────────────

const DashboardContext = createContext<(DashboardState & DashboardActions) | null>(null);

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be inside DashboardProvider');
  return ctx;
}

let _idCounter = 0;
const uid = () => `ev-${++_idCounter}-${Date.now()}`;

// ── Per-session chat helpers ────────────────────────────

const DEFAULT_SESSION = 'session-0';

function emptySessionChat(initMessages?: ChatMessage[]): SessionChatState {
  return {
    messages: initMessages || [],
    thinking: false,
    status: 'idle',
    thinkingStart: null,
    lastActivityAt: null,
    inflightTokens: null,
    siblingUpdates: [],
  };
}

/** Get or create a session's chat state */
function getOrCreate(sessions: Record<string, SessionChatState>, sid: string): SessionChatState {
  return sessions[sid] || emptySessionChat();
}

/** Update a specific session's chat state immutably */
function updateSession(
  sessions: Record<string, SessionChatState>,
  sid: string,
  updater: (s: SessionChatState) => SessionChatState,
): Record<string, SessionChatState> {
  const current = getOrCreate(sessions, sid);
  return { ...sessions, [sid]: updater(current) };
}

/** Derive legacy flat fields from session-0 for backward compat */
function deriveLegacy(sessions: Record<string, SessionChatState>) {
  const s0 = sessions[DEFAULT_SESSION] || emptySessionChat();
  return {
    chatMessages: s0.messages,
    chatThinking: s0.thinking,
    chatStatus: s0.status,
    chatThinkingStart: s0.thinkingStart,
  };
}

// Persist key session state across reloads.
// v2: full chatSessions map, no TTL (backend persists the claude session id,
// so the frontend transcript must live as long as the backend session does).
const SESSION_STORAGE_KEY = 'venture-os-session-v2';
const LEGACY_STORAGE_KEY = 'venture-os-session';
const MAX_SAVED_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days — hard ceiling to bound localStorage growth

function cleanSessionForPersist(s: SessionChatState): SessionChatState {
  // Don't persist transient status — reload should always return to a stable idle state
  return {
    messages: s.messages,
    thinking: false,
    status: s.status === 'thinking' || s.status === 'streaming' || s.status === 'disconnected' ? 'done' : s.status,
    thinkingStart: null,
    lastActivityAt: null,
    inflightTokens: null,
    siblingUpdates: s.siblingUpdates.slice(0, 5),
  };
}

function loadPersistedState(): Partial<DashboardState> | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      // One-time migration from the legacy single-session key
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        const saved = JSON.parse(legacy);
        // Legacy stored only session-0 flat — hydrate into chatSessions shape
        if (saved.chatMessages) {
          return {
            ...saved,
            chatSessions: {
              'session-0': {
                messages: saved.chatMessages,
                thinking: false,
                status: 'done',
                thinkingStart: null,
                lastActivityAt: null,
                inflightTokens: null,
                siblingUpdates: [],
              },
            },
          };
        }
        return saved;
      }
      return null;
    }
    const saved = JSON.parse(raw);
    if (saved._savedAt && Date.now() - saved._savedAt > MAX_SAVED_AGE_MS) return null;
    return saved;
  } catch { return null; }
}
function persistState(s: DashboardState) {
  try {
    const cleanedSessions: Record<string, SessionChatState> = {};
    for (const [sid, session] of Object.entries(s.chatSessions)) {
      cleanedSessions[sid] = cleanSessionForPersist(session);
    }
    const toSave = {
      chatSessions: cleanedSessions,
      chatAuth: s.chatAuth,
      memories: s.memories,
      sessionEvents: s.sessionEvents.slice(0, 30),
      agentCounts: s.agentCounts,
      projectCounts: s.projectCounts,
      documents: s.documents.slice(0, 20),
      tools: s.tools.map(t => ({ id: t.id, callCount: t.callCount })),
      _savedAt: Date.now(),
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(toSave));
  } catch { /* quota exceeded, ignore */ }
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const brainData = useRef(makeBrainData());
  const persisted = useRef(loadPersistedState());

  const [state, setState] = useState<DashboardState>(() => {
    const p = persisted.current;
    const restoredTools = p?.tools
      ? TOOLS.map(t => {
          const saved = (p.tools as any[])?.find((st: any) => st.id === t.id);
          return saved ? { ...t, callCount: saved.callCount } : t;
        })
      : TOOLS;

    return {
      projects: PROJECTS,
      agents: [],
      tools: restoredTools,
      memories: (p?.memories as MemoryEntry[]) || [],
      gitCommits: [],
      brainNodes: brainData.current.nodes,
      brainEdges: brainData.current.edges,
      notifications: NOTIFICATIONS,
      sessionEvents: (p?.sessionEvents as any[]) || [],
      learnings: LEARNINGS,
      terminalLines: TERMINAL_INITIAL,
      calendarSlots: makeCalendar(),
      fileActivities: makeFileActivities(),
      documents: (p?.documents as any[]) || [],
      uploadedDocuments: [],
      selectedProject: null,
      selectedBrainNode: null,
      centerView: 'constellation',
      brainSource: 'vault',
      commandPaletteOpen: false,
      scoreboardOpen: false,
      chatSessions: (p?.chatSessions as Record<string, SessionChatState>) || {
        [DEFAULT_SESSION]: emptySessionChat([
          { id: 'sys-1', role: 'system', content: 'Initializing...', timestamp: Date.now() },
        ]),
      },
      chatMessages: ((p?.chatSessions as Record<string, SessionChatState>)?.[DEFAULT_SESSION]?.messages)
        || (p?.chatMessages as ChatMessage[])
        || [{ id: 'sys-1', role: 'system', content: 'Initializing...', timestamp: Date.now() }],
      chatInput: '',
      chatThinking: false,
      chatAuth: (p?.chatAuth as string) || null,
      chatStatus: 'idle',
      chatThinkingStart: null,
      activeDocumentId: null,
      rightPanelTab: 'memory',
      agentCounts: (p?.agentCounts as Record<string, number>) || {},
      projectCounts: (p?.projectCounts as Record<string, number>) || {},
      memoryIndex: null,
    };
  });

  // Persist state on changes (debounced)
  const persistTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => persistState(state), 500);
  }, [state]);

  // ── Fetch auto-memory index (shown in chat header) ────
  useEffect(() => {
    let cancelled = false;
    async function loadMemory() {
      try {
        const resp = await fetch('/api/memory/index');
        if (!resp.ok) return;
        const data = await resp.json();
        if (cancelled) return;
        const idx: MemoryIndex = {
          entries: data.entries || [],
          indexContent: data.indexContent || '',
          dir: data.dir || '',
          fetchedAt: Date.now(),
        };
        setState(s => ({ ...s, memoryIndex: idx }));
      } catch { /* backend may be warming up */ }
    }
    loadMemory();
    const interval = setInterval(loadMemory, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // ── On session resume: check which sessions have persisted claude ids ──
  // When the main session has a persisted backend session, inject a
  // "session resumed" memory pulse so the user sees continuity.
  const resumeChecked = useRef<Set<string>>(new Set());
  useEffect(() => {
    const sid = DEFAULT_SESSION;
    if (resumeChecked.current.has(sid)) return;
    resumeChecked.current.add(sid);
    fetch(`/api/session/${sid}`)
      .then(r => r.json())
      .then(data => {
        if (!data.persisted || !data.claudeSessionId) return;
        setState(s => {
          // Only inject if session has no prior user/assistant messages this load
          const current = s.chatSessions[sid] || emptySessionChat();
          const hasRealMsgs = current.messages.some(m => m.role === 'user' || m.role === 'assistant');
          if (hasRealMsgs) return s;
          const resumeMsg: ChatMessage = {
            id: uid(),
            role: 'memory',
            content: `Resumed previous session (${data.turnCount} prior turns) — Claude will remember the prior conversation.`,
            timestamp: Date.now(),
            memoryAction: 'resume',
            memoryRef: data.claudeSessionId,
          };
          const chatSessions = updateSession(s.chatSessions, sid, ss => ({
            ...ss, messages: [...ss.messages, resumeMsg],
          }));
          return { ...s, chatSessions, ...deriveLegacy(chatSessions) };
        });
      })
      .catch(() => {});
  }, []);

  // ── Fetch graph data from bridge API (vault brain from fs, usage brain from brain_events) ─────
  const brainSource = state.brainSource;
  useEffect(() => {
    let cancelled = false;
    const endpoint = brainSource === 'usage' ? '/api/brain/events' : '/api/graph';

    function loadGraph() {
      fetch(endpoint)
        .then(r => r.json())
        .then((data: { nodes: { id: string; label: string; group: string; links: string[] }[]; edges: { source: string; target: string }[] }) => {
          if (cancelled) return;
          const groupAngles: Record<string, number> = { wiki: 0, concepts: Math.PI / 2, learnings: Math.PI, agents: (3 * Math.PI) / 2 };
          const cx = 400, cy = 300;
          const safeNodes = data.nodes ?? [];
          if (safeNodes.length === 0) {
            // Empty is a valid state for the usage brain — render an empty graph so Jano can watch it grow.
            if (brainSource === 'usage') setState(s => ({ ...s, brainNodes: [], brainEdges: [] }));
            return;
          }
          const nodes: BrainNode[] = safeNodes.map((n) => {
            const group = (n.group as BrainNode['group']) || 'other';
            const base = groupAngles[group] || 0;
            const groupNodes = safeNodes.filter(r => r.group === n.group);
            const gi = groupNodes.indexOf(n);
            const spread = 0.8;
            const angle = base + (gi - groupNodes.length / 2) * spread * 0.3;
            const radius = 120 + Math.random() * 100;
            return {
              id: n.id, label: n.label, group,
              connections: n.links.length,
              x: cx + Math.cos(angle) * radius + (Math.random() - 0.5) * 60,
              y: cy + Math.sin(angle) * radius + (Math.random() - 0.5) * 60,
              vx: 0, vy: 0,
              size: Math.max(4, 3 + n.links.length * 1.5),
            };
          });
          const edges: BrainEdge[] = (data.edges ?? []).map(e => ({ source: e.source, target: e.target, firing: false, fireProgress: 0 }));
          setState(s => ({ ...s, brainNodes: nodes, brainEdges: edges }));
        })
        .catch(() => { /* keep existing graph on error */ });
    }

    loadGraph();
    // Usage brain auto-refreshes so Jano can watch it grow without manually reloading.
    const interval = brainSource === 'usage' ? window.setInterval(loadGraph, 15000) : null;
    return () => {
      cancelled = true;
      if (interval) window.clearInterval(interval);
    };
  }, [brainSource]);

  // ── Process real WebSocket events from bridge ────────────
  // This is called by App.tsx when a WebSocket message arrives
  const handleBridgeMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {
      case 'tool_event': {
        const toolId = resolveToolId(msg.toolName);
        setState(s => {
          const tools = s.tools.map(t => {
            if (t.id === toolId) return { ...t, callCount: t.callCount + 1, lastCall: Date.now(), active: true };
            return t;
          });
          const terminalLines = [...s.terminalLines, `[tool] ${msg.toolName} called`].slice(-100);
          const toolDetail = msg.input ? (typeof msg.input === 'string' ? msg.input : JSON.stringify(msg.input)).slice(0, 120) : undefined;
          const sessionEvents = [{ id: uid(), type: 'tool' as const, label: msg.toolName, detail: toolDetail, timestamp: Date.now() }, ...s.sessionEvents].slice(0, 50);

          // Fire a brain edge if the tool maps to a known concept
          const brainEdges = s.brainEdges.map(e => ({ ...e }));
          if (toolId && Math.random() < 0.3) {
            const idx = Math.floor(Math.random() * brainEdges.length);
            brainEdges[idx] = { ...brainEdges[idx], firing: true, fireProgress: 0 };
          }

          // Increment agent counts — map tool to owning agents
          const agentCounts = { ...s.agentCounts };
          if (toolId) {
            const toolAgentMap: Record<string, string[]> = {
              github: ['Developer', 'Deploy', 'Security', 'Trickle-Down'],
              playwright: ['UX', 'Developer', 'Security', 'Oversight'],
              brave: ['Research', 'Intake', 'Legal', 'Marketing'],
              filesystem: ['Developer'],
              supabase: ['Developer'],
              'claude-sdk': ['Developer'],
              obsidian: ['Research'],
              sequential: ['Oversight'],
            };
            const ownerAgents = toolAgentMap[toolId];
            if (ownerAgents) {
              // Credit the first (primary) agent
              const primary = ownerAgents[0];
              agentCounts[primary] = (agentCounts[primary] || 0) + 1;
            }
          }

          // Increment project counts — scan tool input for project references
          const projectCounts = { ...s.projectCounts };
          const inputStr = msg.input ? (typeof msg.input === 'string' ? msg.input : JSON.stringify(msg.input)) : '';
          for (const proj of s.projects) {
            if (
              inputStr.includes(proj.name) ||
              inputStr.includes(proj.id) ||
              (proj.repo && inputStr.includes(proj.repo))
            ) {
              projectCounts[proj.id] = (projectCounts[proj.id] || 0) + 1;
            }
          }

          // Extract memories from memory/vault tool calls + emit inline chat pulses
          const input = msg.input as Record<string, unknown> | undefined;
          let memories = s.memories;
          const memoryPulses: ChatMessage[] = [];
          if (input && msg.toolName.startsWith('mcp__janus-memory__')) {
            const action = msg.toolName.split('__').pop();
            if (action === 'remember') {
              const content = (input.content as string) || (input.name as string) || '';
              const project = (input.project as string) || undefined;
              const memType: MemoryEntry['type'] = (input.type as string) === 'decision' ? 'decision' : 'learning';
              if (content) {
                const mem: MemoryEntry = { id: uid(), type: memType, direction: 'out', content, project, timestamp: Date.now() };
                memories = [mem, ...memories].slice(0, 100);
                memoryPulses.push({
                  id: uid(), role: 'memory', memoryAction: 'remember',
                  memoryRef: (input.name as string) || content.slice(0, 60),
                  content: content.length > 140 ? content.slice(0, 137) + '...' : content,
                  timestamp: Date.now(),
                });
              }
            } else if (action === 'recall') {
              const query = (input.query as string) || (input.name as string) || 'recall';
              const mem: MemoryEntry = { id: uid(), type: 'recall', direction: 'in', content: query, timestamp: Date.now() };
              memories = [mem, ...memories].slice(0, 100);
              memoryPulses.push({
                id: uid(), role: 'memory', memoryAction: 'recall',
                memoryRef: query,
                content: `recalling "${query}"`,
                timestamp: Date.now(),
              });
            }
          }
          // Pulse when auto-memory files are read/written directly via Read/Write
          if (input && (msg.toolName === 'Read' || msg.toolName === 'Write' || msg.toolName === 'Edit')) {
            const p = (input.file_path || input.path || '') as string;
            if (typeof p === 'string' && p.includes('/.claude/projects/') && p.includes('/memory/') && p.endsWith('.md')) {
              const file = p.split('/').pop() || p;
              memoryPulses.push({
                id: uid(), role: 'memory',
                memoryAction: msg.toolName === 'Read' ? 'read' : 'write',
                memoryRef: file,
                content: `${msg.toolName === 'Read' ? 'read' : 'wrote'} ${file}`,
                timestamp: Date.now(),
              });
            }
          }
          if (input && msg.toolName.startsWith('mcp__obsidian-vault__')) {
            const action = msg.toolName.split('__').pop();
            if (action === 'write_note' || action === 'patch_note') {
              const path = (input.path as string) || (input.note as string) || '';
              const content = (input.content as string) || (input.patch as string) || '';
              const snippet = content.length > 120 ? content.slice(0, 120) + '...' : content;
              if (path) {
                const mem: MemoryEntry = { id: uid(), type: 'learning', direction: 'out', content: `${path}: ${snippet}`, timestamp: Date.now() };
                memories = [mem, ...memories].slice(0, 100);
              }
            } else if (action === 'read_note' || action === 'search_notes') {
              const query = (input.path as string) || (input.query as string) || 'vault read';
              const mem: MemoryEntry = { id: uid(), type: 'context', direction: 'in', content: query, timestamp: Date.now() };
              memories = [mem, ...memories].slice(0, 100);
            }
          }

          // ── Derive learnings from memory writes ────────────
          let learnings = s.learnings;
          if (input && msg.toolName.startsWith('mcp__janus-memory__')) {
            const action = msg.toolName.split('__').pop();
            if (action === 'remember') {
              const content = (input.content as string) || '';
              const name = (input.name as string) || '';
              const project = (input.project as string) || 'all';
              const memType = (input.type as string) || '';
              if (content && memType !== 'recall') {
                const domain = memType === 'decision' ? 'pattern' as const
                  : name.includes('market') ? 'market' as const
                  : name.includes('legal') ? 'legal' as const
                  : name.includes('gtm') ? 'gtm' as const
                  : 'technical' as const;
                const learning: Learning = {
                  id: uid(),
                  rule: content.length > 140 ? content.slice(0, 140) + '...' : content,
                  content,
                  domain,
                  project,
                  timestamp: Date.now(),
                  sourceMemoryIds: [memories[0]?.id || uid()],
                  status: 'active',
                };
                learnings = [learning, ...learnings].slice(0, 50);
              }
            }
          }
          if (input && msg.toolName.startsWith('mcp__obsidian-vault__')) {
            const action = msg.toolName.split('__').pop();
            if (action === 'write_note' || action === 'patch_note') {
              const notePath = (input.path as string) || (input.note as string) || '';
              const content = (input.content as string) || (input.patch as string) || '';
              if (notePath && (notePath.includes('learnings/') || notePath.includes('concepts/'))) {
                const snippet = content.length > 140 ? content.slice(0, 140) + '...' : content;
                const domain = notePath.includes('market') ? 'market' as const
                  : notePath.includes('legal') ? 'legal' as const
                  : notePath.includes('gtm') ? 'gtm' as const
                  : notePath.includes('pattern') ? 'pattern' as const
                  : 'technical' as const;
                const learning: Learning = {
                  id: uid(),
                  rule: `Updated ${notePath.split('/').pop()}: ${snippet}`,
                  content: `${notePath}: ${content.length > 200 ? content.slice(0, 200) + '...' : content}`,
                  domain,
                  project: 'all',
                  timestamp: Date.now(),
                  sourceMemoryIds: [memories[0]?.id || uid()],
                  status: 'active',
                };
                learnings = [learning, ...learnings].slice(0, 50);
              }
            }
          }

          // Detect document creation from Write/Edit tool calls
          let documents = s.documents;
          let activeDocumentId = s.activeDocumentId;
          let rightPanelTab = s.rightPanelTab;

          if (input && (msg.toolName === 'Write' || msg.toolName === 'Edit')) {
            const filePath = (input.file_path || input.path || '') as string;
            const content = (input.content || input.new_string || '') as string;
            if (filePath && content) {
              const filename = filePath.split('/').pop() || filePath;
              const lang = detectLanguage(filePath);
              const docId = `doc-${filePath}`;
              const existing = documents.findIndex(d => d.id === docId);
              const doc: Document = { id: docId, path: filePath, filename, language: lang, content, timestamp: Date.now() };
              if (existing >= 0) {
                documents = [...documents];
                documents[existing] = doc;
              } else {
                documents = [doc, ...documents].slice(0, 50);
              }
              activeDocumentId = docId;
              rightPanelTab = 'documents';
            }
          }

          // Append memory pulses to the originating session's chat stream
          let chatSessions = s.chatSessions;
          if (memoryPulses.length > 0) {
            const pulseSid = (msg as any).sessionId || DEFAULT_SESSION;
            chatSessions = updateSession(chatSessions, pulseSid, ss => ({
              ...ss, messages: [...ss.messages, ...memoryPulses],
            }));
          }

          return {
            ...s, tools, terminalLines, sessionEvents, brainEdges, memories, learnings,
            documents, activeDocumentId, rightPanelTab, agentCounts, projectCounts,
            chatSessions,
            ...(memoryPulses.length > 0 ? deriveLegacy(chatSessions) : {}),
          };
        });

        // Deactivate tool pulse after 800ms
        if (toolId) {
          setTimeout(() => {
            setState(s => ({
              ...s,
              tools: s.tools.map(t => t.id === toolId ? { ...t, active: false } : t),
            }));
          }, 800);
        }
        break;
      }

      case 'fs_event': {
        setState(s => {
          const terminalLines = [...s.terminalLines, `[fs] ${msg.event}: ${msg.path}`].slice(-100);
          const sessionEvents = [{ id: uid(), type: 'edit' as const, label: `${msg.event}: ${msg.path.split('/').pop()}`, detail: msg.path, timestamp: Date.now() }, ...s.sessionEvents].slice(0, 50);
          return { ...s, terminalLines, sessionEvents };
        });
        break;
      }

      case 'learning_update': {
        const l = (msg as any).learning;
        if (l) {
          setState(s => {
            // Deduplicate by id — update if exists, prepend if new
            const exists = s.learnings.findIndex(x => x.id === l.id);
            let learnings: Learning[];
            if (exists >= 0) {
              learnings = s.learnings.map((x, i) => i === exists ? { ...x, rule: l.rule, content: l.content, timestamp: l.timestamp } : x);
            } else {
              learnings = [{ ...l, status: l.status || 'active', sourceMemoryIds: l.sourceMemoryIds || [] } as Learning, ...s.learnings].slice(0, 50);
            }
            return { ...s, learnings };
          });
        }
        break;
      }

      case 'session_start': {
        const sid = (msg as any).sessionId || DEFAULT_SESSION;
        setState(s => {
          const now = Date.now();
          const chatSessions = updateSession(s.chatSessions, sid, ss => ({
            ...ss, thinking: true, status: 'thinking', thinkingStart: now, lastActivityAt: now,
          }));
          return { ...s, chatSessions, chatAuth: (msg as any).auth || 'unknown', ...deriveLegacy(chatSessions) };
        });
        break;
      }

      case 'claude_message': {
        const sid = (msg as any).sessionId || DEFAULT_SESSION;
        const raw = msg.message;
        let text: string | null = null;

        if (typeof raw === 'string') {
          const trimmed = raw.trim();
          const isSystem = trimmed.startsWith('{') || trimmed.startsWith('<command') || trimmed.startsWith('<objective') || trimmed.startsWith('<execution') || trimmed.startsWith('<process');
          if (!isSystem && trimmed.length > 0) text = trimmed;
        } else if (raw && typeof raw === 'object') {
          const obj = raw as Record<string, unknown>;
          if (obj.type !== 'system' && obj.type !== 'result' && obj.subtype !== 'hook_started') {
            const t = (obj.content as string) || (obj.text as string);
            if (t && typeof t === 'string' && !t.startsWith('{')) text = t;
          }
        }

        setState(s => {
          const chatSessions = updateSession(s.chatSessions, sid, ss => ({
            ...ss,
            thinking: false,
            status: 'streaming',
            lastActivityAt: Date.now(),
            messages: text
              ? [...ss.messages, { id: uid(), role: 'assistant' as const, content: text, timestamp: Date.now() }]
              : ss.messages,
          }));
          return { ...s, chatSessions, ...deriveLegacy(chatSessions) };
        });
        break;
      }

      case 'permission_request': {
        const sid = (msg as any).sessionId || DEFAULT_SESSION;
        setState(s => {
          const chatSessions = updateSession(s.chatSessions, sid, ss => ({
            ...ss,
            messages: [...ss.messages, {
              id: uid(), role: 'system' as const,
              content: `Permission needed: ${msg.toolName}\nInput: ${JSON.stringify(msg.input).slice(0, 200)}`,
              timestamp: Date.now(),
            }],
          }));
          return { ...s, chatSessions, ...deriveLegacy(chatSessions) };
        });
        break;
      }

      case 'session_end': {
        const sid = (msg as any).sessionId || DEFAULT_SESSION;
        if (sid === DEFAULT_SESSION) hasActiveSession.current = false;
        // Track which sessions have active processes
        activeSessionIds.current.delete(sid);
        setState(s => {
          const chatSessions = updateSession(s.chatSessions, sid, ss => ({
            ...ss, thinking: false, status: 'done', thinkingStart: null,
            lastActivityAt: Date.now(), inflightTokens: null,
          }));
          // Broadcast sibling summary — tell other sessions what this one just did
          const lastMsgs = getOrCreate(chatSessions, sid).messages;
          const lastAssistant = [...lastMsgs].reverse().find(m => m.role === 'assistant');
          if (lastAssistant) {
            const summary = lastAssistant.content.length > 200
              ? lastAssistant.content.slice(0, 197) + '...'
              : lastAssistant.content;
            const updated = { ...chatSessions };
            for (const [otherId, otherState] of Object.entries(updated)) {
              if (otherId === sid) continue;
              updated[otherId] = {
                ...otherState,
                siblingUpdates: [
                  { sessionId: sid, summary, timestamp: Date.now() },
                  ...otherState.siblingUpdates,
                ].slice(0, 10),
              };
            }
            return {
              ...s, chatSessions: updated,
              terminalLines: [...s.terminalLines, `[session:${sid}] turn complete`].slice(-100),
              ...deriveLegacy(updated),
            };
          }
          return {
            ...s, chatSessions,
            terminalLines: [...s.terminalLines, `[session:${sid}] turn complete`].slice(-100),
            ...deriveLegacy(chatSessions),
          };
        });
        break;
      }

      case 'sibling_summary': {
        // Explicit sibling summary from bridge
        const sid = (msg as any).sessionId || DEFAULT_SESSION;
        const siblingId = (msg as any).siblingId;
        const summary = (msg as any).summary;
        if (siblingId && summary) {
          setState(s => {
            const chatSessions = updateSession(s.chatSessions, sid, ss => ({
              ...ss,
              siblingUpdates: [
                { sessionId: siblingId, summary, timestamp: Date.now() },
                ...ss.siblingUpdates,
              ].slice(0, 10),
            }));
            return { ...s, chatSessions, ...deriveLegacy(chatSessions) };
          });
        }
        break;
      }

      case 'error': {
        const sid = (msg as any).sessionId || DEFAULT_SESSION;
        setState(s => {
          const chatSessions = updateSession(s.chatSessions, sid, ss => ({
            ...ss, thinking: false, status: 'idle', thinkingStart: null,
            lastActivityAt: Date.now(), inflightTokens: null,
          }));
          return {
            ...s, chatSessions,
            terminalLines: [...s.terminalLines, `[error] ${msg.message}`].slice(-100),
            ...deriveLegacy(chatSessions),
          };
        });
        break;
      }
    }
  }, []);

  // Expose handleBridgeMessage via ref so App can call it
  const bridgeHandlerRef = useRef(handleBridgeMessage);
  bridgeHandlerRef.current = handleBridgeMessage;

  // Track which sessions have active processes (for fork sessions)
  const activeSessionIds = useRef(new Set<string>());

  // WebSocket send function — injected by App.tsx
  const wsSendRef = useRef<((msg: any) => void) | null>(null);
  const wsRegistered = useRef(false);
  const registerWsSend = useCallback((send: (msg: any) => void) => {
    wsSendRef.current = send;
    if (!wsRegistered.current) {
      wsRegistered.current = true;
      const readyMsg: ChatMessage = { id: uid(), role: 'system', content: 'Ready.', timestamp: Date.now() };
      setState(s => {
        const chatSessions = updateSession(s.chatSessions, DEFAULT_SESSION, ss => ({
          ...ss, messages: [...ss.messages, readyMsg],
        }));
        return { ...s, chatSessions, ...deriveLegacy(chatSessions) };
      });
    }
  }, []);
  const hasActiveSession = useRef(false);

  // ── Actions ──────────────────────────────────────────────

  const selectProject = useCallback((id: string | null) => setState(s => ({ ...s, selectedProject: id })), []);
  const selectBrainNode = useCallback((id: string | null) => setState(s => ({ ...s, selectedBrainNode: id })), []);
  const setCenterView = useCallback((view: CenterView) => setState(s => ({ ...s, centerView: view })), []);
  const setBrainSource = useCallback((source: BrainSource) => setState(s => ({ ...s, brainSource: source })), []);
  const toggleCommandPalette = useCallback(() => setState(s => ({ ...s, commandPaletteOpen: !s.commandPaletteOpen })), []);
  const toggleScoreboard = useCallback(() => setState(s => ({ ...s, scoreboardOpen: !s.scoreboardOpen })), []);
  const dismissNotification = useCallback((id: string) => setState(s => ({ ...s, notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n) })), []);
  const addTerminalLine = useCallback((line: string) => setState(s => ({ ...s, terminalLines: [...s.terminalLines, line].slice(-100) })), []);
  const setActiveDocument = useCallback((id: string | null) => setState(s => ({ ...s, activeDocumentId: id })), []);
  const setRightPanelTab = useCallback((tab: 'memory' | 'documents' | 'uploaded' | 'editor') => setState(s => ({ ...s, rightPanelTab: tab })), []);
  const addUploadedDocument = useCallback((doc: Document) => setState(s => {
    const existing = s.uploadedDocuments.findIndex(d => d.id === doc.id);
    const next = existing >= 0
      ? s.uploadedDocuments.map((d, i) => i === existing ? doc : d)
      : [doc, ...s.uploadedDocuments].slice(0, 50);
    return { ...s, uploadedDocuments: next, activeDocumentId: doc.id, rightPanelTab: 'uploaded' };
  }), []);

  // Listen for keyboard shortcut custom events
  useEffect(() => {
    const onPalette = () => toggleCommandPalette();
    const onScoreboard = () => toggleScoreboard();
    const onAgentChange = (e: Event) => {
      const agentId = (e as CustomEvent).detail?.agentId;
      if (!agentId) return;
      const send = wsSendRef.current;
      if (send) {
        const modelId = localStorage.getItem(`venture-os-model-${agentId}`) || undefined;
        send({ type: 'set_agent', sessionId: DEFAULT_SESSION, agentId, modelId });
      }
    };
    const onModelChange = (e: Event) => {
      const modelId = (e as CustomEvent).detail?.modelId;
      if (!modelId) return;
      const send = wsSendRef.current;
      if (send) send({ type: 'set_model', sessionId: DEFAULT_SESSION, modelId });
    };
    window.addEventListener('venture-os:toggle-palette', onPalette);
    window.addEventListener('venture-os:toggle-scoreboard', onScoreboard);
    window.addEventListener('venture-os:agent-change', onAgentChange);
    window.addEventListener('venture-os:model-change', onModelChange);
    return () => {
      window.removeEventListener('venture-os:toggle-palette', onPalette);
      window.removeEventListener('venture-os:toggle-scoreboard', onScoreboard);
      window.removeEventListener('venture-os:agent-change', onAgentChange);
      window.removeEventListener('venture-os:model-change', onModelChange);
    };
  }, [toggleCommandPalette, toggleScoreboard]);

  const sendChatMessage = useCallback((content: string, sessionId: string = DEFAULT_SESSION) => {
    if (!content.trim()) return;
    const trimmed = content.trim();
    const sid = sessionId;

    // If editing, truncate from the edit point first, then add the new message
    const editIdx = editingFromIdx.current;
    editingFromIdx.current = null;

    const userMsg: ChatMessage = { id: uid(), role: 'user', content: trimmed, timestamp: Date.now() };

    setState(s => {
      const chatSessions = updateSession(s.chatSessions, sid, ss => {
        const base = editIdx !== null ? ss.messages.slice(0, editIdx) : ss.messages;
        return {
          ...ss,
          messages: [...base, userMsg],
          status: editIdx !== null ? 'idle' as const : ss.status,
          thinking: editIdx !== null ? false : ss.thinking,
          thinkingStart: editIdx !== null ? null : ss.thinkingStart,
        };
      });
      return { ...s, chatSessions, chatInput: '', ...deriveLegacy(chatSessions) };
    });

    // Reset session when editing so next response starts fresh
    if (editIdx !== null && sid === DEFAULT_SESSION) {
      hasActiveSession.current = false;
    }

    // Detect credential input (e.g. BRAVE_API_KEY=sk-...) — these are for external MCPs, not Claude
    const keyMatch = trimmed.match(/^([\w_]+)\s*[=:]\s*(\S+)/);
    if (keyMatch) {
      const [, envName] = keyMatch;
      setState(s => {
        const tool = s.tools.find(t => t.envVar === envName);
        const tools = tool
          ? s.tools.map(t => t.id === tool.id ? { ...t, configured: 'ready' as const } : t)
          : s.tools;
        const sysMsg: ChatMessage = {
          id: uid(), role: 'system',
          content: tool
            ? `Stored ${envName} for ${tool.name}. Adding to dotfiles repo. ${tool.name} is now ready.`
            : `Stored ${envName}. Adding to dotfiles repo.`,
          timestamp: Date.now(),
        };
        const chatSessions = updateSession(s.chatSessions, sid, ss => ({
          ...ss, messages: [...ss.messages, sysMsg],
        }));
        return { ...s, tools, chatSessions, ...deriveLegacy(chatSessions) };
      });
      return;
    }

    // Everything else → send through bridge WebSocket as a Claude session
    const send = wsSendRef.current;
    if (!send) {
      setState(s => {
        const sysMsg: ChatMessage = { id: uid(), role: 'system', content: 'Bridge not connected. Waiting for connection...', timestamp: Date.now() };
        const chatSessions = updateSession(s.chatSessions, sid, ss => ({
          ...ss, messages: [...ss.messages, sysMsg],
        }));
        return { ...s, chatSessions, ...deriveLegacy(chatSessions) };
      });
      return;
    }

    // Message interruption: if agent is mid-response, interrupt and re-inject
    const sessionChat = state.chatSessions[sid];
    const currentStatus = sessionChat?.status;
    if (currentStatus === 'thinking' || currentStatus === 'streaming') {
      send({ type: 'interrupt', sessionId: sid });

      const sysMsg: ChatMessage = { id: uid(), role: 'system', content: 'Incorporating your message...', timestamp: Date.now() };
      setState(s => {
        const chatSessions = updateSession(s.chatSessions, sid, ss => ({
          ...ss, messages: [...ss.messages, sysMsg],
        }));
        return { ...s, chatSessions, ...deriveLegacy(chatSessions) };
      });

      setTimeout(() => {
        send({
          type: 'follow_up',
          prompt: `[User interrupted with additional context: ${trimmed}]\n\nPlease incorporate the above into your response and continue.`,
          sessionId: sid,
        });
      }, 300);

      setState(s => {
        const chatSessions = updateSession(s.chatSessions, sid, ss => ({
          ...ss, thinking: true, status: 'thinking', thinkingStart: Date.now(),
        }));
        return { ...s, chatSessions, ...deriveLegacy(chatSessions) };
      });
      return;
    }

    setState(s => {
      const chatSessions = updateSession(s.chatSessions, sid, ss => ({
        ...ss, thinking: true, status: 'thinking', thinkingStart: Date.now(),
      }));
      return { ...s, chatSessions, ...deriveLegacy(chatSessions) };
    });

    const isMainSession = sid === DEFAULT_SESSION;
    const isActive = isMainSession ? hasActiveSession.current : activeSessionIds.current.has(sid);

    const agentId = localStorage.getItem('venture-os-agent') || 'claude';
    const modelId = localStorage.getItem(`venture-os-model-${agentId}`) || undefined;

    if (!isActive) {
      // Include sibling context for forked sessions
      let enrichedPrompt = trimmed;
      if (!isMainSession && sessionChat?.siblingUpdates?.length) {
        const siblingContext = sessionChat.siblingUpdates
          .slice(0, 3)
          .map(u => `[Sibling ${u.sessionId}: ${u.summary}]`)
          .join('\n');
        enrichedPrompt = `[Context from sibling sessions]\n${siblingContext}\n[End sibling context]\n\n${trimmed}`;
      }
      send({ type: 'start', prompt: enrichedPrompt, sessionId: sid, agentId, modelId });
      if (isMainSession) hasActiveSession.current = true;
      else activeSessionIds.current.add(sid);
    } else {
      send({ type: 'follow_up', prompt: trimmed, sessionId: sid, agentId, modelId });
    }
  }, [state.chatSessions]);

  // Called by App.tsx when the WebSocket transitions to 'disconnected'.
  // Demotes any active thinking/streaming session to 'disconnected' so the UI
  // stops lying about "responding" when the bridge has actually died.
  const onConnectionLost = useCallback(() => {
    setState(s => {
      const next: Record<string, SessionChatState> = {};
      let changed = false;
      for (const [sid, ss] of Object.entries(s.chatSessions)) {
        if (ss.status === 'thinking' || ss.status === 'streaming') {
          next[sid] = { ...ss, thinking: false, status: 'disconnected', lastActivityAt: Date.now() };
          changed = true;
        } else {
          next[sid] = ss;
        }
      }
      if (!changed) return s;
      return { ...s, chatSessions: next, ...deriveLegacy(next) };
    });
    hasActiveSession.current = false;
    activeSessionIds.current.clear();
  }, []);

  // Called by App.tsx when the WebSocket reconnects. Clears 'disconnected' state
  // so the next user message can flow normally.
  const onConnectionRestored = useCallback(() => {
    setState(s => {
      const next: Record<string, SessionChatState> = {};
      let changed = false;
      for (const [sid, ss] of Object.entries(s.chatSessions)) {
        if (ss.status === 'disconnected') {
          next[sid] = { ...ss, status: 'idle', lastActivityAt: Date.now() };
          changed = true;
        } else {
          next[sid] = ss;
        }
      }
      if (!changed) return s;
      return { ...s, chatSessions: next, ...deriveLegacy(next) };
    });
  }, []);

  const stopResponse = useCallback((sessionId: string = DEFAULT_SESSION) => {
    const send = wsSendRef.current;
    if (send) {
      send({ type: 'interrupt', sessionId });
    }
    if (sessionId === DEFAULT_SESSION) hasActiveSession.current = false;
    else activeSessionIds.current.delete(sessionId);

    const sysMsg: ChatMessage = { id: uid(), role: 'system', content: 'Response stopped.', timestamp: Date.now() };
    setState(s => {
      const chatSessions = updateSession(s.chatSessions, sessionId, ss => ({
        ...ss, thinking: false, status: 'idle', thinkingStart: null,
        messages: [...ss.messages, sysMsg],
      }));
      return { ...s, chatSessions, ...deriveLegacy(chatSessions) };
    });
  }, []);

  // Track which message is being edited — truncation happens on send, not on click
  const editingFromIdx = useRef<number | null>(null);

  const editMessage = useCallback((messageId: string, sessionId: string = DEFAULT_SESSION): string | null => {
    let editContent: string | null = null;
    setState(s => {
      const session = getOrCreate(s.chatSessions, sessionId);
      const idx = session.messages.findIndex(m => m.id === messageId);
      if (idx < 0 || session.messages[idx].role !== 'user') return s;
      editContent = session.messages[idx].content;
      editingFromIdx.current = idx;
      return s; // Don't mutate yet — wait for submit
    });
    return editContent;
  }, []);

  const getSessionChat = useCallback((sessionId: string): SessionChatState => {
    return state.chatSessions[sessionId] || emptySessionChat();
  }, [state.chatSessions]);

  const forkChat = useCallback((parentSessionId: string, label: string): string => {
    const newSessionId = `session-${Date.now()}`;
    const send = wsSendRef.current;

    // Copy parent messages as fork context
    const parentSession = state.chatSessions[parentSessionId] || emptySessionChat();
    const forkMessageIndex = parentSession.messages.length;

    // Initialize the new session with a copy of parent messages + system note
    const forkNote: ChatMessage = {
      id: uid(), role: 'system',
      content: `Forked from ${parentSessionId} as "${label}". This session shares context but runs independently.`,
      timestamp: Date.now(),
    };

    setState(s => {
      const chatSessions = {
        ...s.chatSessions,
        [newSessionId]: emptySessionChat([...parentSession.messages, forkNote]),
      };
      return { ...s, chatSessions };
    });

    if (send) {
      send({
        type: 'fork',
        parentSessionId,
        newSessionId,
        forkLabel: label,
        forkMessageIndex,
      });
    }

    // Dispatch custom event so WindowShell can create the window
    window.dispatchEvent(new CustomEvent('venture-os:fork-chat', {
      detail: { sessionId: newSessionId, parentSessionId, label, depth: 1, messages: [...parentSession.messages] },
    }));

    return newSessionId;
  }, [state.chatSessions]);

  const actions: DashboardActions = { selectProject, selectBrainNode, setCenterView, setBrainSource, toggleCommandPalette, toggleScoreboard, sendChatMessage, stopResponse, editMessage, getSessionChat, dismissNotification, addTerminalLine, setActiveDocument, setRightPanelTab, addUploadedDocument, forkChat };

  return (
    <DashboardContext.Provider value={{ ...state, ...actions, _handleBridgeMessage: handleBridgeMessage, _registerWsSend: registerWsSend, _onConnectionLost: onConnectionLost, _onConnectionRestored: onConnectionRestored } as any}>
      {children}
    </DashboardContext.Provider>
  );
}

// Hooks for App.tsx to wire WebSocket to store
export function useBridgeHandler(): (msg: ServerMessage) => void {
  const ctx = useContext(DashboardContext) as any;
  return ctx?._handleBridgeMessage || (() => {});
}

export function useRegisterWsSend(): (send: (msg: any) => void) => void {
  const ctx = useContext(DashboardContext) as any;
  return ctx?._registerWsSend || (() => {});
}

export function useConnectionStateSync() {
  const ctx = useContext(DashboardContext) as any;
  return {
    onConnectionLost: ctx?._onConnectionLost || (() => {}),
    onConnectionRestored: ctx?._onConnectionRestored || (() => {}),
  };
}
