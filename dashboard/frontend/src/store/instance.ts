// Stable per-browser-window instance ID. Survives reload (sessionStorage),
// unique across `window.open` pop-outs. Used by the window-store to track
// which browser window owns which UI window so persistent panels (System,
// Context, Activity, Chat A) are singletons across multiple pop-out windows.

const INSTANCE_KEY = 'janus-ui-instance-id';
const VIEWPORT_KEY = 'janus-ui-viewport-id';
const MAIN_VIEWPORT_CLAIM_KEY = 'janus-ui-main-viewport-claimed';

function generate(): string {
  const rand = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
  return `inst-${rand.slice(0, 12)}`;
}

// CRITICAL: `window.open(same-origin)` inherits sessionStorage from the opener.
// That means a popout opened via the top-bar "Open new screen" button starts
// with the opener's INSTANCE_ID AND VIEWPORT_KEY already cached — both tabs
// would share an INSTANCE_ID, breaking BroadcastChannel (peers filter their
// own messages out by instance id). The PopOutWindow button appends
// `?viewport=fresh` to the URL; here we honor that flag once, clearing BOTH
// keys before load() and loadViewport() run, so the popout generates its own
// identity. The URL-strip happens later inside loadViewport.
try {
  const sp = new URLSearchParams(window.location.search);
  if (sp.get('viewport') === 'fresh') {
    sessionStorage.removeItem(INSTANCE_KEY);
    sessionStorage.removeItem(VIEWPORT_KEY);
  }
} catch { /* ignore */ }

function load(): string {
  try {
    const existing = sessionStorage.getItem(INSTANCE_KEY);
    if (existing) return existing;
    const id = generate();
    sessionStorage.setItem(INSTANCE_KEY, id);
    return id;
  } catch {
    return generate();
  }
}

export const INSTANCE_ID = load();

// Viewport ID: the "screen" this browser tab represents. Stored in
// sessionStorage so it's bound to THIS tab specifically (different tab = new
// viewport). The very first tab to ever open on this workspace claims 'main';
// every subsequent tab gets a unique viewport so it starts blank, ready for
// new content. The claim is racy-safe enough: localStorage is single-tab-at-a-
// time for write, and even if two tabs both think they're main, the worst case
// is they share content — which is the prior behavior.
//
// IMPORTANT — sessionStorage gotcha: `window.open(samedomain)` inherits the
// opener's sessionStorage (per HTML spec). The "Pop Out" button uses
// window.open, so without intervention the new window would share VIEWPORT_KEY
// with its opener and never branch into the fresh-viewport path. The opener
// works around this by appending `?viewport=fresh` to the URL; we honor that
// flag here BEFORE checking the cached value, then strip the param so reloads
// of the popout don't re-spawn a viewport on every refresh.
function loadViewport(): string {
  try {
    let forceFresh = false;
    try {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('viewport') === 'fresh') {
        forceFresh = true;
        sp.delete('viewport');
        const qs = sp.toString();
        const newUrl = window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash;
        window.history.replaceState(null, '', newUrl);
      }
    } catch { /* env without URL/history — fall through */ }

    if (!forceFresh) {
      const cached = sessionStorage.getItem(VIEWPORT_KEY);
      if (cached) return cached;
    }

    let id: string;
    if (forceFresh) {
      id = `viewport-${generate().slice(5, 13)}`;
    } else {
      const mainClaimed = localStorage.getItem(MAIN_VIEWPORT_CLAIM_KEY);
      if (!mainClaimed) {
        localStorage.setItem(MAIN_VIEWPORT_CLAIM_KEY, INSTANCE_ID);
        id = 'main';
      } else {
        id = `viewport-${generate().slice(5, 13)}`;
      }
    }
    sessionStorage.setItem(VIEWPORT_KEY, id);
    return id;
  } catch {
    return 'main';
  }
}

export const VIEWPORT_ID = loadViewport();

// Allow a tab to relinquish its claim on 'main' (e.g. on close) so the next
// fresh tab can pick up the main viewport. Best-effort.
export function releaseMainViewportClaim() {
  try {
    if (VIEWPORT_ID === 'main') {
      const claimer = localStorage.getItem(MAIN_VIEWPORT_CLAIM_KEY);
      if (claimer === INSTANCE_ID) localStorage.removeItem(MAIN_VIEWPORT_CLAIM_KEY);
    }
  } catch { /* ignore */ }
}
