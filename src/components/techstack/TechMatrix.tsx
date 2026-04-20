import React, { useState, useEffect } from 'react';
import type { Project, TechTool } from '../../types';
import ProgressBar from '../ui/ProgressBar';

const VERSION_MAP: Record<string, string> = {
  'GO': 'v1.23+',
  'TYPESCRIPT': 'v5.3+',
  'JAVASCRIPT': 'ES2024',
  'SHELL': 'bash 5+',
  'SHELL / BASH': 'bash 5+',
  'BASH': 'bash 5+',
  'ASTRO': 'v5+',
  'REACT': 'v19+',
  'REACT NATIVE': 'v0.74+',
  'VUE': 'v3+',
  'SVELTE': 'v5+',
  'NEXT.JS': 'v14+',
  'NODE': 'v22+',
  'NODE.JS': 'v22+',
  'PYTHON': 'v3.12+',
  'RUST': 'v1.78+',
  'DOCKER': 'v26+',
  'PODMAN': 'v5+',
  'PODMAN / DOCKER': 'v5+',
  'KUBERNETES': 'v1.30+',
  'K8S': 'v1.30+',
  'DISTROBOX': 'v1.7+',
  'OLLAMA': 'latest',
  'OLLAMA / LOCAL AI': 'latest',
  'AI': 'latest',
  'MCP': 'v1.0+',
  'GIT': 'v2.45+',
  'GIT / MCP': 'v2.45+',
  'TAILWIND': 'v4+',
  'CSS': 'CSS3',
  'FIGMA': 'latest',
  'POSTGRESQL': 'v16+',
  'MYSQL': 'v8+',
  'SQLITE': 'v3+',
  'REDIS': 'v7+',
  'MONGODB': 'v7+',
};

function deriveFromProjects(projects: Project[]): TechTool[] {
  if (!projects.length) return [];

  const counts: Record<string, number> = {};
  for (const p of projects) {
    for (const tech of p.stack) {
      counts[tech] = (counts[tech] ?? 0) + 1;
    }
  }

  const total = projects.length;
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([name, count]) => ({
      name,
      version: VERSION_MAP[name] ?? '-',
      usageLevel: Math.round((count / total) * 100),
    }));
}

export default function TechMatrix() {
  const [tools, setTools] = useState<TechTool[]>([]);

  useEffect(() => {
    const loadTechStack = () => {
      // Try to load from localStorage first
      const stored = localStorage.getItem('portfolioProjects');
      if (stored) {
        const projects: Project[] = JSON.parse(stored);
        if (projects?.length) setTools(deriveFromProjects(projects));
        return;
      }
      
      // Fallback to fetch from public/data if localStorage is empty
      fetch('/data/projects.json')
        .then(r => r.ok ? r.json() : null)
        .then((projects: Project[] | null) => {
          if (projects?.length) setTools(deriveFromProjects(projects));
        })
        .catch(() => {});
    };

    // Initial load
    loadTechStack();

    // Listen for data updates from admin panel
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'portfolioProjects' || e.key === 'lastDataUpdate') {
        loadTechStack();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (!tools.length) {
    return (
      <div className="border border-white/10 bg-carbono-surface p-8 text-center">
        <span className="text-[12px] text-text-faint tracking-widest">NO_TOOLS_REGISTERED</span>
      </div>
    );
  }

  return (
    <div className="border border-white/10 bg-carbono-surface overflow-x-auto">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="border-b border-white/10 bg-carbono">
            <th className="text-left px-4 py-2.5 text-text-faint tracking-widest uppercase font-normal text-[12px]">Language / Tool</th>
            <th className="text-left px-4 py-2.5 text-text-faint tracking-widest uppercase font-normal text-[12px]">Preferred Version</th>
            <th className="text-left px-4 py-2.5 text-text-faint tracking-widest uppercase font-normal text-[12px]">Usage Level</th>
          </tr>
        </thead>
        <tbody>
          {tools.map((tool, i) => (
            <tr key={tool.name} className={`border-b border-white/5 last:border-b-0 hover:bg-white/[0.03] transition-colors ${i % 2 !== 0 ? 'bg-white/[0.015]' : ''}`}>
              <td className="px-4 py-2.5 text-white tracking-widest uppercase text-[12px]">{tool.name}</td>
              <td className="px-4 py-2.5 text-text-muted tracking-widest text-[12px]">{tool.version}</td>
              <td className="px-4 py-2.5">
                <ProgressBar value={tool.usageLevel} segments={10} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
