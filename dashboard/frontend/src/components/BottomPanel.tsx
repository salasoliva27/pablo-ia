import { useState, useRef, useEffect } from 'react';
import { useDashboard } from '../store';
import { CalendarPanel } from './CalendarPanel';
import { SQLConsole } from './SQLConsole';
import { TicketsPanel } from './TicketsPanel';
import { TalendPanel } from './TalendPanel';

type Tab = 'calendar' | 'tickets' | 'talend' | 'terminal' | 'workspace' | 'console';

const TABS: { id: Tab; label: string }[] = [
  { id: 'calendar', label: 'Calendar' },
  { id: 'tickets', label: 'Tickets' },
  { id: 'talend', label: 'Talend' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'workspace', label: 'Workspace' },
  { id: 'console', label: 'Console' },
];

function TerminalPreview() {
  const { terminalLines } = useDashboard();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines.length]);

  return (
    <div className="terminal-preview">
      {terminalLines.map((line, i) => {
        const cls = line.includes('[tool]') ? 'terminal-preview__line--tool'
          : line.includes('[error]') ? 'terminal-preview__line--error'
          : line.includes('[session]') ? 'terminal-preview__line--session'
          : 'terminal-preview__line--info';
        return (
          <div key={i} className={`terminal-preview__line ${cls}`}>{line}</div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}

function getPortUrl(port: number): string {
  // In Codespaces, use the forwarded URL; locally, use localhost
  const hostname = window.location.hostname;
  if (hostname.includes('.app.github.dev')) {
    // Replace the current port segment with the target port
    const base = hostname.replace(/-\d+\.app\.github\.dev$/, '');
    return `https://${base}-${port}.app.github.dev`;
  }
  return `http://localhost:${port}`;
}

interface BrandSibling { port: number; brand: string; self: boolean }

function WorkspacePreview() {
  const { projects } = useDashboard();
  const [ports, setPorts] = useState<number[]>([]);
  const [siblings, setSiblings] = useState<BrandSibling[]>([]);
  const [activePort, setActivePort] = useState<number | null>(null);

  useEffect(() => {
    const refresh = () => {
      fetch('/api/ports')
        .then(r => r.json())
        .then(d => { if (d.ports) setPorts(d.ports); })
        .catch(() => {});
      fetch('/api/brand-siblings')
        .then(r => r.json())
        .then(d => {
          const list: BrandSibling[] = Array.isArray(d?.siblings) ? d.siblings : [];
          setSiblings(list);
          // Auto-select the first non-self sibling if nothing's selected yet —
          // this is what the user wants to see in the workspace tab.
          if (activePort === null) {
            const firstOther = list.find(s => !s.self);
            if (firstOther) setActivePort(firstOther.port);
          }
        })
        .catch(() => {});
    };
    refresh();
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 4, padding: '4px 8px', borderBottom: '1px solid var(--border-color)', flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Brand siblings (other Janus instances on this machine) */}
        {siblings.map(s => (
          <button
            key={`b-${s.port}`}
            onClick={() => setActivePort(s.port)}
            title={s.self ? `${s.brand} (this dashboard) :${s.port}` : `${s.brand} on :${s.port}`}
            style={{
              background: activePort === s.port ? 'var(--color-accent)' : 'var(--color-bg-surface)',
              color: activePort === s.port ? 'var(--color-bg-primary)' : (s.self ? 'var(--color-text-muted)' : 'var(--color-text-primary)'),
              border: '1px solid var(--border-color)',
              borderRadius: 4, padding: '2px 8px', fontSize: 10,
              fontFamily: 'var(--font-family-mono)', cursor: 'pointer',
              opacity: s.self ? 0.55 : 1,
            }}
          >
            {s.brand}{s.self ? ' (self)' : ''} :{s.port}
          </button>
        ))}
        {siblings.length > 0 && ports.length > 0 && (
          <span style={{ width: 1, height: 14, background: 'var(--border-color)', margin: '0 2px' }} />
        )}
        {/* Project dev-server ports */}
        {ports.map(p => (
          <button
            key={`p-${p}`}
            onClick={() => setActivePort(p)}
            title={`Dev server on :${p}`}
            style={{
              background: activePort === p ? 'var(--color-accent)' : 'var(--color-bg-surface)',
              color: activePort === p ? 'var(--color-bg-primary)' : 'var(--color-text-muted)',
              border: '1px solid var(--border-color)',
              borderRadius: 4, padding: '2px 8px', fontSize: 10,
              fontFamily: 'var(--font-family-mono)', cursor: 'pointer',
            }}
          >
            :{p}
          </button>
        ))}
        {siblings.length === 0 && ports.length === 0 && (
          <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-family-mono)', padding: 4 }}>
            scanning ports...
          </span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {projects.filter(p => p.stage !== 'idea').slice(0, 4).map(p => (
            <span
              key={p.id}
              style={{
                fontSize: 9, fontFamily: 'var(--font-family-mono)',
                color: 'var(--color-text-muted)', padding: '2px 6px',
                background: 'var(--color-bg-surface)', borderRadius: 3,
                cursor: 'pointer',
              }}
              title={`Open ${p.name} on GitHub`}
            >
              {p.name}
            </span>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        {activePort ? (
          <iframe
            src={getPortUrl(activePort)}
            style={{ width: '100%', height: '100%', border: 'none', background: 'var(--color-bg-primary)', borderRadius: 4 }}
            title={`Port ${activePort}`}
          />
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100%', color: 'var(--color-text-muted)', fontSize: 12,
            fontFamily: 'var(--font-family-mono)',
          }}>
            no sibling instances or dev servers detected
          </div>
        )}
      </div>
    </div>
  );
}

function ConsoleTab() {
  const [tool, setTool] = useState<'supabase' | 'snowflake'>('supabase');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        display: 'flex', gap: 4, padding: '4px 8px',
        borderBottom: '1px solid var(--border-color)', flexShrink: 0,
      }}>
        {(['supabase', 'snowflake'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTool(t)}
            style={{
              background: tool === t ? 'var(--color-accent)' : 'var(--color-bg-surface)',
              color: tool === t ? 'var(--color-bg-primary)' : 'var(--color-text-muted)',
              border: '1px solid var(--border-color)',
              borderRadius: 4, padding: '2px 10px', fontSize: 10,
              fontFamily: 'var(--font-family-mono)', cursor: 'pointer',
              textTransform: 'lowercase',
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <SQLConsole key={tool} tool={tool} />
      </div>
    </div>
  );
}

export function BottomPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('calendar');
  // Non-janus-ia brands only get the brand-agnostic tabs (calendar / terminal /
  // workspace). Tickets, Talend, Console are wired to the upstream owner's
  // Jira / TMC / Supabase/Snowflake tokens — those leak upstream data into
  // a "blank slate" downstream. The frontend reads /api/workspace once on
  // mount and filters accordingly.
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/workspace')
      .then(r => r.ok ? r.json() : null)
      .then((d: { name?: string } | null) => { if (!cancelled && d?.name) setWorkspaceName(d.name); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  const isUpstream = workspaceName === 'janus-ia' || workspaceName === null;
  const visibleTabs = isUpstream
    ? TABS
    : TABS.filter(t => t.id === 'calendar' || t.id === 'terminal' || t.id === 'workspace');
  useEffect(() => {
    if (!visibleTabs.some(t => t.id === activeTab)) setActiveTab(visibleTabs[0]?.id || 'calendar');
  }, [visibleTabs, activeTab]);

  const content: Record<Tab, React.ReactNode> = {
    calendar: <CalendarPanel />,
    tickets: <TicketsPanel />,
    talend: <TalendPanel />,
    terminal: <TerminalPreview />,
    workspace: <WorkspacePreview />,
    console: <ConsoleTab />,
  };

  return (
    <div className="bottom-panel-switcher">
      <div className="bottom-panel-tabs">
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            className={`bottom-panel-tab ${activeTab === tab.id ? 'bottom-panel-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="bottom-panel-content">
        {content[activeTab]}
      </div>
    </div>
  );
}
