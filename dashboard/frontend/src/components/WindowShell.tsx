import { useEffect } from 'react';
import { useWindowManager } from '../store/window-store';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useDashboard, inferShortChatTitle } from '../store';
import { Window } from './Window';
import { Taskbar } from './Taskbar';
import '../styles/window-manager.css';
import { ChatPanel } from './ChatPanel';
import { Constellation } from './Constellation';
import { BrainView } from './BrainView';
import { FileHeatmapView } from './FileHeatmapView';
import { ProcedureMap } from './ProcedureMap';
import { CalendarPanel } from './CalendarPanel';
import { TicketsPanel } from './TicketsPanel';
import { RightPanel } from './RightPanel';
import { ToolPulseBar } from './ToolPulseBar';
import { BottomPanel } from './BottomPanel';
import { SQLConsole } from './SQLConsole';
import { ChatHistoryPanel } from './ChatHistoryPanel';
import { rootColor, JANUS_WINDOW_DRAG_MIME } from '../types/window';
import type { WindowState } from '../types/window';

function CenterContent() {
  const { centerView } = useDashboard();
  let view: React.ReactNode;
  if (centerView === 'brain') view = <BrainView />;
  else if (centerView === 'procedures') view = <ProcedureMap />;
  else if (centerView === 'files') view = <FileHeatmapView />;
  else view = <Constellation />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ToolPulseBar />
      <div style={{ flex: 1, minHeight: 0 }}>{view}</div>
    </div>
  );
}

function renderWindowContent(win: WindowState) {
  switch (win.type) {
    case 'chat': {
      return (
        <ChatPanel
          sessionId={win.sessionId || 'session-0'}
        />
      );
    }
    case 'center':
      return <CenterContent />;
    case 'bottom':
      return <BottomPanel />;
    case 'right':
      return <RightPanel />;
    case 'calendar':
      return <CalendarPanel />;
    case 'tickets':
      return <TicketsPanel />;
    case 'sql-console':
      return <SQLConsole tool={win.consoleTool || 'supabase'} />;
    case 'chat-history':
      return <ChatHistoryPanel />;
    default:
      return <div style={{ padding: 16, color: 'var(--color-text-muted)' }}>Window: {win.type}</div>;
  }
}

