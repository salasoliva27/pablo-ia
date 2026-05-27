import { useEffect, useState, type ComponentType } from 'react';
import type { ISourceOptions } from '@tsparticles/engine';

type ParticlesProps = { id: string; options: ISourceOptions };

// Mount-only-when-Space, lazy-loads the tsparticles slim engine on first mount.
// The deps (~slim engine + react wrapper) are dynamic-imported so non-space
// sessions never pay the bundle cost.

let enginePromise: Promise<void> | null = null;

async function ensureEngine(): Promise<ComponentType<ParticlesProps>> {
  const [{ default: Particles, initParticlesEngine }, { loadSlim }] = await Promise.all([
    import('@tsparticles/react'),
    import('@tsparticles/slim'),
  ]);
  if (!enginePromise) {
    enginePromise = initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    });
  }
  await enginePromise;
  return Particles as unknown as ComponentType<ParticlesProps>;
}

const OPTIONS: ISourceOptions = {
  fullScreen: { enable: false },
  fpsLimit: 60,
  detectRetina: true,
  background: { color: { value: 'transparent' } },
  particles: {
    number: { value: 160, density: { enable: true, width: 1920, height: 1080 } },
    color: { value: ['#ffffff', '#cbd5ff', '#fde3ff', '#fff7c2'] },
    shape: { type: 'circle' },
    opacity: {
      value: { min: 0.25, max: 1 },
      animation: { enable: true, speed: 0.6, sync: false, startValue: 'random' },
    },
    size: {
      value: { min: 0.4, max: 1.8 },
      animation: { enable: true, speed: 1.2, sync: false, startValue: 'random' },
    },
    move: {
      enable: true,
      speed: { min: 0.05, max: 0.35 },
      direction: 'none',
      random: true,
      straight: false,
      outModes: { default: 'out' },
    },
    twinkle: {
      particles: { enable: true, frequency: 0.05, opacity: 1, color: { value: '#ffffff' } },
    },
  },
  interactivity: {
    detectsOn: 'window',
    events: {
      onHover: { enable: true, mode: 'bubble', parallax: { enable: true, force: 30, smooth: 12 } },
      onClick: { enable: true, mode: 'push' },
      resize: { enable: true },
    },
    modes: {
      bubble: { distance: 120, size: 3.5, duration: 0.4, opacity: 1 },
      push: { quantity: 4 },
    },
  },
  emitters: [
    {
      direction: 'top-right',
      rate: { delay: 8, quantity: 1 },
      position: { x: 0, y: 80 },
      particles: {
        shape: { type: 'circle' },
        color: { value: '#ffffff' },
        opacity: { value: 1 },
        size: { value: { min: 1, max: 2 } },
        move: {
          enable: true,
          speed: { min: 30, max: 50 },
          direction: 'top-right',
          straight: true,
          outModes: { default: 'destroy' },
        },
        life: { duration: { value: 1.6 }, count: 1 },
        trail: { enable: true, length: 12, fill: { color: 'transparent' } },
      },
    },
    {
      direction: 'bottom-left',
      rate: { delay: 14, quantity: 1 },
      position: { x: 100, y: 20 },
      particles: {
        shape: { type: 'circle' },
        color: { value: '#cbd5ff' },
        opacity: { value: 1 },
        size: { value: { min: 1, max: 2 } },
        move: {
          enable: true,
          speed: { min: 25, max: 45 },
          direction: 'bottom-left',
          straight: true,
          outModes: { default: 'destroy' },
        },
        life: { duration: { value: 1.8 }, count: 1 },
        trail: { enable: true, length: 10, fill: { color: 'transparent' } },
      },
    },
  ],
};

export function Starfield() {
  const [Particles, setParticles] = useState<ComponentType<ParticlesProps> | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    let cancelled = false;
    document.documentElement.setAttribute('data-space-canvas', '1');
    ensureEngine().then((Comp) => {
      if (!cancelled) setParticles(() => Comp);
    });
    return () => {
      cancelled = true;
      document.documentElement.removeAttribute('data-space-canvas');
    };
  }, []);

  if (!Particles) return null;

  return (
    <div className="starfield-canvas" aria-hidden="true">
      <Particles id="janus-starfield" options={OPTIONS} />
    </div>
  );
}
