import { useCallback, useRef, type DragEvent as ReactDragEvent, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react';
import { useWindowManager } from '../store/window-store';
import type { WindowState } from '../types/window';
import { findSnapEdges, snapValue, findSharedEdgeWindows, JANUS_WINDOW_DRAG_MIME } from '../types/window';

interface WindowProps {
  state: WindowState;
  children: ReactNode;
}

type ResizeDir = 'e' | 'w' | 'n' | 's' | 'ne' | 'nw' | 'se' | 'sw';

const TOPBAR_H = 40;
const TASKBAR_H = 34;

export function Window({ state, children }: WindowProps) {
  const { layout, dispatch } = useWindowManager();
  const rafRef = useRef(0);

  const onFocus = useCallback(() => {
    dispatch({ type: 'FOCUS', id: state.id });
  }, [dispatch, state.id]);

  // ── Free drag with magnetic snap to viewport edges + other windows ──
  const onDragStart = useCallback((e: ReactPointerEvent) => {
    if ((e.target as HTMLElement).closest('.wm-window__controls')) return;
    e.preventDefault();
    e.stopPropagation();
    dispatch({ type: 'FOCUS', id: state.id });

    const startX = e.clientX;
    const startY = e.clientY;
    const origX = state.x;
    const origY = state.y;
    const winW = state.width;
    const winH = state.height;

    const snapH = { left: false, right: false };
    const snapV = { top: false, bottom: false };

    // Snap only against windows on this viewport — different browser windows
    // shouldn't tug at each other through cross-viewport coordinates.
    const myViewport = state.viewportId ?? 'main';
    const sameViewportWindows = layout.windows.filter(w => (w.viewportId ?? 'main') === myViewport);

    const onMove = (me: globalThis.PointerEvent) => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        let newX = origX + (me.clientX - startX);
        let newY = origY + (me.clientY - startY);

        const vpW = window.innerWidth;
        const vpH = window.innerHeight - TOPBAR_H - TASKBAR_H;

        // Collect snap targets: viewport edges + other window edges (same screen only)
        const edges = findSnapEdges(sameViewportWindows, state.id);
        const hTargets = [0, vpW, ...edges.lefts, ...edges.rights];
        const vTargets = [0, vpH, ...edges.tops, ...edges.bottoms];

        // Snap left edge
        const leftSnap = snapValue(newX, hTargets, snapH.left);
        if (leftSnap.isSnapped) { newX = leftSnap.snapped; }
        snapH.left = leftSnap.isSnapped;

        // Snap right edge
        const rightSnap = snapValue(newX + winW, hTargets, snapH.right);
        if (rightSnap.isSnapped && !leftSnap.isSnapped) { newX = rightSnap.snapped - winW; }
        snapH.right = rightSnap.isSnapped;

        // Snap top edge
        const topSnap = snapValue(newY, vTargets, snapV.top);
        if (topSnap.isSnapped) { newY = topSnap.snapped; }
        snapV.top = topSnap.isSnapped;

        // Snap bottom edge
        const bottomSnap = snapValue(newY + winH, vTargets, snapV.bottom);
        if (bottomSnap.isSnapped && !topSnap.isSnapped) { newY = bottomSnap.snapped - winH; }
        snapV.bottom = bottomSnap.isSnapped;

        dispatch({ type: 'MOVE', id: state.id, x: newX, y: newY });
      });
    };

    const onUp = () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }, [dispatch, state.id, state.x, state.y, state.width, state.height, layout.windows]);

  // ── Resize with magnetic snap + shared-border resizing ──
  const onResizeStart = useCallback((dir: ResizeDir) => (e: ReactPointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch({ type: 'FOCUS', id: state.id });

    const startX = e.clientX;
    const startY = e.clientY;
    const orig = { x: state.x, y: state.y, w: state.width, h: state.height };

    // Only consider windows on the same viewport when computing shared-edge
    // neighbors. Without this filter, resizing a window in one browser-window
    // would drag along a window in another browser-window if their global
    // coordinates happened to share an edge value — that bug surfaced after
    // adding viewports (Context in popout was still snapping to System in
    // main because both had matching x/y math).
    const myViewport = state.viewportId ?? 'main';
    const sameViewport = layout.windows.filter(w => (w.viewportId ?? 'main') === myViewport);

    // Capture neighbors sharing each edge at drag start (frozen snapshot)
    const neighborsE = dir.includes('e')
      ? findSharedEdgeWindows(sameViewport, state.id, 'left', state.x + state.width)
          .map(w => ({ id: w.id, x: w.x, y: w.y, w: w.width, h: w.height }))
      : [];
    const neighborsW = dir.includes('w')
      ? findSharedEdgeWindows(sameViewport, state.id, 'right', state.x)
          .map(w => ({ id: w.id, x: w.x, y: w.y, w: w.width, h: w.height }))
      : [];
    const neighborsS = dir.includes('s')
      ? findSharedEdgeWindows(sameViewport, state.id, 'top', state.y + state.height)
          .map(w => ({ id: w.id, x: w.x, y: w.y, w: w.width, h: w.height }))
      : [];
    const neighborsN = dir.includes('n')
      ? findSharedEdgeWindows(sameViewport, state.id, 'bottom', state.y)
          .map(w => ({ id: w.id, x: w.x, y: w.y, w: w.width, h: w.height }))
      : [];

    const hasNeighbors = neighborsE.length + neighborsW.length + neighborsS.length + neighborsN.length > 0;

    const snap = { left: false, right: false, top: false, bottom: false };

    const onMove = (me: globalThis.PointerEvent) => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const dx = me.clientX - startX;
        const dy = me.clientY - startY;

        let newX = orig.x, newY = orig.y, newW = orig.w, newH = orig.h;

        if (dir.includes('e')) newW = orig.w + dx;
        if (dir.includes('w')) { newW = orig.w - dx; newX = orig.x + dx; }
        if (dir.includes('s')) newH = orig.h + dy;
        if (dir.includes('n')) { newH = orig.h - dy; newY = orig.y + dy; }

        // Clamp min
        if (newW < state.minWidth) { newW = state.minWidth; if (dir.includes('w')) newX = orig.x + orig.w - state.minWidth; }
        if (newH < state.minHeight) { newH = state.minHeight; if (dir.includes('n')) newY = orig.y + orig.h - state.minHeight; }

        // Snap targets: other windows + viewport (skip snapping when dragging shared borders)
        if (!hasNeighbors) {
          const vpW = window.innerWidth;
          const vpH = window.innerHeight - TOPBAR_H - TASKBAR_H;
          // Same-viewport snap only — see comment at top of onResizeStart.
          const edges = findSnapEdges(sameViewport, state.id);
          const hTargets = [0, vpW, ...edges.lefts, ...edges.rights];
          const vTargets = [0, vpH, ...edges.tops, ...edges.bottoms];

          if (dir.includes('e')) {
            const res = snapValue(newX + newW, hTargets, snap.right);
            if (res.isSnapped) newW = res.snapped - newX;
            snap.right = res.isSnapped;
          }
          if (dir.includes('w')) {
            const res = snapValue(newX, hTargets, snap.left);
            if (res.isSnapped) { newW = newW + (newX - res.snapped); newX = res.snapped; }
            snap.left = res.isSnapped;
          }
          if (dir.includes('s')) {
            const res = snapValue(newY + newH, vTargets, snap.bottom);
            if (res.isSnapped) newH = res.snapped - newY;
            snap.bottom = res.isSnapped;
          }
          if (dir.includes('n')) {
            const res = snapValue(newY, vTargets, snap.top);
            if (res.isSnapped) { newH = newH + (newY - res.snapped); newY = res.snapped; }
            snap.top = res.isSnapped;
          }
        }

        if (!hasNeighbors) {
          dispatch({ type: 'RESIZE', id: state.id, x: newX, y: newY, width: newW, height: newH });
        } else {
          // Batch: resize this window + all neighbors sharing the dragged edge
          const updates: Array<{ id: string; x: number; y: number; width: number; height: number }> = [
            { id: state.id, x: newX, y: newY, width: newW, height: newH },
          ];

          // East edge neighbors: their left edge moves with our right edge
          for (const n of neighborsE) {
            const newNX = n.x + dx;
            const newNW = n.w - dx;
            if (newNW >= 200) updates.push({ id: n.id, x: newNX, y: n.y, width: newNW, height: n.h });
          }
          // West edge neighbors: their right edge moves with our left edge
          for (const n of neighborsW) {
            const newNW = n.w + dx;
            if (newNW >= 200) updates.push({ id: n.id, x: n.x, y: n.y, width: newNW, height: n.h });
          }
          // South edge neighbors: their top edge moves with our bottom edge
          for (const n of neighborsS) {
            const newNY = n.y + dy;
            const newNH = n.h - dy;
            if (newNH >= 100) updates.push({ id: n.id, x: n.x, y: newNY, width: n.w, height: newNH });
          }
          // North edge neighbors: their bottom edge moves with our top edge
          for (const n of neighborsN) {
            const newNH = n.h + dy;
            if (newNH >= 100) updates.push({ id: n.id, x: n.x, y: n.y, width: n.w, height: newNH });
          }

          dispatch({ type: 'RESIZE_BATCH', updates });
        }
      });
    };

    const onUp = () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }, [dispatch, state, layout.windows]);

  // Cross-window drag handle: starts a native HTML5 drag carrying just the
  // window id. Same-origin browser windows that listen for the matching MIME
  // (see WindowShell.tsx) claim the window when the user releases over them.
  // We build an explicit drag image (a real chip showing the window title)
  // so the user can see what they're dragging — the default drag image is a
  // screenshot of the tiny 9px arrow button, which looked like nothing was
  // happening.
  const onSendDragStart = useCallback((e: ReactDragEvent) => {
    e.stopPropagation();
    if (!e.dataTransfer) return;
    e.dataTransfer.setData(JANUS_WINDOW_DRAG_MIME, state.id);
    e.dataTransfer.setData('text/plain', state.title);
    e.dataTransfer.effectAllowed = 'move';
    try {
      const ghost = document.createElement('div');
      ghost.textContent = `↗ ${state.title}`;
      ghost.style.cssText = [
        'position: absolute',
        'top: -1000px',
        'left: -1000px',
        'padding: 8px 14px',
        'background: #1a1c20',
        'color: #e6e8eb',
        'border: 1px solid #7aa2f7',
        'border-radius: 6px',
        'font-family: ui-monospace, SFMono-Regular, Menlo, monospace',
        'font-size: 12px',
        'font-weight: 600',
        'pointer-events: none',
        'box-shadow: 0 8px 20px rgba(0,0,0,0.45)',
        'white-space: nowrap',
      ].join(';');
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 16, 16);
      // Tear the ghost back down once the browser has snapshotted it.
      setTimeout(() => { try { document.body.removeChild(ghost); } catch { /* already gone */ } }, 0);
    } catch { /* setDragImage unsupported — fall back to default */ }
  }, [state.id, state.title]);

  if (state.minimized || !state.visible) return null;

  const lineageLabel = state.lineage && state.lineage.depth > 0
    ? `L${state.lineage.depth} · ${state.lineage.breadcrumb.join(' > ')}`
    : null;

  return (
    <div
      className={`wm-window ${state.maximized ? 'wm-window--maximized' : ''}`}
      style={{
        left: state.x,
        top: state.y,
        width: state.width,
        height: state.height,
        zIndex: state.zIndex,
      }}
      onPointerDown={onFocus}
    >
      {/* Title bar */}
      <div className="wm-window__titlebar" onPointerDown={onDragStart} onDoubleClick={() => dispatch({ type: 'MAXIMIZE', id: state.id })}>
        {lineageLabel && (
          <span className="wm-window__lineage" style={{ color: state.lineage?.color }}>
            {lineageLabel}
          </span>
        )}
        <span className="wm-window__title">{state.title}</span>
        <div className="wm-window__controls">
          <button
            type="button"
            className="wm-window__btn wm-window__btn--send"
            draggable
            onDragStart={onSendDragStart}
            onDragEnd={(e) => {
              // If the drop landed somewhere (dropEffect !== 'none'), the
              // receiving browser-window has dispatched TRANSFER and
              // broadcasted. Re-broadcast our own current layout so peers
              // are guaranteed to converge — without this, a flaky BC delivery
              // would leave the source window thinking the panel is still in
              // its viewport.
              if (e.dataTransfer && e.dataTransfer.dropEffect === 'move') {
                window.dispatchEvent(new CustomEvent('venture-os:window-transferred-out', {
                  detail: { id: state.id },
                }));
              }
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            title="Drag to another screen / browser window to send this panel there"
            aria-label="Send to another screen"
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 17 17 7" />
              <path d="M8 7h9v9" />
            </svg>
          </button>
          <button
            className="wm-window__btn wm-window__btn--min"
            onClick={(e) => { e.stopPropagation(); dispatch({ type: 'MINIMIZE', id: state.id }); }}
            title="Minimize"
          />
          <button
            className="wm-window__btn wm-window__btn--float"
            onClick={(e) => { e.stopPropagation(); dispatch({ type: 'FLOAT', id: state.id }); }}
            title="Restore size"
          />
          <button
            className="wm-window__btn wm-window__btn--max"
            onClick={(e) => { e.stopPropagation(); dispatch({ type: 'MAXIMIZE', id: state.id }); }}
            title={state.maximized ? 'Restore' : 'Maximize'}
          />
          {state.closable && (
            <button
              className="wm-window__btn wm-window__btn--close"
              onClick={(e) => { e.stopPropagation(); dispatch({ type: 'CLOSE', id: state.id }); }}
              title="Close"
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="wm-window__content">
        {children}
      </div>

      {/* 8-direction resize handles */}
      {!state.maximized && (
        <>
          <div className="wm-resize wm-resize--n" onPointerDown={onResizeStart('n')} />
          <div className="wm-resize wm-resize--s" onPointerDown={onResizeStart('s')} />
          <div className="wm-resize wm-resize--e" onPointerDown={onResizeStart('e')} />
          <div className="wm-resize wm-resize--w" onPointerDown={onResizeStart('w')} />
          <div className="wm-resize wm-resize--ne" onPointerDown={onResizeStart('ne')} />
          <div className="wm-resize wm-resize--nw" onPointerDown={onResizeStart('nw')} />
          <div className="wm-resize wm-resize--se" onPointerDown={onResizeStart('se')} />
          <div className="wm-resize wm-resize--sw" onPointerDown={onResizeStart('sw')} />
        </>
      )}
    </div>
  );
}
