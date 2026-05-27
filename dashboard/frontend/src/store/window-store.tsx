import { createContext, useContext, useReducer, useEffect, useRef, useCallback, useMemo, useState, type ReactNode } from 'react';
import type { WindowState, WindowLayout, WindowAction } from '../types/window';
import { rootColor } from '../types/window';
import { INSTANCE_ID, VIEWPORT_ID, releaseMainViewportClaim } from './instance';

// Bumped v6 → v7: bottom window renamed "Activity" → "Tools" and the
// MCP/timeline content moved into the System (center) window. Without this
// bump, persisted layouts would keep displaying the stale title.
const STORAGE_KEY = 'venture-os-window-layout-v7';
const TOPBAR_HEIGHT = 40;
const TASKBAR_HEIGHT = 34;
const BC_CHANNEL = 'janus-ui';
const HEARTBEAT_MS = 3000;
const LIVENESS_TIMEOUT_MS = 10000;
const CLEANUP_INTERVAL_MS = 4000;
const INITIAL_CLAIM_DELAY_MS = 500;

function vw() { return typeof window !== 'undefined' ? window.innerWidth : 1920; }
function vh() { return typeof window !== 'undefined' ? window.innerHeight - TOPBAR_HEIGHT - TASKBAR_HEIGHT : 900; }

// ── Default tiled layout ──

function defaultLayout(): WindowLayout {
  const w = vw(), h = vh();
  const c0 = Math.round(w * 0.22);
  const c1 = Math.round(w * 0.48);
  const c2 = w - c0 - c1;
  const r0 = Math.round(h * 0.65);
  const r1 = h - r0;

  return {
    nextZIndex: 10,
    windows: [
      { id: 'win-chat', title: 'Chat A', type: 'chat',
        x: 0, y: 0, width: c0, height: h,
        minWidth: 200, minHeight: 150,
        zIndex: 4, minimized: false, maximized: false, visible: true, closable: true, persistent: true, sessionId: 'session-0',
        viewportId: 'main',
        lineage: {
          depth: 0,
          label: 'Chat A',
          parentSessionId: null,
          breadcrumb: ['Chat A'],
          color: rootColor('session-0'),
          rootSessionId: 'session-0',
          rootLabel: 'A',
        } },
      { id: 'win-center', title: 'System', type: 'center',
        x: c0, y: 0, width: c1, height: r0,
        minWidth: 200, minHeight: 150,
        zIndex: 3, minimized: false, maximized: false, visible: true, closable: true, persistent: true, viewportId: 'main' },
      { id: 'win-bottom', title: 'Tools', type: 'bottom',
        x: c0, y: r0, width: c1, height: r1,
        minWidth: 200, minHeight: 100,
        zIndex: 2, minimized: false, maximized: false, visible: true, closable: true, persistent: true, viewportId: 'main' },
      { id: 'win-right', title: 'Context', type: 'right',
        x: c0 + c1, y: 0, width: c2, height: h,
        minWidth: 200, minHeight: 150,
        zIndex: 1, minimized: false, maximized: false, visible: true, closable: true, persistent: true, viewportId: 'main' },
    ],
  };
}

// ── Reducer ──

