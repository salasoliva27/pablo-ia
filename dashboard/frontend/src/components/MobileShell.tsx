import { useState } from "react";
import { ChatPanel } from "./ChatPanel";
import { Constellation } from "./Constellation";
import { BrainView } from "./BrainView";
import { ProcedureMap } from "./ProcedureMap";
import { FileHeatmapView } from "./FileHeatmapView";
import { CalendarPanel } from "./CalendarPanel";
import { TicketsPanel } from "./TicketsPanel";
import { ChatHistoryPanel } from "./ChatHistoryPanel";
import { useActiveTheme } from "./ThemeEngine";
import "./MobileShell.css";

type MobileView =
  | "chat"
  | "system"
  | "brain"
  | "procedures"
  | "files"
  | "calendar"
  | "tickets"
  | "history";

interface NavItem {
  id: MobileView;
  label: string;
  /** Single character / glyph used as the icon */
  icon: string;
}

const NAV: NavItem[] = [
  { id: "chat",       label: "Chat",       icon: "C" },
  { id: "system",     label: "System",     icon: "S" },
  { id: "brain",      label: "Brain",      icon: "B" },
  { id: "procedures", label: "Procedures", icon: "P" },
  { id: "files",      label: "Files",      icon: "F" },
  { id: "calendar",   label: "Calendar",   icon: "K" },
  { id: "tickets",    label: "Tickets",    icon: "T" },
  { id: "history",    label: "History",    icon: "H" },
];

export function MobileShell() {
  const [view, setView] = useState<MobileView>("chat");
  const [menuOpen, setMenuOpen] = useState(false);
  const theme = useActiveTheme();

  let body: React.ReactNode;
  switch (view) {
    case "chat":       body = <ChatPanel sessionId="session-0" />; break;
    case "system":     body = <Constellation />; break;
    case "brain":      body = <BrainView />; break;
    case "procedures": body = <ProcedureMap />; break;
    case "files":      body = <FileHeatmapView />; break;
    case "calendar":   body = <CalendarPanel />; break;
    case "tickets":    body = <TicketsPanel />; break;
    case "history":    body = <ChatHistoryPanel />; break;
  }

  const activeLabel = NAV.find(n => n.id === view)?.label ?? "Chat";

  return (
    <div className="mob-shell">
      {/* Top bar — branding + active view name + burger menu */}
      <header className="mob-top">
        {theme?.logo && <img src={theme.logo} className="mob-top__logo" alt="" />}
        <span className="mob-top__title">{activeLabel}</span>
        <button
          type="button"
          className="mob-top__menu"
          onClick={() => setMenuOpen(o => !o)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? "x" : "≡"}
        </button>
      </header>

      {/* Body fills the rest of the viewport */}
      <main className="mob-body">{body}</main>

      {/* Burger drawer — full overlay listing every view */}
      {menuOpen && (
        <div className="mob-drawer" onClick={() => setMenuOpen(false)}>
          <div className="mob-drawer__sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mob-drawer__handle" />
            <h3 className="mob-drawer__title">All views</h3>
            <div className="mob-drawer__grid">
              {NAV.map(item => (
                <button
                  key={item.id}
                  type="button"
                  className={`mob-drawer__item ${view === item.id ? "mob-drawer__item--active" : ""}`}
                  onClick={() => { setView(item.id); setMenuOpen(false); }}
                >
                  <span className="mob-drawer__icon">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
