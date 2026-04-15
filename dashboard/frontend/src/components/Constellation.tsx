import { useRef, useEffect, useCallback } from 'react';
import { useDashboard } from '../store';
import type { CenterView } from '../types/dashboard';

const STAGE_SIZES: Record<string, number> = { idea: 18, dev: 28, uat: 34, prod: 40 };
const HEALTH_COLORS: Record<string, string> = {
  green: '#34d399',
  amber: '#fbbf24',
  red: '#f87171',
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export function Constellation() {
  const { projects, documents, selectProject, centerView, setCenterView, setRightPanelTab, setActiveDocument } = useDashboard();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef(0);
  const mouseRef = useRef({ x: -1, y: -1 });
  const hoveredRef = useRef<string | null>(null);

  // Compute stable positions based on project count
  const positionsRef = useRef<{ x: number; y: number }[]>([]);
  useEffect(() => {
    positionsRef.current = projects.map((p, i) => {
      const angle = (i / projects.length) * Math.PI * 2 - Math.PI / 2;
      const radius = 0.22 + (p.stage === 'prod' ? 0.02 : p.stage === 'idea' ? 0.12 : 0.08);
      return {
        x: 0.5 + Math.cos(angle) * radius,
        y: 0.5 + Math.sin(angle) * radius,
      };
    });
  }, [projects]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const t = timeRef.current;

    ctx.clearRect(0, 0, w, h);

    // Background gradient
    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
    bgGrad.addColorStop(0, 'rgba(20, 30, 48, 1)');
    bgGrad.addColorStop(0.5, 'rgba(15, 20, 35, 1)');
    bgGrad.addColorStop(1, 'rgba(8, 12, 24, 1)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle grid
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.03)';
    ctx.lineWidth = 0.5;
    const gridSize = 40;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    const positions = positionsRef.current;

    // Connection lines between projects sharing stack
    for (let i = 0; i < projects.length; i++) {
      for (let j = i + 1; j < projects.length; j++) {
        const shared = projects[i].stack.filter(s => projects[j].stack.includes(s));
        if (shared.length > 0) {
          const ax = positions[i].x * w, ay = positions[i].y * h;
          const bx = positions[j].x * w, by = positions[j].y * h;
          const grad = ctx.createLinearGradient(ax, ay, bx, by);
          const alpha = Math.min(0.15, shared.length * 0.05);
          grad.addColorStop(0, `rgba(100, 220, 255, ${alpha})`);
          grad.addColorStop(0.5, `rgba(100, 220, 255, ${alpha * 0.3})`);
          grad.addColorStop(1, `rgba(100, 220, 255, ${alpha})`);
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          // Curved connection
          const mx = (ax + bx) / 2 + (ay - by) * 0.15;
          const my = (ay + by) / 2 + (bx - ax) * 0.15;
          ctx.quadraticCurveTo(mx, my, bx, by);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Traveling pulse on connection
          const pulse = (t * 0.001 + i * 0.3) % 1;
          const px = (1 - pulse) * (1 - pulse) * ax + 2 * (1 - pulse) * pulse * mx + pulse * pulse * bx;
          const py = (1 - pulse) * (1 - pulse) * ay + 2 * (1 - pulse) * pulse * my + pulse * pulse * by;
          ctx.beginPath();
          ctx.arc(px, py, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(100, 220, 255, ${alpha * 3})`;
          ctx.fill();
        }
      }
    }

    // Document nodes — tiny orbiting dots around the center
    const docNodes = documents.slice(0, 20);
    for (let i = 0; i < docNodes.length; i++) {
      const doc = docNodes[i];
      const angle = (i / Math.max(docNodes.length, 1)) * Math.PI * 2 + t * 0.0003;
      const radius = 0.38 + (i % 3) * 0.04;
      const dx = w * (0.5 + Math.cos(angle) * radius);
      const dy = h * (0.5 + Math.sin(angle) * radius);
      const isHovered = hoveredRef.current === doc.id;

      // Tiny glow
      ctx.beginPath();
      ctx.arc(dx, dy, isHovered ? 6 : 3.5, 0, Math.PI * 2);
      const docColor = doc.language === 'markdown' ? '#a78bfa'
        : doc.language === 'html' ? '#fb923c'
        : doc.language === 'json' ? '#fbbf24'
        : doc.language === 'css' ? '#38bdf8'
        : '#5eead4';
      ctx.fillStyle = docColor;
      ctx.shadowColor = docColor;
      ctx.shadowBlur = isHovered ? 16 : 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Label on hover
      if (isHovered) {
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.textAlign = 'center';
        ctx.fillText(doc.filename, dx, dy - 10);
      }
    }

    // Project nodes
    for (let i = 0; i < projects.length; i++) {
      const p = projects[i];
      const pos = positions[i];
      const x = pos.x * w;
      const y = pos.y * h;
      const size = STAGE_SIZES[p.stage] || 28;
      const isHovered = hoveredRef.current === p.id;
      const scale = isHovered ? 1.15 : 1;
      const r = size * scale;

      // Parse project color to rgb for canvas use
      const hue = parseFloat(p.color.match(/[\d.]+(?=\))/)?.[0] || '180');
      const rgb = hslToRgb(hue);

      // Outer glow ring
      const glowGrad = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 3);
      glowGrad.addColorStop(0, `rgba(${rgb}, 0.15)`);
      glowGrad.addColorStop(0.5, `rgba(${rgb}, 0.05)`);
      glowGrad.addColorStop(1, `rgba(${rgb}, 0)`);
      ctx.beginPath();
      ctx.arc(x, y, r * 3, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
      ctx.fill();

      // Orbit ring
      ctx.beginPath();
      ctx.arc(x, y, r * 1.6, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${rgb}, ${isHovered ? 0.3 : 0.1})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Orbiting dot
      const orbitAngle = t * 0.002 + i * 1.2;
      const ox = x + Math.cos(orbitAngle) * r * 1.6;
      const oy = y + Math.sin(orbitAngle) * r * 1.6;
      ctx.beginPath();
      ctx.arc(ox, oy, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb}, 0.6)`;
      ctx.fill();

      // Main orb — gradient sphere
      const orbGrad = ctx.createRadialGradient(x - r * 0.25, y - r * 0.25, r * 0.1, x, y, r);
      orbGrad.addColorStop(0, `rgba(${rgb}, 1)`);
      orbGrad.addColorStop(0.6, `rgba(${rgb}, 0.7)`);
      orbGrad.addColorStop(1, `rgba(${Math.max(0, parseInt(rgb.split(',')[0]) - 60)}, ${Math.max(0, parseInt(rgb.split(',')[1]) - 60)}, ${Math.max(0, parseInt(rgb.split(',')[2]) - 30)}, 0.9)`);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = orbGrad;
      ctx.shadowColor = `rgba(${rgb}, 0.5)`;
      ctx.shadowBlur = isHovered ? r * 2 : r;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Specular highlight
      const specGrad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x - r * 0.3, y - r * 0.3, r * 0.6);
      specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
      specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = specGrad;
      ctx.fill();

      // Health indicator dot
      ctx.beginPath();
      ctx.arc(x - r * 0.6, y + r + 10, 3, 0, Math.PI * 2);
      ctx.fillStyle = HEALTH_COLORS[p.health] || '#888';
      ctx.shadowColor = HEALTH_COLORS[p.health] || '#888';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Label
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.fillStyle = isHovered ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)';
      ctx.textAlign = 'center';
      ctx.fillText(p.displayName, x, y + r + 22);

      // Stage + progress
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      const stageText = p.stage.toUpperCase() + (p.phaseProgress < 1 ? ` ${Math.round(p.phaseProgress * 100)}%` : '');
      ctx.fillText(stageText, x, y + r + 34);

      // Progress arc
      if (p.phaseProgress < 1) {
        ctx.beginPath();
        ctx.arc(x, y, r + 3, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p.phaseProgress);
        ctx.strokeStyle = `rgba(${rgb}, 0.5)`;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.lineCap = 'butt';
      }
    }

    // Update and draw particles
    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      const alpha = (p.life / p.maxLife) * 0.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
      ctx.fillStyle = p.color.replace('1)', `${alpha})`);
      ctx.fill();
    }

    // Spawn ambient particles
    if (Math.random() < 0.1) {
      particles.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        life: 80 + Math.random() * 120, maxLife: 80 + Math.random() * 120,
        size: 1 + Math.random() * 1.5,
        color: 'rgba(100, 200, 255, 1)',
      });
    }

    timeRef.current += 16;
    frameRef.current = requestAnimationFrame(draw);
  }, [projects, documents]);

  // Handle mouse for hover detection
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    mouseRef.current = { x: mx * scaleX, y: my * scaleY };

    // Check project hover
    const w = canvas.width;
    const h = canvas.height;
    let found: string | null = null;
    for (let i = 0; i < projects.length; i++) {
      const pos = positionsRef.current[i];
      if (!pos) continue;
      const px = pos.x * w;
      const py = pos.y * h;
      const size = STAGE_SIZES[projects[i].stage] || 28;
      const dist = Math.sqrt((mx * scaleX - px) ** 2 + (my * scaleY - py) ** 2);
      if (dist < size * 1.5) { found = projects[i].id; break; }
    }
    // Check document hover
    if (!found) {
      const docNodes = documents.slice(0, 20);
      for (let i = 0; i < docNodes.length; i++) {
        const angle = (i / Math.max(docNodes.length, 1)) * Math.PI * 2 + timeRef.current * 0.0003;
        const radius = 0.38 + (i % 3) * 0.04;
        const dx = w * (0.5 + Math.cos(angle) * radius);
        const dy = h * (0.5 + Math.sin(angle) * radius);
        const dist = Math.sqrt((mx * scaleX - dx) ** 2 + (my * scaleY - dy) ** 2);
        if (dist < 10) { found = docNodes[i].id; break; }
      }
    }
    hoveredRef.current = found;
    canvas.style.cursor = found ? 'pointer' : 'default';
  }, [projects, documents]);

  const handleClick = useCallback(() => {
    const hovered = hoveredRef.current;
    if (!hovered) return;
    if (hovered.startsWith('doc-')) {
      setActiveDocument(hovered);
      setRightPanelTab('documents');
    } else {
      selectProject(hovered);
    }
  }, [selectProject, setActiveDocument, setRightPanelTab]);

  // Canvas setup and animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;

    function resize() {
      if (!canvas || !canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth * 2;
      canvas.height = canvas.parentElement.clientHeight * 2;
    }
    resize();
    window.addEventListener('resize', resize);

    if (centerView === 'constellation') {
      frameRef.current = requestAnimationFrame(draw);
    }

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frameRef.current);
    };
  }, [draw, centerView]);

  useEffect(() => {
    if (centerView !== 'constellation') {
      cancelAnimationFrame(frameRef.current);
    } else {
      frameRef.current = requestAnimationFrame(draw);
    }
    return () => cancelAnimationFrame(frameRef.current);
  }, [centerView, draw]);

  const views: { id: CenterView; label: string }[] = [
    { id: 'constellation', label: 'Constellation' },
    { id: 'brain', label: 'Brain' },
    { id: 'files', label: 'Files' },
  ];

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0e1a' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      />
      {/* View toggle */}
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

// Convert oklch hue to approximate RGB string
function hslToRgb(hue: number): string {
  const h = hue / 360;
  const s = 0.7;
  const l = 0.6;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    return Math.round((l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255);
  };
  return `${f(0)}, ${f(8)}, ${f(4)}`;
}