function windowReducer(state: WindowLayout, action: WindowAction): WindowLayout {
  switch (action.type) {
    case 'MOVE':
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === action.id ? { ...w, x: action.x, y: action.y } : w
        ),
      };

    case 'RESIZE':
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === action.id
            ? {
                ...w,
                x: action.x,
                y: action.y,
                width: Math.max(action.width, w.minWidth),
                height: Math.max(action.height, w.minHeight),
                maximized: false,
              }
            : w
        ),
      };

    case 'RESIZE_BATCH': {
      const map = new Map(action.updates.map(u => [u.id, u]));
      return {
        ...state,
        windows: state.windows.map(w => {
          const u = map.get(w.id);
          if (!u) return w;
          return {
            ...w,
            x: u.x, y: u.y,
            width: Math.max(u.width, w.minWidth),
            height: Math.max(u.height, w.minHeight),
            maximized: false,
          };
        }),
      };
    }

    case 'MINIMIZE':
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === action.id ? { ...w, minimized: true } : w
        ),
      };

    case 'RESTORE': {
      const nz = state.nextZIndex + 1;
      return {
        ...state, nextZIndex: nz,
        windows: state.windows.map(w =>
          w.id === action.id ? { ...w, minimized: false, maximized: false, visible: true, zIndex: nz } : w
        ),
      };
    }

    case 'MAXIMIZE': {
      const nz = state.nextZIndex + 1;
      return {
        ...state, nextZIndex: nz,
        windows: state.windows.map(w => {
          if (w.id !== action.id) return w;
          if (w.maximized) {
            const b = w.preMaxBounds || { x: 50, y: 50, width: 600, height: 400 };
            return { ...w, maximized: false, zIndex: nz, ...b, preMaxBounds: undefined };
          }
          return {
            ...w, maximized: true, zIndex: nz,
            preMaxBounds: { x: w.x, y: w.y, width: w.width, height: w.height },
            x: 0, y: 0, width: vw(), height: vh(),
          };
        }),
      };
    }

    case 'FLOAT': {
      const nz = state.nextZIndex + 1;
      const w = vw(), h = vh();
      const floatW = Math.round(w * 0.45);
      const floatH = Math.round(h * 0.55);
      const idx = state.windows.findIndex(win => win.id === action.id);
      const offsetX = Math.round((w - floatW) / 2) + (idx * 30);
      const offsetY = Math.round((h - floatH) / 2) + (idx * 30);
      return {
        ...state, nextZIndex: nz,
        windows: state.windows.map(win =>
          win.id === action.id
            ? { ...win, maximized: false, minimized: false, zIndex: nz,
                x: offsetX, y: offsetY, width: floatW, height: floatH,
                preMaxBounds: undefined }
            : win
        ),
      };
    }

    case 'FOCUS': {
      const nz = state.nextZIndex + 1;
      return {
        ...state, nextZIndex: nz,
        windows: state.windows.map(w =>
          w.id === action.id ? { ...w, zIndex: nz } : w
        ),
      };
    }

    case 'CLOSE': {
      const target = state.windows.find(w => w.id === action.id);
      if (!target || !target.closable) return state;
      if (target.persistent) {
        return {
          ...state,
          windows: state.windows.map(w =>
            w.id === action.id ? { ...w, visible: false, minimized: false } : w
          ),
        };
      }
      return {
        ...state,
        windows: state.windows.filter(w => w.id !== action.id),
      };
    }

    case 'ADD': {
      const nz = state.nextZIndex + 1;
      const incoming = action.window;
      return {
        ...state, nextZIndex: nz,
        windows: [
          ...state.windows,
          { ...incoming, ownerInstanceId: incoming.ownerInstanceId || INSTANCE_ID, zIndex: nz },
        ],
      };
    }

    case 'RESET':
      return defaultLayout();

    case 'REPLACE':
      return action.layout;

    case 'CLAIM': {
      const idset = new Set(action.ids);
      return {
        ...state,
        windows: state.windows.map(w =>
          idset.has(w.id) ? { ...w, ownerInstanceId: action.ownerInstanceId } : w
        ),
      };
    }

    case 'TRANSFER': {
      const nz = state.nextZIndex + 1;
      return {
        ...state,
        nextZIndex: nz,
        windows: state.windows.map(w =>
          w.id === action.id
            ? {
                ...w,
                ownerInstanceId: action.toInstanceId,
                // Cross-screen drag: when toViewportId is provided, re-stamp
                // the window so the receiving browser window's viewport
                // filter actually shows it. Without this the window vanishes
                // from both screens (old viewport still claims it, new
                // viewport's filter rejects it).
                viewportId: action.toViewportId ?? w.viewportId,
                x: action.x ?? w.x,
                y: action.y ?? w.y,
                zIndex: nz,
                minimized: false,
                visible: true,
              }
            : w
        ),
      };
    }

    case 'REMOVE_MANY': {
      const idset = new Set(action.ids);
      return {
        ...state,
        windows: state.windows.filter(w => !idset.has(w.id)),
      };
    }

    case 'REASSIGN_VIEWPORT': {
      const idset = new Set(action.ids);
      const minimize = action.minimize ?? false;
      return {
        ...state,
        windows: state.windows.map(w =>
          idset.has(w.id)
            ? { ...w, viewportId: action.toViewportId, ...(minimize ? { minimized: true } : {}) }
            : w
        ),
      };
    }

    case 'RESET_SESSION_WINDOWS': {
      // Keep the 4 core panels (chat/system/bottom/right) reset to defaults,
      // drop every other window (forks, SQL consoles, calendars, history,
      // tickets — anything ephemeral). Memory + brain are cleared by the
      // dashboard store separately.
      const fresh = defaultLayout();
      return fresh;
    }

    default:
      return state;
  }
}

