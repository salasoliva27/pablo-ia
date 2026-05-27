import { useWindowManager } from '../store/window-store';
import { useDashboard } from '../store';
import { VersionBadge } from './VersionBadge';

const TYPE_ICONS: Record<string, string> = {
  chat: '>',
  center: '*',
  bottom: '~',
  right: '=',
  calendar: '#',
  'sql-console': '$',
  'chat-history': 'H',
};

export function Taskbar() {
  const { layout, dispatch, viewportId } = useWindowManager();
  const { newChat } = useDashboard();
  const taskbarBrand = 'JANUS';

  // Only windows assigned to THIS browser-window's viewport appear in its
  // taskbar. Cross-screen pop-outs manage their own minimized panels — and
  // panels that were re-stamped back to 'main' on pop-out close re-appear in
  // the main window's taskbar (minimized) so the user can restore them.
  const mine = layout.windows.filter(w => (w.viewportId ?? 'main') === viewportId);
  const open = mine.filter(w => w.visible && !w.minimized);
  const minimized = mine.filter(w => w.visible && w.minimized);
  const closed = mine.filter(w => !w.visible);

  return (
    <div className="wm-taskbar">
      <div className="wm-taskbar__windows">
        {open.map(w => (
          <button
            key={w.id}
            className="wm-taskbar__item wm-taskbar__item--active"
            onClick={() => dispatch({ type: 'FOCUS', id: w.id })}
            title={`Focus ${w.title}`}
          >
            <span className="wm-taskbar__icon">{TYPE_ICONS[w.type] || '?'}</span>
            <span className="wm-taskbar__label">{w.title}</span>
            {w.lineage && w.lineage.depth > 0 && (
              <span className="wm-taskbar__depth" style={{ background: w.lineage.color }}>
                L{w.lineage.depth}
              </span>
            )}
            {w.closable && (
              <span
                className="wm-taskbar__x"
                role="button"
                title={`Close ${w.title}`}
                onClick={(e) => { e.stopPropagation(); dispatch({ type: 'CLOSE', id: w.id }); }}
              >
                &times;
              </span>
            )}
          </button>
        ))}

        {minimized.length > 0 && <span className="wm-taskbar__separator" />}
        {minimized.map(w => (
          <button
            key={w.id}
            className="wm-taskbar__item wm-taskbar__item--minimized"
            onClick={() => dispatch({ type: 'RESTORE', id: w.id })}
            title={`Restore ${w.title}`}
          >
            <span className="wm-taskbar__restore-icon">+</span>
            <span className="wm-taskbar__label">{w.title}</span>
          </button>
        ))}

        {closed.length > 0 && <span className="wm-taskbar__separator" />}
        {closed.map(w => (
          <button
            key={w.id}
            className="wm-taskbar__item wm-taskbar__item--closed"
            onClick={() => dispatch({ type: 'RESTORE', id: w.id })}
            title={`Click to reopen ${w.title}`}
          >
            <span className="wm-taskbar__reopen-icon">+</span>
            <span className="wm-taskbar__icon">{TYPE_ICONS[w.type] || '?'}</span>
            <span className="wm-taskbar__label">{w.title}</span>
          </button>
        ))}
        <button
          className="wm-taskbar__new-chat"
          onClick={() => newChat()}
          title="Start a new independent conversation"
        >
          + new chat
        </button>
      </div>
      <div className="wm-taskbar__janus-wordmark" aria-label={taskbarBrand}>
        <span className="janus-wordmark__text">{taskbarBrand}</span>
      </div>
      <div className="wm-taskbar__actions">
        <button
          className="wm-taskbar__history wm-taskbar__history--icon"
          onClick={() => window.dispatchEvent(new CustomEvent('venture-os:open-chat-history'))}
          title="Open searchable chat history"
          aria-label="Chat history"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
        </button>
        <VersionBadge />
        <button
          className="wm-taskbar__reset"
          onClick={() => dispatch({ type: 'RESET' })}
          title="Reset layout"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
