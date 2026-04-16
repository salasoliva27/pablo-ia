import { useState, useMemo, useCallback } from 'react';
import './CalendarPanel.css';

// ── Types ──

interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO datetime
  end: string;
  allDay: boolean;
  project?: string;
  color: string;
}

type ViewMode = 'week' | 'month';

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const PROJECT_COLORS: Record<string, string> = {
  'espacio-bosques': '#5fd4d4',
  'lool-ai': '#a77bdb',
  'nutria': '#5fd47a',
  'longevite': '#d4a55f',
  'freelance': '#60a5fa',
  'mercado-bot': '#f4511e',
  'jp-ai': '#f6bf26',
  'janus-ia': '#7986cb',
  default: '#888',
};

// ── Real project events for April–May 2026 ──
// Based on PROJECTS.md next actions and current sprint work

function generateProjectEvents(): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  let id = 0;

  const add = (
    title: string,
    date: string,
    startH: number,
    endH: number,
    project: string,
    allDay = false,
  ) => {
    events.push({
      id: `ev-${id++}`,
      title,
      start: allDay ? date : `${date}T${String(startH).padStart(2, '0')}:00:00`,
      end: allDay ? date : `${date}T${String(endH).padStart(2, '0')}:00:00`,
      allDay,
      project,
      color: PROJECT_COLORS[project] || PROJECT_COLORS.default,
    });
  };

  // ── Week of Apr 13–19 (current week, today is Apr 16) ──
  add('Dashboard asset fix + localStorage guard', '2026-04-13', 15, 18, 'janus-ia');
  add('Memory MCP fix + npm install', '2026-04-14', 15, 17, 'janus-ia');
  add('Vault MCP path fix', '2026-04-14', 17, 18, 'janus-ia');
  add('JP-AI dashboard ship', '2026-04-15', 15, 20, 'jp-ai');
  add('Tools registry health check', '2026-04-15', 20, 21, 'janus-ia');
  add('Calendar panel build', '2026-04-16', 15, 18, 'janus-ia');
  add('Window resize + edge snapping', '2026-04-16', 18, 20, 'janus-ia');
  add('Espacio Bosques demo prep', '2026-04-17', 15, 18, 'espacio-bosques');
  add('Seed 5+ investors for vote threshold', '2026-04-17', 18, 20, 'espacio-bosques');
  add('Lool-AI attribution tracking', '2026-04-18', 15, 18, 'lool-ai');
  add('Weekend: flexible', '2026-04-19', 10, 14, 'freelance');

  // ── Week of Apr 20–26 ──
  add('Espacio Bosques first demo', '2026-04-20', 11, 14, 'espacio-bosques');
  add('Lool-AI embeddable widget', '2026-04-21', 15, 19, 'lool-ai');
  add('Lool-AI widget cont.', '2026-04-22', 15, 18, 'lool-ai');
  add('NutrIA Supabase schema', '2026-04-22', 18, 20, 'nutria');
  add('NutrIA Netlify deploy', '2026-04-23', 15, 17, 'nutria');
  add('NutrIA widget embed on Longevite', '2026-04-23', 17, 19, 'nutria');
  add('Longevite Netlify deploy', '2026-04-24', 15, 16, 'longevite');
  add('Longevite contact form + GA', '2026-04-24', 16, 18, 'longevite');
  add('Mercado Bot Python backend scaffold', '2026-04-25', 15, 19, 'mercado-bot');

  // ── Week of Apr 27 – May 3 ──
  add('JP-AI wire memory MCP', '2026-04-27', 15, 17, 'jp-ai');
  add('JP-AI Supabase ozum_memories table', '2026-04-27', 17, 19, 'jp-ai');
  add('JP-AI CRM Phase 1 — lead intake', '2026-04-28', 15, 20, 'jp-ai');
  add('JP-AI CRM Phase 1 cont.', '2026-04-29', 15, 20, 'jp-ai');
  add('JP-AI AI proposal generator', '2026-04-30', 15, 20, 'jp-ai');
  add('Freelance — first lead push', '2026-05-01', 15, 18, 'freelance');
  add('Mercado Bot Python agents', '2026-05-02', 15, 19, 'mercado-bot');
  add('Portfolio review + backlog check', '2026-05-03', 11, 14, 'janus-ia');

  // ── Week of May 4–10 ──
  add('Lool-AI first store pilot prep', '2026-05-04', 15, 18, 'lool-ai');
  add('Lool-AI store visit Roma/Condesa', '2026-05-05', 10, 14, 'lool-ai');
  add('Espacio Bosques Supabase persistent schema', '2026-05-06', 15, 19, 'espacio-bosques');
  add('JP-AI CRM Phase 2 — vendor DB', '2026-05-07', 15, 20, 'jp-ai');
  add('Mercado Bot SCAN+RESEARCH pipeline', '2026-05-08', 15, 19, 'mercado-bot');
  add('NutrIA Phase 1 internal test', '2026-05-09', 15, 18, 'nutria');

  return events;
}

