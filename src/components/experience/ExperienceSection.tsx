import React, { useEffect, useState } from 'react';
import type { Experience } from '../../types';

export default function ExperienceSection() {
  const [items, setItems] = useState<Experience[]>([]);

  useEffect(() => {
    const load = () => {
      const stored = localStorage.getItem('portfolioExperience');
      if (stored) { setItems(JSON.parse(stored)); return; }
      fetch('/data/experience.json')
        .then(r => r.ok ? r.json() : [])
        .then((data: Experience[]) => {
          if (data.length) {
            setItems(data);
            localStorage.setItem('portfolioExperience', JSON.stringify(data));
          }
        })
        .catch(() => {});
    };
    load();
    const handler = (e: StorageEvent) => { if (e.key === 'portfolioExperience') load(); };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  if (!items.length) return (
    <div className="border border-white/10 bg-carbono-surface p-8 text-center">
      <span className="text-[12px] text-text-faint tracking-widest">NO_EXPERIENCE_REGISTERED</span>
    </div>
  );

  return (
    <div className="flex flex-col divide-y divide-white/[0.06]">
      {items.map(exp => (
        <div key={exp.id} className="border border-white/10 bg-carbono-surface p-5 flex flex-col gap-3 hover:border-white/20 transition-colors">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                {exp.url ? (
                  <a href={exp.url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-white tracking-widest uppercase hover:text-cobalt transition-colors">
                    {exp.company}
                  </a>
                ) : (
                  <span className="text-sm font-bold text-white tracking-widest uppercase">{exp.company}</span>
                )}
                {exp.current && (
                  <span className="text-[9px] font-bold tracking-widest uppercase border border-cobalt/40 text-cobalt px-1.5 py-0.5 bg-cobalt/5">CURRENT</span>
                )}
              </div>
              <span className="text-xs text-cobalt tracking-widest uppercase">{exp.role}</span>
            </div>
            <span className="text-[11px] text-text-faint tracking-widest font-mono flex-shrink-0">{exp.period}</span>
          </div>

          {exp.description && (
            <p className="text-xs text-text-muted leading-relaxed">{exp.description}</p>
          )}

          {exp.tech.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {exp.tech.map(t => (
                <span key={t} className="text-[10px] border border-white/20 px-1.5 py-0.5 text-white/50 uppercase tracking-widest">{t}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
