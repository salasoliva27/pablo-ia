import { useEffect, useState } from 'react';
import { WindowShell } from './components/WindowShell';
import { MobileShell } from './components/MobileShell';
import { useIsMobile } from './hooks/useIsMobile';
import { WindowManagerProvider } from './store/window-store';
import { TopBar } from './components/TopBar';
import { CommandPalette } from './components/CommandPalette';
import { PortfolioScoreboard } from './components/PortfolioScoreboard';
import { CrossProjectFlash } from './components/CrossProjectFlash';
import { ThemeEngine, useThemeInit, useActiveTheme } from './components/ThemeEngine';
import { Starfield } from './components/Starfield';
import { Credentials } from './components/Credentials';
import { FirstRunOnboarding } from './components/FirstRunOnboarding';
import { McpConfig } from './components/McpConfig';
import { DashboardProvider, useBridgeHandler, useRegisterWsSend, useConnectionStateSync } from './store';
import { useWebSocket } from './hooks/useWebSocket';
import type { ServerMessage } from './types/bridge';
import { broadcastReload } from './store/window-store';

function ReloadBanner() {
  const [stale, setStale] = useState(false);
  useEffect(() => {
    let initialHash = '';
    const check = async () => {
      try {
        const res = await fetch('/index.html', { cache: 'no-store' });
        const text = await res.text();
        // Extract asset filenames as a fingerprint
        const hash = (text.match(/assets\/index-[^"]+/g) || []).join(',');
        if (!initialHash) { initialHash = hash; return; }
        if (hash && hash !== initialHash) setStale(true);
      } catch { /* ignore */ }
    };
    check();
    const interval = setInterval(check, 8000);
    return () => clearInterval(interval);
  }, []);

  if (!stale) return null;
  return (
    <div
      className="reload-banner"
      onClick={() => {
        broadcastReload();
        window.location.reload();
      }}
    >
      UI updated — click to reload
    </div>
  );
}

function DashboardInner() {
  const { status, lastMessage, send, onMessage } = useWebSocket();
  const handleBridgeMessage = useBridgeHandler();
  const registerWsSend = useRegisterWsSend();
  const { onConnectionLost, onConnectionRestored } = useConnectionStateSync();
  const [themeOpen, setThemeOpen] = useState(false);
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [credentialsInitialProvider, setCredentialsInitialProvider] = useState<string | undefined>(undefined);
  const [mcpOpen, setMcpOpen] = useState(false);

  useThemeInit();
  const activeTheme = useActiveTheme();
  const isSpace = activeTheme?.id === 'space';

  // Route every WebSocket message synchronously into the store.
  // Cannot rely on the `lastMessage` state value here — same-tick bursts
  // collapse into a single render (only the last message survives).
  useEffect(() => {
    onMessage(handleBridgeMessage);
  }, [onMessage, handleBridgeMessage]);

  // Register WebSocket send function with store when connected
  useEffect(() => {
    if (status === 'connected') {
      registerWsSend(send);
    }
  }, [status, send, registerWsSend]);

  // When the bridge drops mid-turn, demote stuck thinking/streaming sessions
  // so the UI stops showing "responding" when nothing is coming back.
  useEffect(() => {
    if (status === 'disconnected') onConnectionLost();
    else if (status === 'connected') onConnectionRestored();
  }, [status, onConnectionLost, onConnectionRestored]);

  // Theme shortcut: Ctrl+T
  // Reload-all shortcut: Ctrl/Cmd+R or F5 — fan out to every other open
  // Janus IA window on this machine before reloading locally. Otherwise only
  // the focused window picks up new code and the others drift.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        setThemeOpen(v => !v);
        return;
      }
      const isReload =
        e.key === 'F5' ||
        ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R'));
      if (isReload) {
        // The browser's native reload starts unloading THIS tab immediately,
        // which racey'd the BroadcastChannel flush (1st reload worked, 2nd
        // didn't). Take over: preventDefault, send the BC message synchronously,
        // then reload ourselves on a short timer so peers definitely receive it
        // before our channel goes down.
        e.preventDefault();
        broadcastReload();
        setTimeout(() => window.location.reload(), 60);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const isMobile = useIsMobile();

  if (isMobile) {
    // Phone layout: no window manager, no TopBar — MobileShell owns the whole
    // viewport with its own header + bottom nav. Overlays (themes, credentials,
    // first-run) still render on top.
    return (
      <div className="shell-outer shell-outer--mobile">
        {isSpace && <Starfield />}
        <MobileShell />
        {themeOpen && <ThemeEngine onClose={() => setThemeOpen(false)} />}
        {credentialsOpen && <Credentials onClose={() => { setCredentialsOpen(false); setCredentialsInitialProvider(undefined); }} initialProviderId={credentialsInitialProvider} />}
        {mcpOpen && <McpConfig onClose={() => setMcpOpen(false)} />}
        <FirstRunOnboarding onOpenCredentials={(tabId) => { setCredentialsInitialProvider(tabId); setCredentialsOpen(true); }} />
        <ReloadBanner />
      </div>
    );
  }

  return (
    <div className="shell-outer">
      {isSpace && <Starfield />}
      <TopBar connectionStatus={status} onThemeToggle={() => setThemeOpen(true)} lastMessage={lastMessage} onCredentials={() => setCredentialsOpen(true)} onMcpConfig={() => setMcpOpen(true)} />
      <div className="shell-panels">
        <WindowManagerProvider>
          <WindowShell />
        </WindowManagerProvider>
      </div>
      <CommandPalette />
      <PortfolioScoreboard />
      <CrossProjectFlash />
      {themeOpen && <ThemeEngine onClose={() => setThemeOpen(false)} />}
      {credentialsOpen && <Credentials onClose={() => { setCredentialsOpen(false); setCredentialsInitialProvider(undefined); }} initialProviderId={credentialsInitialProvider} />}
      {mcpOpen && <McpConfig onClose={() => setMcpOpen(false)} />}
      <FirstRunOnboarding onOpenCredentials={(tabId) => { setCredentialsInitialProvider(tabId); setCredentialsOpen(true); }} />
      <ReloadBanner />
    </div>
  );
}

export default function App() {
  return (
    <DashboardProvider>
      <DashboardInner />
    </DashboardProvider>
  );
}
