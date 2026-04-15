import { useEffect, useState } from 'react';
import { ShellLayout } from './components/ShellLayout';
import { TopBar } from './components/TopBar';
import { CommandPalette } from './components/CommandPalette';
import { PortfolioScoreboard } from './components/PortfolioScoreboard';
import { CrossProjectFlash } from './components/CrossProjectFlash';
import { ThemeEngine, useThemeInit } from './components/ThemeEngine';
import { DashboardProvider, useBridgeHandler, useRegisterWsSend } from './store';
import { useWebSocket } from './hooks/useWebSocket';
import type { ServerMessage } from './types/bridge';

function DashboardInner() {
  const { status, lastMessage, send } = useWebSocket();
  const handleBridgeMessage = useBridgeHandler();
  const registerWsSend = useRegisterWsSend();
  const [themeOpen, setThemeOpen] = useState(false);

  useThemeInit();

  // Route real WebSocket messages to the store
  useEffect(() => {
    if (lastMessage) {
      handleBridgeMessage(lastMessage as ServerMessage);
    }
  }, [lastMessage, handleBridgeMessage]);

  // Register WebSocket send function with store when connected
  useEffect(() => {
    if (status === 'connected') {
      registerWsSend(send);
    }
  }, [status, send, registerWsSend]);

  // Theme shortcut: Ctrl+T
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        setThemeOpen(v => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="shell-outer">
      <TopBar connectionStatus={status} onThemeToggle={() => setThemeOpen(true)} />
      <div className="shell-panels">
        <ShellLayout />
      </div>
      <CommandPalette />
      <PortfolioScoreboard />
      <CrossProjectFlash />
      {themeOpen && <ThemeEngine onClose={() => setThemeOpen(false)} />}
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
