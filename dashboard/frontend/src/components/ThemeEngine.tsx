import { useState, useEffect } from 'react';

interface ThemePreset {
  id: string;
  name: string;
  vars: Record<string, string>;
}

const PRESETS: ThemePreset[] = [
  {
    id: 'dark',
    name: 'Dark',
    vars: {
      '--color-bg-primary': 'oklch(0.11 0.008 260)',
      '--color-bg-secondary': 'oklch(0.14 0.008 260)',
      '--color-bg-surface': 'oklch(0.18 0.01 260)',
      '--color-text-primary': 'oklch(0.96 0.005 260)',
      '--color-text-secondary': 'oklch(0.72 0.01 260)',
      '--color-text-muted': 'oklch(0.48 0.01 260)',
      '--color-accent': 'oklch(0.78 0.16 180)',
      '--border-color': 'oklch(0.22 0.008 260)',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    vars: {
      '--color-bg-primary': 'oklch(0.08 0.02 270)',
      '--color-bg-secondary': 'oklch(0.11 0.02 270)',
      '--color-bg-surface': 'oklch(0.15 0.025 270)',
      '--color-text-primary': 'oklch(0.92 0.01 270)',
      '--color-text-secondary': 'oklch(0.68 0.015 270)',
      '--color-text-muted': 'oklch(0.45 0.015 270)',
      '--color-accent': 'oklch(0.72 0.20 280)',
      '--border-color': 'oklch(0.18 0.02 270)',
    },
  },
  {
    id: 'terminal',
    name: 'Terminal',
    vars: {
      '--color-bg-primary': 'oklch(0.06 0.005 145)',
      '--color-bg-secondary': 'oklch(0.09 0.008 145)',
      '--color-bg-surface': 'oklch(0.13 0.01 145)',
      '--color-text-primary': 'oklch(0.90 0.18 145)',
      '--color-text-secondary': 'oklch(0.70 0.12 145)',
      '--color-text-muted': 'oklch(0.45 0.08 145)',
      '--color-accent': 'oklch(0.80 0.22 145)',
      '--border-color': 'oklch(0.18 0.02 145)',
    },
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    vars: {
      '--color-bg-primary': 'oklch(0.08 0.015 320)',
      '--color-bg-secondary': 'oklch(0.12 0.02 320)',
      '--color-bg-surface': 'oklch(0.16 0.025 320)',
      '--color-text-primary': 'oklch(0.95 0.01 60)',
      '--color-text-secondary': 'oklch(0.75 0.02 60)',
      '--color-text-muted': 'oklch(0.50 0.02 320)',
      '--color-accent': 'oklch(0.80 0.25 330)',
      '--border-color': 'oklch(0.22 0.03 320)',
    },
  },
];

function applyTheme(preset: ThemePreset) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(preset.vars)) {
    root.style.setProperty(key, value);
  }
  localStorage.setItem('venture-os-theme', preset.id);
}

export function useThemeInit() {
  useEffect(() => {
    const saved = localStorage.getItem('venture-os-theme');
    if (saved) {
      const preset = PRESETS.find(p => p.id === saved);
      if (preset) applyTheme(preset);
    }
  }, []);
}

export function ThemeEngine({ onClose }: { onClose: () => void }) {
  const [active, setActive] = useState(() => {
    return localStorage.getItem('venture-os-theme') || 'dark';
  });

  function selectPreset(preset: ThemePreset) {
    applyTheme(preset);
    setActive(preset.id);
  }

  return (
    <div className="theme-engine" onClick={onClose}>
      <div className="theme-engine__box" onClick={e => e.stopPropagation()}>
        <div className="theme-engine__title">Theme Engine</div>
        <div className="theme-engine__presets">
          {PRESETS.map(p => (
            <button
              key={p.id}
              className={`theme-engine__preset ${active === p.id ? 'theme-engine__preset--active' : ''}`}
              onClick={() => selectPreset(p)}
            >
              <div className="theme-engine__preview">
                <div style={{ background: p.vars['--color-bg-primary'], flex: 1 }} />
                <div style={{ background: p.vars['--color-bg-secondary'], flex: 1 }} />
                <div style={{ background: p.vars['--color-accent'], flex: 0.5 }} />
              </div>
              <span>{p.name}</span>
            </button>
          ))}
        </div>
        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-family-mono)', marginTop: 12 }}>
          Theme persists across sessions
        </div>
      </div>
    </div>
  );
}