// ── Persistence ──

const CORE_WINDOW_IDS = ['win-chat', 'win-center', 'win-bottom', 'win-right'];

function mergeMissingCoreWindows(saved: WindowLayout): WindowLayout {
  const fallback = defaultLayout();
  const havingIds = new Set(saved.windows.map(w => w.id));
  const missing = fallback.windows.filter(w => !havingIds.has(w.id));
  if (missing.length === 0) {
    const anyVisible = saved.windows.some(w => CORE_WINDOW_IDS.includes(w.id) && w.visible !== false);
    if (anyVisible) return saved;
    return {
      ...saved,
      windows: saved.windows.map(w =>
        CORE_WINDOW_IDS.includes(w.id)
          ? { ...w, visible: true, minimized: false }
          : w,
      ),
    };
  }
  return {
    nextZIndex: Math.max(saved.nextZIndex, fallback.nextZIndex),
    windows: [...saved.windows, ...missing],
  };
}

function loadLayout(): WindowLayout {
  // Drop pre-v6 keys (they don't have ownerInstanceId on windows).
  try {
    localStorage.removeItem('venture-os-window-layout');
    localStorage.removeItem('venture-os-window-layout-v2');
    localStorage.removeItem('venture-os-window-layout-v3');
    localStorage.removeItem('venture-os-window-layout-v5');
  } catch { /* ignore */ }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WindowLayout;
      if (parsed && Array.isArray(parsed.windows) && parsed.windows.length > 0) {
        // Backfill persistent flag on chat windows saved before persistent: true
        // was added to the spawn paths. Without this, the cleanup interval
        // axes every non-default chat window on the first reload because the
        // previous instanceId is no longer alive.
        const migrated: WindowLayout = {
          ...parsed,
          windows: parsed.windows.map(w =>
            w.type === 'chat' && !w.persistent ? { ...w, persistent: true } : w
          ),
        };
        return mergeMissingCoreWindows(migrated);
      }
    }
  } catch { /* fall through */ }
  return defaultLayout();
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function saveLayout(layout: WindowLayout) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(layout)); } catch { /* quota */ }
  }, 500);
}

// ── BroadcastChannel message types ──

interface BcStateMsg { type: 'state'; instanceId: string; layout: WindowLayout; ts: number }
interface BcHeartbeatMsg { type: 'heartbeat'; instanceId: string; ts: number }
interface BcRequestMsg { type: 'request-state'; instanceId: string; ts: number }
interface BcFarewellMsg { type: 'farewell'; instanceId: string; ts: number }
interface BcReloadMsg { type: 'reload'; instanceId: string; ts: number }
type BcMessage = BcStateMsg | BcHeartbeatMsg | BcRequestMsg | BcFarewellMsg | BcReloadMsg;

