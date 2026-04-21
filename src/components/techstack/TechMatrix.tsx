import React, { useState, useEffect } from 'react';
import type { Project, TechTool } from '../../types';
import ProgressBar from '../ui/ProgressBar';
import AllTechModal from './AllTechModal';

interface TechMatrixProps {
  tools?: TechTool[];
}

const VERSION_MAP: Record<string, string> = {
  'GO': 'v1.23+',
  'TYPESCRIPT': 'v5.3+',
  'JAVASCRIPT': 'ES2024',
  'SHELL': 'bash 5+',
  'ASTRO': 'v5+',
  'REACT': 'v19+',
  'DOCKER': 'v26+',
  'PODMAN': 'v5+',
  'OLLAMA': 'latest',
  'MCP': 'v1.0+',
  'GIT': 'v2.45+',
  'TAILWIND': 'v4+',
  'POSTGRESQL': 'v16+',
  'NODE.JS': 'v22+',
};

function deriveFromProjects(projects: Project[]): TechTool[] {
  if (!projects.length) return [];
  const counts: Record<string, number> = {};
  const dustThresholdDays = 60;

  for (const p of projects) {
    const stars = Number(p.specs?.stars ?? 0);
    const isGold = !!(p.isHighlighted || p.isFavorite || stars >= 5);
    const daysSinceUpdate = p.pushedAt ? (Date.now() - new Date(p.pushedAt).getTime()) / 86_400_000 : 0;
    const isDusty = daysSinceUpdate > dustThresholdDays;

    // Sistema de pesos industrial
    let weight = 1.0;
    if (isGold) weight = 2.0;
    if (isDusty) weight = 0.5;

    for (const tech of p.stack) {
      counts[tech] = (counts[tech] ?? 0) + weight;
    }
  }

  // Normalizar a porcentaje basado en el máximo puntaje
  const scores = Object.values(counts);
  const maxScore = Math.max(...scores, 1);

  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([name, score]) => ({
      name,
      version: VERSION_MAP[name] ?? '-',
      usageLevel: Math.round((score / maxScore) * 100),
    }));
}

export default function TechMatrix({ tools: initialTools = [] }: TechMatrixProps) {
  const [tools, setTools] = useState<TechTool[]>(initialTools);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const loadTechStack = () => {
      const projectStored = localStorage.getItem('portfolioProjects');
      if (projectStored) {
        const projects: Project[] = JSON.parse(projectStored);
        if (projects?.length) { 
          // Tomamos solo los primeros 10 para que sea "RECENT"
          setTools(deriveFromProjects(projects.slice(0, 10))); 
          return; 
        }
      }
      setTools(initialTools);
    };

    loadTechStack();
    const handleStorageChange = (e: StorageEvent) => {
      if (['portfolioProjects', 'portfolioTechstack', 'lastDataUpdate'].includes(e.key ?? '')) loadTechStack();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [initialTools]);

  if (!tools.length) {
    return (
      <div className="border border-white/10 bg-carbono-surface p-8 text-center island-fade">
        <span className="text-[14px] text-text-faint tracking-widest">NO_TOOLS_REGISTERED</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 island-load h-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tools.map((tool) => (
            <div key={tool.name} className="border border-white/10 bg-carbono p-3 flex flex-col gap-2 hover:border-cobalt/40 transition-colors">
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-bold text-white tracking-widest uppercase">{tool.name}</span>
                <span className="text-[10px] text-cobalt tracking-widest font-mono">[ {tool.usageLevel}% ]</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <ProgressBar value={tool.usageLevel} segments={12} />
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-text-faint tracking-widest italic">{tool.version !== '-' ? tool.version : 'CORE_MODULE'}</span>
                  <span className="text-[9px] text-white/20 tracking-widest uppercase">system_verified</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAll && <AllTechModal tools={tools} onClose={() => setShowAll(false)} />}
    </>
  );
}
