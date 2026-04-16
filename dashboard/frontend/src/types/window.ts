// Window Manager Types — pure floating, no grid

export interface WindowLineage {
  depth: number;
  label: string;
  parentSessionId: string | null;
  breadcrumb: string[];
  color: string;
}

export interface WindowState {
  id: string;
  title: string;
  type: 'chat' | 'center' | 'bottom' | 'right' | 'calendar' | 'sql-console';
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
  visible: boolean;
  closable: boolean;
  // Persistent windows (the core 4) are hidden on close instead of removed,
  // so the taskbar can reopen them.
  persistent?: boolean;
  // Saved bounds before maximize so restore goes back
  preMaxBounds?: { x: number; y: number; width: number; height: number };
  // For chat windows
  sessionId?: string;
  lineage?: WindowLineage;
  // For sql-console windows: which backend tool the queries hit
  consoleTool?: 'supabase' | 'snowflake';
}

export interface WindowLayout {
  windows: WindowState[];
  nextZIndex: number;
}

export type WindowAction =
  | { type: 'MOVE'; id: string; x: number; y: number }
  | { type: 'RESIZE'; id: string; x: number; y: number; width: number; height: number }
  | { type: 'RESIZE_BATCH'; updates: Array<{ id: string; x: number; y: number; width: number; height: number }> }
  | { type: 'MINIMIZE'; id: string }
  | { type: 'RESTORE'; id: string }
  | { type: 'MAXIMIZE'; id: string }
  | { type: 'FLOAT'; id: string }
  | { type: 'FOCUS'; id: string }
  | { type: 'CLOSE'; id: string }
  | { type: 'ADD'; window: WindowState }
  | { type: 'RESET' };

// Magnetic snap constants
export const SNAP_THRESHOLD = 12;
export const RELEASE_THRESHOLD = 35;

/** Collect all edges from other visible windows */
export function findSnapEdges(
  windows: WindowState[],
  excludeId: string,
): { lefts: number[]; rights: number[]; tops: number[]; bottoms: number[] } {
  const lefts: number[] = [];
  const rights: number[] = [];
  const tops: number[] = [];
  const bottoms: number[] = [];
  for (const w of windows) {
    if (w.id === excludeId || w.minimized || w.maximized) continue;
    lefts.push(w.x);
    rights.push(w.x + w.width);
    tops.push(w.y);
    bottoms.push(w.y + w.height);
  }
  return { lefts, rights, tops, bottoms };
}

/** Snap a value to the nearest edge if within threshold */
export function snapValue(
  val: number,
  edges: number[],
  wasSnapped: boolean,
): { snapped: number; isSnapped: boolean } {
  const threshold = wasSnapped ? RELEASE_THRESHOLD : SNAP_THRESHOLD;
  let closest = val;
  let minDist = Infinity;
  for (const e of edges) {
    const d = Math.abs(val - e);
    if (d < minDist) { minDist = d; closest = e; }
  }
  if (minDist <= threshold) {
    return { snapped: closest, isSnapped: true };
  }
  return { snapped: val, isSnapped: false };
}

/** Tolerance in px for edges to be considered "shared" (snapped together) */
const SHARED_EDGE_TOL = 3;

/** Find windows whose edges are snapped to a given edge value */
export function findSharedEdgeWindows(
  windows: WindowState[],
  excludeId: string,
  edge: 'top' | 'bottom' | 'left' | 'right',
  edgeValue: number,
): WindowState[] {
  return windows.filter(w => {
    if (w.id === excludeId || w.minimized || w.maximized) return false;
    let wEdge: number;
    switch (edge) {
      case 'top': wEdge = w.y; break;
      case 'bottom': wEdge = w.y + w.height; break;
      case 'left': wEdge = w.x; break;
      case 'right': wEdge = w.x + w.width; break;
    }
    return Math.abs(wEdge - edgeValue) <= SHARED_EDGE_TOL;
  });
}

// Lineage depth -> oklch color
export const LINEAGE_COLORS = [
  'oklch(0.78 0.16 180)', // 0: cyan
  'oklch(0.72 0.18 280)', // 1: purple
  'oklch(0.72 0.18 145)', // 2: green
  'oklch(0.68 0.15 50)',  // 3: amber
  'oklch(0.65 0.25 25)',  // 4+: red
];

export function lineageColor(depth: number): string {
  return LINEAGE_COLORS[Math.min(depth, LINEAGE_COLORS.length - 1)];
}