// Shared channel handle so non-store code (e.g. Ctrl+R keyboard handler) can
// trigger a fan-out reload without having to thread the BC through React props.
let sharedBc: BroadcastChannel | null = null;
export function broadcastReload() {
  try {
    if (!sharedBc) sharedBc = new BroadcastChannel(BC_CHANNEL);
    sharedBc.postMessage({ type: 'reload', instanceId: INSTANCE_ID, ts: Date.now() } satisfies BcReloadMsg);
  } catch { /* BC unsupported — fall back to local-only reload */ }
}

// ── Context ──

interface WindowManagerValue {
  layout: WindowLayout;
  dispatch: (action: WindowAction) => void;
  instanceId: string;
  /** Live peer browser windows (by instanceId), updated via heartbeats. */
  alivePeers: string[];
  /** Viewport this browser tab represents ('main' or a unique per-tab id). */
  viewportId: string;
  /** Ask all peers to rebroadcast their current layout. Used after a
   *  cross-window transfer to guarantee both source and destination agree on
   *  the new viewport assignment, even if the initial BC delivery was lossy. */
  requestPeerSync: () => void;
}

const WindowManagerContext = createContext<WindowManagerValue | null>(null);

export function WindowManagerProvider({ children }: { children: ReactNode }) {
  const [layout, rawDispatch] = useReducer(windowReducer, null, loadLayout);

  // Track whether the most recent state change came from a remote peer, so
  // the persist/broadcast effect doesn't echo it back and create a loop.
  const fromRemoteRef = useRef(false);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const latestLayoutRef = useRef(layout);
  const aliveRef = useRef<Map<string, number>>(new Map([[INSTANCE_ID, Date.now()]]));
  const [alivePeers, setAlivePeers] = useState<string[]>([INSTANCE_ID]);

  useEffect(() => { latestLayoutRef.current = layout; }, [layout]);

  const dispatch = useCallback((action: WindowAction) => {
    // Auto-stamp ADD actions with this tab's viewport so new chat / SQL /
    // calendar / etc. windows open in the viewport they were spawned from.
    // Callers don't have to know about viewports.
    let effective = action;
    if (action.type === 'ADD' && !action.window.viewportId) {
      effective = { ...action, window: { ...action.window, viewportId: VIEWPORT_ID } };
    }
    // Compute the next layout synchronously and broadcast it BEFORE React
    // renders. Going through useEffect([layout]) was lossy — within a single
    // frame, multiple rAF-driven MOVE dispatches collapse into one render,
    // so peers only saw the final batched state (cursor moved, window didn't).
    // Reducer is pure, so re-running it here for the broadcast is safe and
    // matches what React will commit on the next paint.
    const next = windowReducer(latestLayoutRef.current, effective);
    latestLayoutRef.current = next;
    rawDispatch(effective);
    bcRef.current?.postMessage({ type: 'state', instanceId: INSTANCE_ID, layout: next, ts: Date.now() } satisfies BcStateMsg);
  }, []);

  const applyRemote = useCallback((nextLayout: WindowLayout) => {
    fromRemoteRef.current = true;
    latestLayoutRef.current = nextLayout;
    rawDispatch({ type: 'REPLACE', layout: nextLayout });
  }, []);

  // Persist on every layout change. Broadcast now happens inline in `dispatch`,
  // not here — see comment in the dispatch callback for why.
  useEffect(() => {
    saveLayout(layout);
    if (fromRemoteRef.current) fromRemoteRef.current = false;
  }, [layout]);

  // BroadcastChannel wiring: listen for peer state/heartbeat/farewell,
  // and announce ourselves so peers can sync up.
  useEffect(() => {
    let bc: BroadcastChannel;
    try {
      bc = new BroadcastChannel(BC_CHANNEL);
    } catch {
      // BroadcastChannel not supported (very old browser) — no cross-window sync.
      return;
    }
    bcRef.current = bc;

    function recomputeAlive() {
      const cutoff = Date.now() - LIVENESS_TIMEOUT_MS;
      const live: string[] = [];
      for (const [id, ts] of aliveRef.current) {
        if (ts >= cutoff || id === INSTANCE_ID) live.push(id);
        else aliveRef.current.delete(id);
      }
      live.sort();
      setAlivePeers(live);
      return live;
    }

    bc.onmessage = (e: MessageEvent<BcMessage>) => {
      const msg = e.data;
      if (!msg || msg.instanceId === INSTANCE_ID) return;

      if (msg.type === 'heartbeat') {
        aliveRef.current.set(msg.instanceId, msg.ts);
        recomputeAlive();
      } else if (msg.type === 'state') {
        aliveRef.current.set(msg.instanceId, msg.ts);
        recomputeAlive();
        applyRemote(msg.layout);
      } else if (msg.type === 'request-state') {
        aliveRef.current.set(msg.instanceId, msg.ts);
        recomputeAlive();
        // Reply with current state so the new peer syncs up.
        bc.postMessage({ type: 'state', instanceId: INSTANCE_ID, layout: latestLayoutRef.current, ts: Date.now() } satisfies BcStateMsg);
      } else if (msg.type === 'farewell') {
        aliveRef.current.delete(msg.instanceId);
        recomputeAlive();
      } else if (msg.type === 'reload') {
        // Peer triggered a reload — fan out to this tab too. Tiny stagger
        // so all peers don't slam the dev server at the exact same instant.
        const jitter = Math.floor(Math.random() * 150);
        setTimeout(() => window.location.reload(), jitter);
      }
    };

    // Announce + request peer state.
    bc.postMessage({ type: 'request-state', instanceId: INSTANCE_ID, ts: Date.now() } satisfies BcRequestMsg);

    const heartbeat = setInterval(() => {
      aliveRef.current.set(INSTANCE_ID, Date.now());
      bc.postMessage({ type: 'heartbeat', instanceId: INSTANCE_ID, ts: Date.now() } satisfies BcHeartbeatMsg);
    }, HEARTBEAT_MS);

    const cleanup = setInterval(() => {
      const live = recomputeAlive();
      // Leader election: lowest instanceId is responsible for adopting orphans.
      const leader = live[0];
      if (leader !== INSTANCE_ID) return;

      const currentLayout = latestLayoutRef.current;
      const liveSet = new Set(live);
      const persistentOrphans: string[] = [];
      const ephemeralOrphans: string[] = [];
      for (const w of currentLayout.windows) {
        if (w.ownerInstanceId && !liveSet.has(w.ownerInstanceId)) {
          if (w.persistent) persistentOrphans.push(w.id);
          else ephemeralOrphans.push(w.id);
        }
      }
      if (persistentOrphans.length > 0) {
        dispatch({ type: 'CLAIM', ids: persistentOrphans, ownerInstanceId: INSTANCE_ID });
      }
      if (ephemeralOrphans.length > 0) {
        // Forks / SQL consoles / etc. opened in a now-closed window — drop them.
        dispatch({ type: 'REMOVE_MANY', ids: ephemeralOrphans });
      }
    }, CLEANUP_INTERVAL_MS);

    const onUnload = () => {
      try {
        // If this is a secondary viewport (not 'main'), re-stamp any windows
        // assigned to it back to 'main', minimized — so the user's work
        // doesn't disappear, and doesn't crowd the main view either. We do
        // this via BC so the still-live peers update their layout
        // immediately; the local layout doesn't matter since we're closing.
        if (VIEWPORT_ID !== 'main') {
          const myWindows = latestLayoutRef.current.windows
            .filter(w => w.viewportId === VIEWPORT_ID)
            .map(w => w.id);
          if (myWindows.length > 0) {
            const next = windowReducer(latestLayoutRef.current, {
              type: 'REASSIGN_VIEWPORT',
              ids: myWindows,
              toViewportId: 'main',
              minimize: true,
            });
            // Persist immediately (synchronously) — saveLayout's debounce won't
            // fire on a page that's unloading.
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
            // And broadcast so live peers update without waiting for reload.
            bc.postMessage({ type: 'state', instanceId: INSTANCE_ID, layout: next, ts: Date.now() } satisfies BcStateMsg);
          }
        }
        releaseMainViewportClaim();
        bc.postMessage({ type: 'farewell', instanceId: INSTANCE_ID, ts: Date.now() } satisfies BcFarewellMsg);
      } catch { /* page going away */ }
    };
    window.addEventListener('beforeunload', onUnload);
    window.addEventListener('pagehide', onUnload);

    return () => {
      clearInterval(heartbeat);
      clearInterval(cleanup);
      window.removeEventListener('beforeunload', onUnload);
      window.removeEventListener('pagehide', onUnload);
      onUnload();
      bc.close();
      bcRef.current = null;
    };
  }, [applyRemote, dispatch]);

  // Initial claim: after a short delay (to let peers reply to request-state),
  // claim any persistent windows still without a live owner. Leader-elect so
  // multiple simultaneously-mounting windows don't all try to claim.
  useEffect(() => {
    const timer = setTimeout(() => {
      const cutoff = Date.now() - LIVENESS_TIMEOUT_MS;
      const live: string[] = [];
      for (const [id, ts] of aliveRef.current) {
        if (ts >= cutoff || id === INSTANCE_ID) live.push(id);
      }
      live.sort();
      const leader = live[0];
      if (leader !== INSTANCE_ID) return;

      const liveSet = new Set(live);
      const toClaim = latestLayoutRef.current.windows
        .filter(w => w.persistent && (!w.ownerInstanceId || !liveSet.has(w.ownerInstanceId)))
        .map(w => w.id);
      if (toClaim.length > 0) {
        dispatch({ type: 'CLAIM', ids: toClaim, ownerInstanceId: INSTANCE_ID });
      }
    }, INITIAL_CLAIM_DELAY_MS);
    return () => clearTimeout(timer);
  }, [dispatch]);

  // (Removed: a former onResize handler dispatched RESET on every browser
  // resize, which (a) nuked the user's layout back to the 4-panel default
  // and (b) broadcast that reset to every peer browser-window — so resizing
  // one window or going fullscreen would reset BOTH windows' panel layouts
  // in lockstep. Now we leave panels where the user put them. Panels that
  // overflow after a shrink can be dragged/resized back manually.)

  const requestPeerSync = useCallback(() => {
    try {
      bcRef.current?.postMessage({ type: 'request-state', instanceId: INSTANCE_ID, ts: Date.now() } satisfies BcRequestMsg);
    } catch { /* BC unavailable — nothing else to do */ }
  }, []);

  const value = useMemo<WindowManagerValue>(() => ({
    layout,
    dispatch,
    instanceId: INSTANCE_ID,
    alivePeers,
    viewportId: VIEWPORT_ID,
    requestPeerSync,
  }), [layout, dispatch, alivePeers, requestPeerSync]);

  return (
    <WindowManagerContext.Provider value={value}>
      {children}
    </WindowManagerContext.Provider>
  );
}

export function useWindowManager() {
  const ctx = useContext(WindowManagerContext);
  if (!ctx) throw new Error('useWindowManager must be used within WindowManagerProvider');
  return ctx;
}

export function useWindow(id: string): WindowState | undefined {
  const { layout } = useWindowManager();
  return layout.windows.find(w => w.id === id);
}

/** Convenience: filter the shared layout to windows owned by the current browser window. */
export function useOwnedWindows(): WindowState[] {
  const { layout, instanceId } = useWindowManager();
  return useMemo(
    () => layout.windows.filter(w => w.ownerInstanceId === instanceId),
    [layout.windows, instanceId],
  );
}
