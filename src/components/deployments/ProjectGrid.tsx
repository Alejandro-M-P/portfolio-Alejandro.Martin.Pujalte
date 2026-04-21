import React, { useState, useEffect } from 'react';
import type { Project } from '../../types';
import ProjectCard from './ProjectCard';
import ProjectModal from './ProjectModal';
import AllProjectsModal from './AllProjectsModal';

export default function ProjectGrid() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<Project | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const load = () => {
      const stored = localStorage.getItem('portfolioProjects');
      if (stored) { setProjects(JSON.parse(stored)); return; }
      fetch('/data/projects.json')
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setProjects(data); })
        .catch(() => {});
    };

    load();

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'portfolioProjects' || e.key === 'lastDataUpdate') load();
    };
    const onRefresh = () => load();
    window.addEventListener('storage', onStorage);
    window.addEventListener('portfolioProjectsRefreshed', onRefresh);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('portfolioProjectsRefreshed', onRefresh);
    };
  }, []);

  const featured = [...projects]
    .sort((a, b) => {
      const aScore = (a.isHighlighted ? 2 : 0) + (a.isFavorite ? 1 : 0);
      const bScore = (b.isHighlighted ? 2 : 0) + (b.isFavorite ? 1 : 0);
      if (bScore !== aScore) return bScore - aScore;
      if (a.pushedAt && b.pushedAt) return new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime();
      return (a.order ?? 0) - (b.order ?? 0);
    })
    .slice(0, 6);

  return (
    <>
      <div className="@container flex flex-col gap-3">
        <div className="grid grid-cols-1 @xs:grid-cols-2 @md:grid-cols-3 gap-1.5">
          {featured.map(p => (
            <ProjectCard key={p.id} project={p} onClick={setSelected} />
          ))}
          {projects.length === 0 && (
            <div className="col-span-3 py-8 text-center text-xs text-text-faint tracking-widest">
              NO_PROJECTS
            </div>
          )}
        </div>

        {projects.length > 6 && (
          <button
            onClick={() => setShowAll(true)}
            className="self-end text-[11px] text-text-faint hover:text-cobalt tracking-widest uppercase border border-white/10 hover:border-cobalt/40 px-4 py-1.5 transition-colors duration-100"
          >
            ALL_PROJECTS ({projects.length}) →
          </button>
        )}
      </div>

      {showAll && (
        <AllProjectsModal projects={projects} onClose={() => setShowAll(false)} />
      )}
      <ProjectModal project={selected} onClose={() => setSelected(null)} />
    </>
  );
}
