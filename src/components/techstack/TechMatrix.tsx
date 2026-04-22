import React, { useState, useEffect } from 'react';
import type { Project, TechTool } from '../../types';
import ProgressBar from '../ui/ProgressBar';
import AllTechModal from './AllTechModal';

interface TechMatrixProps {
  tools?: TechTool[];
}

const DEFAULT_VERSION_MAP: Record<string, string> = {
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

export function deriveFromProjects(projects: Project[], versionMap: Record<string, string> = {}): TechTool[] {
  if (!projects.length) return [];
  
  const validProjects = projects.filter(p => p.stack && p.stack.length > 0);
  if (validProjects.length === 0) return [];
  
  const sorted = [...validProjects]
    .sort((a, b) => {
      const aScore = (a.isHighlighted ? 2 : 0) + (a.isFavorite ? 1 : 0);
      const bScore = (b.isHighlighted ? 2 : 0) + (b.isFavorite ? 1 : 0);
      if (bScore !== aScore) return bScore - aScore;
      if (a.pushedAt && b.pushedAt) return new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime();
      return (a.order ?? 0) - (b.order ?? 0);
    })
    .slice(0, 5);
  
  const techUsages: Record<string, number> = {};
  const techCounts: Record<string, number> = {};

  for (const p of sorted) {
    const stackWithUsage = p.specs?.stackWithUsage as { name: string; usageLevel: number }[] | undefined;
    
    if (stackWithUsage && stackWithUsage.length > 0) {
      for (const tech of stackWithUsage) {
        techUsages[tech.name] = (techUsages[tech.name] || 0) + tech.usageLevel;
        techCounts[tech.name] = (techCounts[tech.name] || 0) + 1;
      }
    } else if (p.stack && p.stack.length > 0) {
      const basePerTech = Math.round(100 / p.stack.length);
      for (let i = 0; i < p.stack.length; i++) {
        const tech = p.stack[i];
        const variation = (p.name.length + tech.length + i) % 15 - 7;
        const usage = Math.min(100, Math.max(10, basePerTech + variation));
        techUsages[tech] = (techUsages[tech] || 0) + usage;
        techCounts[tech] = (techCounts[tech] || 0) + 1;
      }
    }
  }

  const result = Object.entries(techUsages)
    .map(([name, total]) => ({
      name,
      version: versionMap[name] ?? DEFAULT_VERSION_MAP[name] ?? '-',
      usageLevel: Math.round(total / techCounts[name]),
    }))
    .sort((a, b) => b.usageLevel - a.usageLevel);
  
  return result;
}

export default function TechMatrix({ tools: initialTools = [] }: TechMatrixProps) {
  const [tools, setTools] = useState<TechTool[]>(initialTools);
  const [showAll, setShowAll] = useState(false);
  const [versionMap, setVersionMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadTechStack = () => {
      const projectStored = localStorage.getItem('portfolioProjects');
      const settingsStored = localStorage.getItem('portfolioSettings');
      let versionMapObj: Record<string, string> = {};
      try {
        if (settingsStored) {
          const settings = JSON.parse(settingsStored);
          versionMapObj = settings.versionMap || {};
          setVersionMap(versionMapObj);
        }
      } catch {}

      if (projectStored) {
        const projects: Project[] = JSON.parse(projectStored);
        const derived = deriveFromProjects(projects, versionMapObj);
        if (derived.length > 0) {
          setTools(derived);
          return;
        }
      }
      // Only show initialTools if they exist and have usage, otherwise show empty
      if (initialTools.length > 0 && initialTools.some(t => t.usageLevel > 0)) {
        setTools(initialTools);
        return;
      }
      // Otherwise leave empty - don't show anything
    };

    loadTechStack();
    const handleStorageChange = (e: StorageEvent) => {
      if (['portfolioProjects', 'portfolioTechstack', 'portfolioSettings', 'lastDataUpdate'].includes(e.key ?? '')) loadTechStack();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [initialTools]);

  if (tools.length === 0) {
    return (
      <div className="border border-white/10 bg-carbono-surface p-8 text-center island-fade">
        <span className="text-[14px] text-text-faint tracking-widest">NO_TOOLS_REGISTERED</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 island-load h-full @container">
        <div className="flex items-center justify-between text-[10px] text-text-faint tracking-widest uppercase opacity-60 mb-1">
          <span>// from top 5 projects (avg)</span>
          <span className="text-cobalt font-bold">● dynamic</span>
        </div>
        {/* Usamos @container: si mide menos de 500px, apilamos de a uno */}
        <div className="grid grid-cols-1 @[500px]:grid-cols-2 gap-3">
          {tools.map((tool) => (
            <div key={tool.name} className="border border-white/10 bg-carbono p-3 flex flex-col gap-2 hover:border-cobalt/40 transition-colors">
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-bold text-white tracking-widest uppercase">{tool.name}</span>
                <span className="text-[10px] text-cobalt tracking-widest font-mono">[ {tool.usageLevel}% ]</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <ProgressBar value={tool.usageLevel} segments={12} />
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-text-faint tracking-widest italic">{tool.version || '—'}</span>
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
