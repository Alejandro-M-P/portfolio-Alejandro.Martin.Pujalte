import React, { useEffect, useRef, useState } from 'react';
import type { Project, SiteSettings } from '../../types';

interface ProjectCardProps {
  project: Project;
  onClick: (project: Project) => void;
}

const DEFAULT_SETTINGS: SiteSettings = { availabilityValue: 99.9, dustThresholdDays: 60, starsForGold: 5 };

function loadSettings(): SiteSettings {
  try {
    const s = localStorage.getItem('portfolioSettings');
    if (s) return { ...DEFAULT_SETTINGS, ...JSON.parse(s) };
  } catch {}
  return DEFAULT_SETTINGS;
}

function getEntropyStyle(pushedAt: string | undefined, thresholdDays: number): React.CSSProperties {
  if (!pushedAt) return {};
  const days = (Date.now() - new Date(pushedAt).getTime()) / 86_400_000;
  if (days < thresholdDays) return {};
  if (days < thresholdDays * 2) return { filter: 'brightness(0.82) saturate(0.45)' };
  if (days < thresholdDays * 3) return { filter: 'brightness(0.65) saturate(0.15) blur(0.5px)' };
  return { filter: 'brightness(0.5) saturate(0) blur(1px)' };
}

const statusStyle: Record<string, string> = {
  IN_PROGRESS: 'text-warn border-warn/50 bg-warn/10',
  COMPLETED:   'text-cobalt border-cobalt/50 bg-cobalt/10',
  PAUSED:      'text-white/40 border-white/20 bg-white/5',
  ARCHIVED:    'text-err/60 border-err/30 bg-err/5',
};

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(loadSettings());
    const onStorage = () => setSettings(loadSettings());
    window.addEventListener('storage', onStorage);
    window.addEventListener('portfolioSettingsChanged', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('portfolioSettingsChanged', onStorage);
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { rootMargin: '150px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const stars  = Number(project.specs?.stars ?? 0);
  const status = project.specs?.status as string | undefined;
  const isGold = !!(project.isHighlighted || stars >= settings.starsForGold);
  const entropyStyle = isGold ? {} : getEntropyStyle(project.pushedAt, settings.dustThresholdDays);

  if (!visible) return (
    <div ref={ref} className="h-[160px] border border-white/5 bg-carbono-surface animate-pulse" />
  );

  return (
    <div ref={ref}>
      {/*
        Full-image card: photo fills the entire card,
        info overlaid at the bottom with a gradient.
      */}
      <div
        className={`relative h-[160px] cursor-pointer group overflow-hidden border transition-all duration-150
          ${isGold
            ? 'border-bronze crt-flicker'
            : 'border-white/10 hover:border-white/40'
          }`}
        style={{
          boxShadow: isGold ? '0 0 24px rgba(184,115,51,0.2)' : undefined,
          ...entropyStyle,
        }}
        onClick={() => onClick(project)}
      >
        {/* Background image — fills entire card */}
        {project.photo ? (
          <img
            src={project.photo}
            alt={project.name}
            loading="lazy"
            decoding="async"
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105
              ${project.isPrivate ? 'opacity-40' : ''}`}
          />
        ) : (
          <div className="absolute inset-0 bg-carbono-mid flex items-center justify-center">
            <span className="text-[10px] text-text-faint tracking-widest">NO_PREVIEW</span>
          </div>
        )}

        {/* Gold shimmer */}
        {isGold && (
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'linear-gradient(135deg, rgba(184,115,51,0.12) 0%, transparent 60%, rgba(184,115,51,0.06) 100%)',
          }} />
        )}

        {/* Private overlay */}
        {project.isPrivate && (
          <div className="absolute inset-0 redacted-stripes flex flex-col items-center justify-center gap-1.5">
            <div className="border-2 border-err/70 px-2.5 py-0.5 bg-carbono/80" style={{ transform: 'rotate(-6deg)' }}>
              <span className="text-err text-[9px] font-bold tracking-[0.3em] uppercase">CLASSIFIED</span>
            </div>
            <span className="text-[8px] text-white/40 tracking-widest">Private · NDA</span>
          </div>
        )}

        {/* Gradient overlay — bottom to top */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Top-left badges */}
        <div className="absolute top-1.5 left-1.5 flex gap-1">
          {status && statusStyle[status] && (
            <span className={`text-[8px] font-bold tracking-widest uppercase border px-1.5 py-0.5 leading-none backdrop-blur-sm ${statusStyle[status]}`}>
              {status.replace('_', ' ')}
            </span>
          )}
          {project.isFavorite && (
            <span className="text-[8px] font-bold tracking-widest uppercase border px-1.5 py-0.5 leading-none text-bronze border-bronze/50 bg-bronze/20 backdrop-blur-sm">
              PINNED
            </span>
          )}
        </div>

        {/* Top-right: stars */}
        {stars > 0 && (
          <div className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-black/60 border border-warn/40 px-2 py-1 backdrop-blur-sm">
            <span className="text-sm text-warn">★</span>
            <span className="text-sm text-white font-mono font-bold">{stars}</span>
          </div>
        )}

        {/* Bottom info overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2 pt-4">
          <p className={`text-[11px] font-bold tracking-widest uppercase leading-tight
            ${isGold ? 'text-bronze' : 'text-white'}`}>
            {project.name}
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {[...new Set(project.stack)].slice(0, 3).map(tech => (
              <span key={tech} className={`text-[8px] border px-1 py-0.5 tracking-widest uppercase backdrop-blur-sm
                ${isGold ? 'border-bronze/40 text-bronze/80 bg-black/40' : 'border-white/25 text-white/70 bg-black/40'}`}>
                {tech}
              </span>
            ))}
            {project.stack.length > 3 && (
              <span className="text-[8px] text-white/40 py-0.5">+{project.stack.length - 3}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
