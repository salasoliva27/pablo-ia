import { useState, useRef, useEffect } from 'react';
import { useDashboard } from '../store';

type Tab = 'timeline' | 'capacity' | 'learnings' | 'files' | 'terminal' | 'workspace';

const TABS: { id: Tab; label: string }[] = [
  { id: 'timeline', label: 'Timeline' },
  { id: 'capacity', label: 'Capacity' },
  { id: 'learnings', label: 'Learnings' },
  { id: 'files', label: 'Files' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'workspace', label: 'Workspace' },
];

const EVENT_COLORS: Record<string, string> = {
  edit: '#a78bfa',
  commit: '#34d399',
  dispatch: '#5eead4',
  memory: '#fbbf24',
  tool: '#60a5fa',
  push: '#f87171',
};

function SessionTimeline() {
  const { sessionEvents } = useDashboard();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = 0;
    }
  }, [sessionEvents.length]);

  if (sessionEvents.length === 0) {
    return <div style={{ color: 'var(--color-text-muted)', fontSize: 11, fontFamily: 'var(--font-family-mono)', padding: 8 }}>waiting for session events...</div>;
  }

  return (
    <div ref={containerRef} className="session-timeline">
      {sessionEvents.slice(0, 40).map((ev, i) => {
        const color = EVENT_COLORS[ev.type] || '#888';
        return (
          <div key={ev.id} style={{ display: 'contents' }}>
            {i > 0 && <div className="session-timeline__line" />}
            <div className="session-timeline__event" title={`${ev.type}: ${ev.label}`}>
              <div
                className="session-timeline__dot"
                style={{ background: color, boxShadow: `0 0 6px ${color}60` }}
              />
              <div className="session-timeline__label">{ev.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CapacityHeatmap() {
  const { calendarSlots } = useDashboard();
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="capacity-heatmap">
      {days.map(d => (
        <div key={d} className="capacity-heatmap__day-header">{d}</div>
      ))}
      {calendarSlots.map(slot => {
        const hue = 120 - slot.load * 120; // green->red
        const bg = `hsla(${hue}, 70%, 40%, ${0.2 + slot.load * 0.5})`;
        return (
          <div
            key={slot.date}
            className="capacity-heatmap__cell"
            style={{ background: bg }}
            title={`${slot.date}: ${Math.round(slot.load * 100)}% loaded\n${slot.items.join(', ')}`}
          >
            <div className="capacity-heatmap__cell-date">{slot.date.slice(-2)}</div>
          </div>
        );
      })}
    </div>
  );
}

function LearningFeed() {
  const { learnings } = useDashboard();

  return (
    <div className="learning-feed">
      {learnings.map(l => (
        <div key={l.id} className={`learning-feed__item learning-feed__item--${l.domain}`}>
          <div className="learning-feed__domain">{l.domain}</div>
          <div>{l.content}</div>
          <div className="learning-feed__project">{l.project}</div>
        </div>
      ))}
    </div>
  );
}

function FileHeatmap() {
  const { fileActivities } = useDashboard();
  const maxChanges = Math.max(...fileActivities.map(f => f.changes), 1);

  return (
    <div className="file-heatmap">
      {fileActivities.map((f, i) => {
        const intensity = f.changes / maxChanges;
        const width = Math.max(30, f.size / 5);
        const age = (Date.now() - f.lastModified) / 604800000;
        const heat = Math.max(0.15, 1 - age);

        return (
          <div
            key={i}
            className="file-heatmap__cell"
            style={{
              width,
              height: Math.max(20, 16 + intensity * 24),
              background: f.repoColor.replace(')', ` / ${0.15 + heat * 0.4})`).replace('oklch', 'oklch'),
              backgroundColor: `rgba(255,255,255,${0.03 + intensity * 0.12})`,
            }}
            title={`${f.repo}/${f.path}\n${f.changes} changes`}
          >
            <span className="file-heatmap__cell-label">{f.path.split('/').pop()}</span>
          </div>
        );
      })}
    </div>
  );
}

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

function WorkspacePreview() {
  const { projects } = useDashboard();
  const [ports, setPorts] = useState<number[]>([]);
  const [activePort, setActivePort] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/ports')
      .then(r => r.json())
      .then(d => {
        if (d.ports?.length > 0) {
          setPorts(d.ports);
          if (!activePort) setActivePort(d.ports[0]);
        }
      })
      .catch(() => {});

    const interval = setInterval(() => {
      fetch('/api/ports')
        .then(r => r.json())
        .then(d => { if (d.ports) setPorts(d.ports); })
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 4, padding: '4px 8px', borderBottom: '1px solid var(--border-color)', flexShrink: 0, flexWrap: 'wrap' }}>
        {ports.map(p => (
          <button
            key={p}
            onClick={() => setActivePort(p)}
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
        {ports.length === 0 && (
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
            src={`http://localhost:${activePort}`}
            style={{ width: '100%', height: '100%', border: 'none', background: 'white', borderRadius: 4 }}
            title={`Port ${activePort}`}
          />
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100%', color: 'var(--color-text-muted)', fontSize: 12,
            fontFamily: 'var(--font-family-mono)',
          }}>
            no dev servers detected
          </div>
        )}
      </div>
    </div>
  );
}

export function BottomPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('timeline');

  const content: Record<Tab, React.ReactNode> = {
    timeline: <SessionTimeline />,
    capacity: <CapacityHeatmap />,
    learnings: <LearningFeed />,
    files: <FileHeatmap />,
    terminal: <TerminalPreview />,
    workspace: <WorkspacePreview />,
  };

  return (
    <div className="bottom-panel-switcher">
      <div className="bottom-panel-tabs">
        {TABS.map(tab => (
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