export function WindowShell() {
  const { layout, dispatch, instanceId, viewportId, requestPeerSync } = useWindowManager();
  useKeyboardShortcuts();

  // Cross-window drop target: when the user drags a window's "send" handle
  // from another browser-window (same origin), HTML5 DnD delivers it here.
  // We claim ownership for this instance + relocate the window to the drop
  // coordinates so it lands where the cursor released.
  useEffect(() => {
    function onDragOver(e: DragEvent) {
      const types = e.dataTransfer?.types;
      if (!types) return;
      if (!Array.from(types).includes(JANUS_WINDOW_DRAG_MIME)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    }
    function onDrop(e: DragEvent) {
      const id = e.dataTransfer?.getData(JANUS_WINDOW_DRAG_MIME);
      if (!id) return;
      e.preventDefault();
      // Drop position in the receiving window's viewport. Offset so the
      // titlebar lands near the cursor, not the window's top-left corner.
      const dropX = Math.max(0, e.clientX - 80);
      const dropY = Math.max(0, e.clientY - 14);
      // Pass this tab's viewport so the dropped window is re-stamped — without
      // this the popout's viewport filter would hide it and it would vanish.
      dispatch({ type: 'TRANSFER', id, toInstanceId: instanceId, toViewportId: viewportId, x: dropX, y: dropY });
    }
    document.addEventListener('dragover', onDragOver);
    document.addEventListener('drop', onDrop);
    return () => {
      document.removeEventListener('dragover', onDragOver);
      document.removeEventListener('drop', onDrop);
    };
  }, [dispatch, instanceId, viewportId]);

  // The first-run chat-only gate was removed: the user wants the full
  // dashboard visible from the start with empty panels (Projects empty,
  // Brain awaiting account setup, Context blank, Activity showing only
  // the brand-agnostic timeline/calendar/learnings/terminal). The
  // /onboard auto-trigger still fires inside ChatPanel — Pablo / JP / new
  // user just sees the full layout while the onboarding interview runs
  // in the chat panel beside them. Brand isolation is now enforced at
  // the bridge env-strip layer (see bin/venture-os.ts) rather than by
  // hiding the UI.

  // Listen for fork-chat / new-chat events from the store
  useEffect(() => {
    function handleFork(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (!detail?.sessionId) return;

      const depth = detail.depth || 1;
      const rootSid = detail.rootSessionId || detail.parentSessionId || 'session-0';
      const rootLabel = detail.rootLabel;
      const color = rootColor(rootSid);
      const parentLabel = rootLabel ? `Chat ${rootLabel}` : 'Main';

      const vw = window.innerWidth;
      const vh = window.innerHeight - 40 - 34;

      const newWin: WindowState = {
        id: `win-chat-${detail.sessionId}`,
        title: rootLabel ? `${rootLabel}·${depth} ${detail.label || ''}`.trim() : (detail.label || 'Fork'),
        type: 'chat',
        x: Math.round(vw * 0.2) + (layout.windows.length * 30),
        y: Math.round(vh * 0.1) + (layout.windows.length * 30),
        width: Math.round(vw * 0.4),
        height: Math.round(vh * 0.5),
        minWidth: 200,
        minHeight: 150,
        zIndex: 0,
        minimized: false,
        maximized: false,
        visible: true,
        closable: true,
        persistent: true,
        sessionId: detail.sessionId,
        lineage: {
          depth,
          label: detail.label || 'Fork',
          parentSessionId: detail.parentSessionId || 'session-0',
          breadcrumb: [parentLabel, detail.label || 'Fork'],
          color,
          rootSessionId: rootSid,
          rootLabel,
        },
      };

      dispatch({ type: 'ADD', window: newWin });
    }

    function handleNewChat(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (!detail?.sessionId) return;

      const rootSid: string = detail.rootSessionId || detail.sessionId;
      const rootLabel: string = detail.rootLabel || '?';
      const color = rootColor(rootSid);

      const vw = window.innerWidth;
      const vh = window.innerHeight - 40 - 34;

      const newWin: WindowState = {
        id: `win-chat-${detail.sessionId}`,
        title: `Chat ${rootLabel}`,
        type: 'chat',
        x: Math.round(vw * 0.18) + (layout.windows.length * 30),
        y: Math.round(vh * 0.08) + (layout.windows.length * 30),
        width: Math.round(vw * 0.4),
        height: Math.round(vh * 0.55),
        minWidth: 200,
        minHeight: 150,
        zIndex: 0,
        minimized: false,
        maximized: false,
        visible: true,
        closable: true,
        persistent: true,
        sessionId: detail.sessionId,
        lineage: {
          depth: 0,
          label: `Chat ${rootLabel}`,
          parentSessionId: null,
          breadcrumb: [`Chat ${rootLabel}`],
          color,
          rootSessionId: rootSid,
          rootLabel,
        },
      };

      dispatch({ type: 'ADD', window: newWin });
    }

    window.addEventListener('venture-os:fork-chat', handleFork);
    window.addEventListener('venture-os:new-chat', handleNewChat);

    function handleOpenSqlConsole(e: Event) {
      const detail = (e as CustomEvent).detail as { tool?: 'supabase' | 'snowflake' };
      const tool = detail?.tool === 'snowflake' ? 'snowflake' : 'supabase';
      const winId = `win-sql-${tool}`;

      const existing = layout.windows.find(w => w.id === winId);
      if (existing) {
        // Focus + restore if minimized
        dispatch({ type: 'RESTORE', id: winId });
        dispatch({ type: 'FOCUS', id: winId });
        return;
      }

      const vw = window.innerWidth;
      const vh = window.innerHeight - 40 - 34;
      const w = Math.round(vw * 0.55);
      const h = Math.round(vh * 0.65);

      const newWin: WindowState = {
        id: winId,
        title: `${tool === 'supabase' ? 'Supabase' : 'Snowflake'} SQL`,
        type: 'sql-console',
        consoleTool: tool,
        x: Math.round((vw - w) / 2) + (layout.windows.length * 20),
        y: Math.round((vh - h) / 2) + (layout.windows.length * 20),
        width: w,
        height: h,
        minWidth: 420,
        minHeight: 280,
        zIndex: 0,
        minimized: false,
        maximized: false,
        visible: true,
        closable: true,
      };
      dispatch({ type: 'ADD', window: newWin });
    }
    window.addEventListener('venture-os:open-sql-console', handleOpenSqlConsole);

    function handleOpenChatHistory() {
      const winId = 'win-chat-history';
      const existing = layout.windows.find(w => w.id === winId);
      if (existing) {
        dispatch({ type: 'RESTORE', id: winId });
        dispatch({ type: 'FOCUS', id: winId });
        return;
      }

      const vw = window.innerWidth;
      const vh = window.innerHeight - 40 - 34;
      const w = Math.round(vw * 0.48);
      const h = Math.round(vh * 0.68);

      const newWin: WindowState = {
        id: winId,
        title: 'Chat History',
        type: 'chat-history',
        x: Math.max(16, Math.round(vw - w - 28)),
        y: Math.max(16, Math.round(vh - h - 28)),
        width: w,
        height: h,
        minWidth: 480,
        minHeight: 320,
        zIndex: 0,
        minimized: false,
        maximized: false,
        visible: true,
        closable: true,
      };
      dispatch({ type: 'ADD', window: newWin });
    }
    window.addEventListener('venture-os:open-chat-history', handleOpenChatHistory);

    function handleFocusChat(e: Event) {
      const detail = (e as CustomEvent).detail as {
        sessionId: string;
        label?: string;
        rootSessionId?: string | null;
        rootLabel?: string;
      };
      if (!detail?.sessionId) return;
      // If a window for this session already exists, just focus + restore it.
      const existing = layout.windows.find(
        w => w.type === 'chat' && w.sessionId === detail.sessionId,
      );
      if (existing) {
        dispatch({ type: 'RESTORE', id: existing.id });
        dispatch({ type: 'FOCUS', id: existing.id });
        return;
      }
      // Otherwise spawn a chat window pointing at the (possibly restored)
      // session. Identical shape to the fork/new handlers above.
      const vw = window.innerWidth;
      const vh = window.innerHeight - 40 - 34;
      const rootSid = detail.rootSessionId || detail.sessionId;
      const rootLabel = detail.rootLabel || 'A';
      const color = rootColor(rootSid);
      const newWin: WindowState = {
        id: `win-chat-${detail.sessionId}`,
        title: detail.label || `Chat ${rootLabel}`,
        type: 'chat',
        x: Math.round(vw * 0.18) + (layout.windows.length * 30),
        y: Math.round(vh * 0.08) + (layout.windows.length * 30),
        width: Math.round(vw * 0.4),
        height: Math.round(vh * 0.55),
        minWidth: 200,
        minHeight: 150,
        zIndex: 0,
        minimized: false,
        maximized: false,
        visible: true,
        closable: true,
        persistent: true,
        sessionId: detail.sessionId,
        lineage: {
          depth: 0,
          label: detail.label || `Chat ${rootLabel}`,
          parentSessionId: null,
          breadcrumb: [detail.label || `Chat ${rootLabel}`],
          color,
          rootSessionId: rootSid,
          rootLabel,
        },
      };
      dispatch({ type: 'ADD', window: newWin });
    }
    window.addEventListener('venture-os:focus-chat', handleFocusChat);

    function handleRestartWorkspace() {
      dispatch({ type: 'RESET_SESSION_WINDOWS' });
    }
    window.addEventListener('venture-os:restart-workspace', handleRestartWorkspace);

    function handleWindowTransferredOut() {
      // The cross-window drag's drop fired in a peer browser-window and that
      // peer's TRANSFER dispatch broadcast the new layout. Ask peers to
      // re-state in case the first broadcast was lost — guarantees this
      // (source) window's layout converges so the panel doesn't remain
      // double-rendered.
      requestPeerSync();
    }
    window.addEventListener('venture-os:window-transferred-out', handleWindowTransferredOut);

    return () => {
      window.removeEventListener('venture-os:fork-chat', handleFork);
      window.removeEventListener('venture-os:new-chat', handleNewChat);
      window.removeEventListener('venture-os:open-sql-console', handleOpenSqlConsole);
      window.removeEventListener('venture-os:open-chat-history', handleOpenChatHistory);
      window.removeEventListener('venture-os:focus-chat', handleFocusChat);
      window.removeEventListener('venture-os:restart-workspace', handleRestartWorkspace);
      window.removeEventListener('venture-os:window-transferred-out', handleWindowTransferredOut);
    };
  }, [dispatch, layout.windows, requestPeerSync]);

  const { getSessionChat } = useDashboard();

  // Render windows assigned to this tab's viewport. The first tab to open on
  // a fresh install claims 'main' (so it gets the 4 default windows); every
  // subsequent tab starts blank with its own viewport id. New chat windows
  // get stamped with the current tab's viewport. Cross-window drag re-stamps
  // the viewport id. Windows without a viewportId are legacy — treat them
  // as 'main' so existing setups don't appear blank after this upgrade.
  const ownedWindows = layout.windows.filter(w => {
    const vp = w.viewportId ?? 'main';
    return vp === viewportId;
  });

  const visibleOwnedWindows = ownedWindows.filter(w => !w.minimized && w.visible);
  const isBlankScreen = visibleOwnedWindows.length === 0 && viewportId !== 'main';

  return (
    <div className="wm-shell">
      <div className="wm-viewport">
        {ownedWindows.map(win => {
          // Live-infer chat window titles from messages so each conversation
          // is named by its topic rather than "Chat A". Keep the root-label +
          // depth prefix so forks stay distinguishable (the existing lineage
          // breadcrumb is rendered separately by Window.tsx).
          let title = win.title;
          if (win.type === 'chat' && win.sessionId) {
            const sc = getSessionChat(win.sessionId);
            const inferred = inferShortChatTitle(sc.messages);
            if (inferred) {
              const depth = win.lineage?.depth ?? 0;
              const root = win.lineage?.rootLabel || '';
              const prefix = depth > 0 ? `L${depth} ${root}` : root;
              title = prefix ? `${prefix} · ${inferred}` : inferred;
            }
          }
          return (
            <Window key={win.id} state={{ ...win, title }}>
              {renderWindowContent(win)}
            </Window>
          );
        })}
        {isBlankScreen && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              pointerEvents: 'none',
              color: 'var(--color-text-muted, #8a8d93)',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 13,
              textAlign: 'center',
              padding: 24,
            }}
          >
            <div style={{ fontSize: 28, opacity: 0.45 }}>↗</div>
            <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.7 }}>
              Empty screen
            </div>
            <div style={{ maxWidth: 460, lineHeight: 1.55, opacity: 0.65 }}>
              This is an extra screen on your workspace. To put a panel here, go
              to your other screen and <strong>drag the ↗ icon</strong> on any
              window's titlebar onto this window.
            </div>
            <div style={{ maxWidth: 460, lineHeight: 1.55, opacity: 0.55, fontSize: 12 }}>
              Or open a new chat — it will live here, not duplicate on the other screen.
              Close this window and the panels you moved here re-appear minimized on the original.
            </div>
          </div>
        )}
      </div>
      <Taskbar />
    </div>
  );
}
