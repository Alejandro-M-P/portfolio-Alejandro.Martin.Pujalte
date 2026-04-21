import React, { useState, useEffect } from 'react';
import type { Project } from '../../types';
import ProjectCard from './ProjectCard';
import ProjectModal from './ProjectModal';
import AllProjectsModal from './AllProjectsModal';

interface ProjectGridProps {
  projects?: Project[];
}

const INITIAL_LIMIT = 5;

export default function ProjectGrid({ projects: initialProjects = [] }: ProjectGridProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [selected, setSelected] = useState<Project | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Client-side hydration: sync from localStorage (admin updates)
  useEffect(() => {
    const load = () => {
      const stored = localStorage.getItem('portfolioProjects');
      if (stored) { setProjects(JSON.parse(stored)); return; }
    };

    load();

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'portfolioProjects' || e.key === 'lastDataUpdate') load();
    };
    const onRefresh = () => load();
    const onOpenFromTerminal = (e: any) => {
      if (e.detail?.project) setSelected(e.detail.project);
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('portfolioProjectsRefreshed', onRefresh);
    window.addEventListener('portfolioOpenProject', onOpenFromTerminal);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('portfolioProjectsRefreshed', onRefresh);
      window.removeEventListener('portfolioOpenProject', onOpenFromTerminal);
    };
  }, []);

  const sorted = [...projects]
    .sort((a, b) => {
      const aScore = (a.isHighlighted ? 2 : 0) + (a.isFavorite ? 1 : 0);
      const bScore = (b.isHighlighted ? 2 : 0) + (b.isFavorite ? 1 : 0);
      if (bScore !== aScore) return bScore - aScore;
      if (a.pushedAt && b.pushedAt) return new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime();
      return (a.order ?? 0) - (b.order ?? 0);
    });

  const visible = expanded ? sorted : sorted.slice(0, INITIAL_LIMIT);
  const remaining = sorted.length - INITIAL_LIMIT;

  return (
    <>
      <div className="@container flex flex-col gap-3 island-load">
        <div className="grid grid-cols-1 @xs:grid-cols-2 @md:grid-cols-5 gap-1.5">
          {visible.map(p => (
            <ProjectCard key={p.id} project={p} onClick={setSelected} />
          ))}
          {projects.length === 0 && (
            <div className="col-span-5 py-8 text-center text-xs text-text-faint tracking-widest">
              NO_PROJECTS
            </div>
          )}
        </div>

        {remaining > 0 && !expanded && (
          <button
            onClick={() => setShowAll(true)}
            className="self-end text-[11px] text-cobalt hover:text-white tracking-widest uppercase border border-cobalt/40 hover:border-cobalt hover:bg-cobalt/10 px-4 py-1.5 transition-colors duration-150 cursor-pointer"
          >
            [+] EXPAND_MODULES ({remaining})
          </button>
        )}

        {expanded && remaining > 0 && (
          <button
            onClick={() => setShowAll(true)}
            className="self-end text-[11px] text-text-faint hover:text-cobalt tracking-widest uppercase border border-white/10 hover:border-cobalt/40 px-4 py-1.5 transition-colors duration-100 cursor-pointer"
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