// ── Helper functions ──

function getWeekDates(date: Date): Date[] {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(d);
    day.setDate(d.getDate() + i);
    return day;
  });
}

function getMonthDates(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const start = new Date(firstDay);
  start.setDate(start.getDate() - start.getDay());

  const end = new Date(lastDay);
  end.setDate(end.getDate() + (6 - end.getDay()));

  const dates: Date[] = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m} ${ampm}`;
}

// ── Availability indicator ──

function AvailabilityBar({ date }: { date: Date }) {
  const hour = 15; // 3 PM CDMX - Jano's start time
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const isToday = isSameDay(date, new Date());

  return (
    <div
      className={`cal-avail ${isToday ? 'cal-avail--today' : ''}`}
      title={isWeekend ? 'Weekend - flexible' : `Available from ${hour}:00 CDMX`}
    >
      <div className="cal-avail__bar" style={{
        background: isWeekend
          ? 'linear-gradient(90deg, rgba(95,212,122,0.15), rgba(95,212,122,0.05))'
          : 'linear-gradient(90deg, rgba(95,212,212,0.2), rgba(95,212,212,0.05))',
        width: isWeekend ? '100%' : '56%',
        marginLeft: isWeekend ? '0' : '50%',
      }} />
    </div>
  );
}

// ── Week View ──

function WeekView({ currentDate, events }: { currentDate: Date; events: CalendarEvent[] }) {
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const today = new Date();

  const getEventsForDay = useCallback((date: Date) => {
    return events.filter(e => {
      const eDate = new Date(e.start);
      return isSameDay(eDate, date);
    });
  }, [events]);

  return (
    <div className="cal-week">
      {/* Day headers */}
      <div className="cal-week__header">
        <div className="cal-week__gutter" />
        {weekDates.map(d => {
          const isToday = isSameDay(d, today);
          return (
            <div key={d.toISOString()} className={`cal-week__day-header ${isToday ? 'cal-week__day-header--today' : ''}`}>
              <span className="cal-week__day-name">{DAYS_SHORT[d.getDay()]}</span>
              <span className={`cal-week__day-num ${isToday ? 'cal-week__day-num--today' : ''}`}>{d.getDate()}</span>
            </div>
          );
        })}
      </div>

      {/* Availability row */}
      <div className="cal-week__avail-row">
        <div className="cal-week__gutter cal-week__gutter--label">avail</div>
        {weekDates.map(d => (
          <div key={`avail-${d.toISOString()}`} className="cal-week__avail-cell">
            <AvailabilityBar date={d} />
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="cal-week__body">
        <div className="cal-week__gutter">
          {HOURS.map(h => (
            <div key={h} className="cal-week__time-label">
              {h % 12 || 12}{h >= 12 ? 'p' : 'a'}
            </div>
          ))}
        </div>
        {weekDates.map(d => {
          const dayEvents = getEventsForDay(d);
          const isToday = isSameDay(d, today);
          return (
            <div key={d.toISOString()} className={`cal-week__column ${isToday ? 'cal-week__column--today' : ''}`}>
              {HOURS.map(h => (
                <div key={h} className="cal-week__cell">
                  {h === 15 && <div className="cal-week__available-line" title="3 PM - Available" />}
                </div>
              ))}
              {dayEvents.map(ev => {
                const startH = new Date(ev.start).getHours() + new Date(ev.start).getMinutes() / 60;
                const endH = new Date(ev.end).getHours() + new Date(ev.end).getMinutes() / 60;
                const top = ((startH - 6) / HOURS.length) * 100;
                const height = Math.max(((endH - startH) / HOURS.length) * 100, 3);
                return (
                  <div
                    key={ev.id}
                    className="cal-week__event"
                    style={{
                      top: `${top}%`,
                      height: `${height}%`,
                      borderLeftColor: ev.color,
                      background: `linear-gradient(90deg, ${ev.color}18, transparent)`,
                    }}
                    title={`${ev.title}\n${formatTime(ev.start)} - ${formatTime(ev.end)}`}
                  >
                    <span className="cal-week__event-time">{formatTime(ev.start)}</span>
                    <span className="cal-week__event-title">{ev.title}</span>
                  </div>
                );
              })}
              {/* Current time indicator */}
              {isToday && (() => {
                const now = new Date();
                const currentH = now.getHours() + now.getMinutes() / 60;
                if (currentH < 6 || currentH > 23) return null;
                const top = ((currentH - 6) / HOURS.length) * 100;
                return <div className="cal-week__now-line" style={{ top: `${top}%` }} />;
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Month View ──

function MonthView({ currentDate, events }: { currentDate: Date; events: CalendarEvent[] }) {
  const monthDates = useMemo(() => getMonthDates(currentDate), [currentDate]);
  const today = new Date();
  const currentMonth = currentDate.getMonth();

  const getEventsForDay = useCallback((date: Date) => {
    return events.filter(e => {
      const eDate = new Date(e.start);
      return isSameDay(eDate, date);
    });
  }, [events]);

  return (
    <div className="cal-month">
      <div className="cal-month__header">
        {DAYS_SHORT.map(d => (
          <div key={d} className="cal-month__day-header">{d}</div>
        ))}
      </div>
      <div className="cal-month__grid">
        {monthDates.map(d => {
          const isToday = isSameDay(d, today);
          const isCurrentMonth = d.getMonth() === currentMonth;
          const dayEvents = getEventsForDay(d);

          return (
            <div
              key={d.toISOString()}
              className={`cal-month__cell ${isToday ? 'cal-month__cell--today' : ''} ${!isCurrentMonth ? 'cal-month__cell--other' : ''}`}
            >
              <span className={`cal-month__date ${isToday ? 'cal-month__date--today' : ''}`}>
                {d.getDate()}
              </span>
              <div className="cal-month__events">
                {dayEvents.slice(0, 3).map(ev => (
                  <div
                    key={ev.id}
                    className="cal-month__event"
                    style={{ borderLeftColor: ev.color, background: `${ev.color}12` }}
                    title={`${ev.title}\n${formatTime(ev.start)}`}
                  >
                    {ev.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="cal-month__more">+{dayEvents.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Calendar Panel ──

export function CalendarPanel() {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const events = useMemo(() => generateProjectEvents(), []);

  const navigate = useCallback((dir: -1 | 1) => {
    setCurrentDate(d => {
      const next = new Date(d);
      if (viewMode === 'week') next.setDate(next.getDate() + dir * 7);
      else next.setMonth(next.getMonth() + dir);
      return next;
    });
  }, [viewMode]);

  const goToday = useCallback(() => setCurrentDate(new Date()), []);

  const headerLabel = viewMode === 'week'
    ? (() => {
        const week = getWeekDates(currentDate);
        const first = week[0];
        const last = week[6];
        if (first.getMonth() === last.getMonth()) {
          return `${MONTHS[first.getMonth()]} ${first.getDate()}-${last.getDate()}, ${first.getFullYear()}`;
        }
        return `${MONTHS[first.getMonth()].slice(0, 3)} ${first.getDate()} - ${MONTHS[last.getMonth()].slice(0, 3)} ${last.getDate()}, ${last.getFullYear()}`;
      })()
    : `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  // Count events for current view
  const eventCount = useMemo(() => {
    if (viewMode === 'week') {
      const week = getWeekDates(currentDate);
      return events.filter(e => {
        const d = new Date(e.start);
        return d >= week[0] && d <= week[6];
      }).length;
    }
    return events.length;
  }, [currentDate, events, viewMode]);

  return (
    <div className="cal-container">
      {/* Toolbar */}
      <div className="cal-toolbar">
        <div className="cal-toolbar__left">
          <button className="cal-toolbar__btn" onClick={goToday}>Today</button>
          <button className="cal-toolbar__nav" onClick={() => navigate(-1)}>&lt;</button>
          <button className="cal-toolbar__nav" onClick={() => navigate(1)}>&gt;</button>
          <span className="cal-toolbar__label">{headerLabel}</span>
        </div>
        <div className="cal-toolbar__right">
          <span className="cal-toolbar__status">{eventCount} events</span>
          <div className="cal-toolbar__views">
            <button
              className={`cal-toolbar__view ${viewMode === 'week' ? 'cal-toolbar__view--active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
            <button
              className={`cal-toolbar__view ${viewMode === 'month' ? 'cal-toolbar__view--active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      {/* Calendar body */}
      <div className="cal-body">
        {viewMode === 'week'
          ? <WeekView currentDate={currentDate} events={events} />
          : <MonthView currentDate={currentDate} events={events} />
        }
      </div>

      {/* Legend */}
      <div className="cal-legend">
        {Object.entries(PROJECT_COLORS).filter(([k]) => k !== 'default').map(([name, color]) => (
          <div key={name} className="cal-legend__item">
            <div className="cal-legend__dot" style={{ background: color }} />
            <span className="cal-legend__label">{name}</span>
          </div>
        ))}
        <div className="cal-legend__item">
          <div className="cal-legend__dot cal-legend__dot--avail" />
          <span className="cal-legend__label">available (post 3 PM)</span>
        </div>
      </div>
    </div>
  );
}
