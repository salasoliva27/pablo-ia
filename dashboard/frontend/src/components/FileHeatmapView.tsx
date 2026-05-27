import { useEffect, useRef } from 'react';
import { useDashboard, AGENT_REGISTRY } from '../store';
import type { CenterView } from '../types/dashboard';

const STAGE_ORDER = ['idea', 'dev', 'uat', 'prod'] as const;
const STAGE_ICONS: Record<string, string> = { idea: '\u2727', dev: '\u2692', uat: '\u2691', prod: '\u2713' };
const STAGE_LABELS: Record<string, string> = { idea: 'IDEA', dev: 'DEV', uat: 'UAT', prod: 'PROD' };

const EVENT_COLORS: Record<string, string> = {
  edit: '#a78bfa',
  commit: '#34d399',
  dispatch: '#5eead4',
  memory: '#fbbf24',
  tool: '#60a5fa',
  push: '#f87171',
};

const EVENT_ICONS: Record<string, string> = {
  edit: 'E',
  commit: 'C',
  dispatch: 'D',
  memory: 'M',
  tool: 'T',
  push: 'P',
};

function timeAgoShort(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return 'now';
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function SessionTimeline() {
  const { sessionEvents } = useDashboard();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth;
    }
  }, [sessionEvents.length]);

  if (sessionEvents.length === 0) {
    return <div style={{ color: 'var(--color-text-muted)', fontSize: 11, fontFamily: 'var(--font-family-mono)', padding: 8 }}>waiting for session events...</div>;
  }

  return (
    <div ref={containerRef} className="session-timeline">
      {sessionEvents.slice(0, 50).map(ev => {
        const color = EVENT_COLORS[ev.type] || '#888';
        return (
          <div key={ev.id} className="session-timeline__card" style={{ borderLeftColor: color }} title={ev.detail || ev.label}>
            <div className="session-timeline__card-header">
              <span className="session-timeline__card-icon" style={{ background: color }}>{EVENT_ICONS[ev.type] || '?'}</span>
              <span className="session-timeline__card-type">{ev.type}</span>
              <span className="session-timeline__card-time">{timeAgoShort(ev.timestamp)}</span>
            </div>
            <div className="session-timeline__card-label">{ev.label}</div>
            {ev.detail && <div className="session-timeline__card-detail">{ev.detail}</div>}
            {ev.project && <div className="session-timeline__card-project">{ev.project}</div>}
          </div>
        );
      })}
    </div>
  );
}

export function FileHeatmapView() {
  const { projects, agents, agentCounts, centerView, setCenterView } = useDashboard();

  const views: { id: CenterView; label: string }[] = [
    { id: 'constellation', label: 'Projects' },
    { id: 'brain', label: 'Brain' },
    { id: 'procedures', label: 'Procedures' },
    { id: 'files', label: 'Live' },
  ];

  return (
    <div className="project-grid__wrapper">
      <div className="activity-view">
        {/* Project pipeline — horizontal lanes by stage */}
      <div className="activity-view__pipeline">
        {STAGE_ORDER.map(stage => {
          const stageProjects = projects.filter(p => p.stage === stage);
          return (
            <div key={stage} className="activity-view__lane">
              <div className="activity-view__lane-header">
                <span className="activity-view__lane-icon">{STAGE_ICONS[stage]}</span>
                <span className="activity-view__lane-label">{STAGE_LABELS[stage]}</span>
                <span className="activity-view__lane-count">{stageProjects.length}</span>
              </div>
              <div className="activity-view__lane-cards">
                {stageProjects.map(p => (
                  <div key={p.id} className="activity-view__project-card" style={{ '--proj-color': p.color } as React.CSSProperties}>
                    <div className="activity-view__project-header">
                      <span className={`activity-view__health activity-view__health--${p.health}`} />
                      <span className="activity-view__project-name">{p.displayName}</span>
                    </div>
                    <div className="activity-view__project-phase">{p.currentPhase}</div>
                    <div className="activity-view__progress-bar">
                      <div className="activity-view__progress-fill" style={{ width: `${p.phaseProgress * 100}%` }} />
                    </div>
                    <div className="activity-view__project-stack">
                      {p.stack.slice(0, 3).map(s => (
                        <span key={s} className="activity-view__stack-badge">{s}</span>
                      ))}
                      {p.stack.length > 3 && <span className="activity-view__stack-badge">+{p.stack.length - 3}</span>}
                    </div>
                  </div>
                ))}
                {stageProjects.length === 0 && (
                  <div className="activity-view__lane-empty">no projects</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Agent Monitor */}
      <div className="agent-monitor">
        <div className="agent-monitor__title">Agents</div>
        <div className="agent-monitor__list">
          {AGENT_REGISTRY.map(ag => {
            const count = agentCounts[ag.name] || 0;
            const dispatch = agents.find(a => a.agent.toLowerCase() === ag.name.toLowerCase() && a.status !== 'done');
            const isActive = !!dispatch;

            return (
              <div
                key={ag.id}
                className={`agent-monitor__row ${isActive ? 'agent-monitor__row--active' : ''}`}
              >
                <span className={`agent-monitor__icon ${isActive ? 'agent-monitor__icon--pulse' : ''}`}>
                  {ag.icon}
                </span>
                <span className="agent-monitor__name">{ag.name}</span>
                <span className="agent-monitor__role">{ag.role.split(',')[0]}</span>
                {isActive && dispatch && (
                  <span className={`agent-monitor__status agent-monitor__status--${dispatch.status}`}>
                    {dispatch.phase}
                  </span>
                )}
                <span className="agent-monitor__count">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full session timeline — relocated from the bottom Tools window */}
      <div className="activity-view__feed-section">
        <div className="activity-view__section-title">Timeline</div>
        <SessionTimeline />
      </div>

      </div>

      <div className="constellation__view-toggle">
        {views.map(v => (
          <button
            key={v.id}
            className={`constellation__view-btn ${centerView === v.id ? 'constellation__view-btn--active' : ''}`}
            onClick={() => setCenterView(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}
