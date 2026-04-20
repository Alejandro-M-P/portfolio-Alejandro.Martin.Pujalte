import React, { useEffect, useRef, useState } from 'react';
import type { Project, SiteSettings } from '../../types';
import Pill from '../ui/Pill';

interface ProjectCardProps {
  project: Project;
  onClick: (project: Project) => void;
}

const SETTINGS_KEY = 'portfolioSettings';
const DEFAULT_SETTINGS: SiteSettings = { availabilityValue: 99.9, dustThresholdDays: 60, starsForGold: 5 };

function loadSettings(): SiteSettings {
  try {
    const s = localStorage.getItem(SETTINGS_KEY);
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

function getUptime(pushedAt: string | undefined): string {
  if (!pushedAt) return '?';
  const days = Math.floor((Date.now() - new Date(pushedAt).getTime()) / 86_400_000);
  if (days < 1) return '<1d';
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}y`;
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

  const stars = Number(project.specs?.stars ?? 0);
  const status = project.specs?.status as string | undefined;
  const hasVideo = !!(project.specs?.video);
  const isGold = !!(project.isHighlighted || stars >= settings.starsForGold);
  const entropyStyle = isGold ? {} : getEntropyStyle(project.pushedAt, settings.dustThresholdDays);
  const uptime = getUptime(project.pushedAt);
  const mainImage = project.stack[0] ?? 'UNKNOWN';

  return (
    <div ref={ref} className={`transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      {visible && (
        <div
          className={`border cursor-pointer group transition-colors duration-100 relative ${isGold ? 'border-bronze crt-flicker' : 'border-white/10 bg-carbono-surface hover:border-white/30'}`}
          style={{
            backgroundColor: isGold ? '#0a0a0a' : undefined,
            boxShadow: isGold ? '0 0 28px rgba(184,115,51,0.22), inset 0 0 60px rgba(184,115,51,0.04)' : undefined,
            ...entropyStyle,
          }}
          onClick={() => onClick(project)}
        >
          {/* Image */}
          <div className="relative aspect-video overflow-hidden bg-carbono-mid">
            {project.photo ? (
              <img
                src={project.photo}
                alt={project.name}
                loading="lazy"
                decoding="async"
                className={`w-full h-full object-cover transition-all duration-200 ${project.isPrivate ? 'opacity-50' : ''} group-hover:grayscale-0`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-text-faint tracking-widest">
                NO_PREVIEW
              </div>
            )}

            {/* REDACTED overlay */}
            {project.isPrivate && (
              <div className="absolute inset-0 redacted-stripes flex items-center justify-center">
                <div className="border-2 border-err/70 px-3 py-1 bg-carbono/70" style={{ transform: 'rotate(-8deg)' }}>
                  <span className="text-err text-[10px] font-bold tracking-[0.3em] uppercase">ACCESO RESTRINGIDO</span>
                </div>
              </div>
            )}

            {/* Bronze shimmer */}
            {isGold && (
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'linear-gradient(135deg, rgba(184,115,51,0.1) 0%, transparent 50%, rgba(184,115,51,0.06) 100%)',
              }} />
            )}

            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              <Pill variant="default" className={`text-xs ${isGold ? 'text-bronze border-bronze/50' : ''}`}>{project.id}</Pill>
              {status && statusStyle[status] && (
                <span className={`text-[9px] font-bold tracking-widest uppercase border px-1.5 py-0.5 leading-none ${statusStyle[status]}`}>
                  {status.replace('_', ' ')}
                </span>
              )}
              {project.isFavorite && (
                <span className="text-[9px] font-bold tracking-widest uppercase border px-1.5 py-0.5 leading-none text-bronze border-bronze/50 bg-bronze/10">
                  PINNED
                </span>
              )}
            </div>

            {hasVideo && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-black/60 border border-white/20 flex items-center justify-center">
                <span className="text-[10px] text-white">▶</span>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-carbono/80 to-transparent" />
          </div>

          {/* Card body */}
          <div className="p-3">
            <p className={`text-xs font-bold tracking-widest mb-2 uppercase ${isGold ? 'text-bronze' : 'text-white'}`}>
              {project.name}
            </p>

            {/* Pod indicators */}
            <div className="flex gap-3 mb-2">
              <span className="text-[9px] tracking-widest text-[#22c55e]">
                <span className="animate-pulse">●</span> RUNNING
              </span>
              <span className="text-[9px] tracking-widest text-text-faint">UP:{uptime}</span>
              <span className="text-[9px] tracking-widest text-text-faint">IMG:{mainImage}</span>
            </div>

            <div className="flex flex-wrap gap-1">
              {[...new Set(project.stack)].map((tech) => (
                <span key={tech} className={`text-xs border px-1.5 py-0.5 tracking-widest uppercase ${isGold ? 'border-bronze/40 text-bronze/80' : 'border-white/30 text-white/70'}`}>
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {!visible && (
        <div className="border border-white/5 bg-carbono-surface">
          <div className="aspect-video bg-carbono animate-pulse" />
          <div className="p-3 flex flex-col gap-2">
            <div className="h-3 bg-white/5 animate-pulse w-2/3" />
            <div className="h-3 bg-white/5 animate-pulse w-1/3" />
          </div>
        </div>
      )}
    </div>
  );
}
