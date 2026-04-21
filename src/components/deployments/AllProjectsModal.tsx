import React, { useState } from 'react';
import type { Project } from '../../types';
import ProjectCard from './ProjectCard';
import ProjectModal from './ProjectModal';

interface AllProjectsModalProps {
  projects: Project[];
  onClose: () => void;
}

export default function AllProjectsModal({ projects, onClose }: AllProjectsModalProps) {
  const [detail, setDetail] = useState<Project | null>(null);

  const sorted = [...projects].sort((a, b) => {
    const aScore = (a.isHighlighted ? 2 : 0) + (a.isFavorite ? 1 : 0);
    const bScore = (b.isHighlighted ? 2 : 0) + (b.isFavorite ? 1 : 0);
    if (bScore !== aScore) return bScore - aScore;
    if (a.pushedAt && b.pushedAt) return new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime();
    return (a.order ?? 0) - (b.order ?? 0);
  });

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col p-4"
        onClick={onClose}
      >
        <div
          className="bg-carbono-surface border border-white/15 w-full max-w-5xl mx-auto flex flex-col max-h-full"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-white tracking-widest">ALL_PROJECTS</span>
              <span className="text-[10px] text-text-faint tracking-widest">({sorted.length} deployed)</span>
            </div>
            <button
              onClick={onClose}
              className="text-[10px] text-text-faint hover:text-white tracking-widest border border-white/15 px-2 py-1 hover:border-white/40 transition-colors"
            >
              [ESC]
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
              {sorted.map(p => (
                <ProjectCard key={p.id} project={p} onClick={setDetail} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <ProjectModal project={detail} onClose={() => setDetail(null)} />
    </>
  );
}
