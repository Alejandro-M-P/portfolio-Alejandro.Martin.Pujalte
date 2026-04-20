import React, { useState, useEffect } from 'react';
import type { Project } from '../../types';
import ProjectCard from './ProjectCard';
import ProjectModal from './ProjectModal';

export default function ProjectGrid() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<Project | null>(null);

  useEffect(() => {
    const loadProjects = () => {
      // Try to load from localStorage first
      const stored = localStorage.getItem('portfolioProjects');
      if (stored) {
        setProjects(JSON.parse(stored));
        return;
      }
      
      // Fallback to fetch from public/data if localStorage is empty
      fetch('/data/projects.json')
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setProjects(data); })
        .catch(() => {});
    };

    // Initial load
    loadProjects();

    // Listen for data updates from admin panel
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'portfolioProjects' || e.key === 'lastDataUpdate') {
        loadProjects();
      }
    };

    const onRefresh = () => loadProjects();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('portfolioProjectsRefreshed', onRefresh);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('portfolioProjectsRefreshed', onRefresh);
    };
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {projects.map(p => (
          <ProjectCard key={p.id} project={p} onClick={setSelected} />
        ))}
      </div>
      <ProjectModal project={selected} onClose={() => setSelected(null)} />
    </>
  );
}
