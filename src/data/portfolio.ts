import type { Project, TechTool, LogEntry, Ambition } from '../types';

export const identity = {
  name: 'ALEJANDRO.\nMARTIN.PUJALTE',
  handle: '@Alejandro-M-P',
  bio: 'Rigorous by nature. I learn by building — questioning assumptions, verifying everything, shipping real tools. Obsessed with systems, local AI, and getting things right.',
  quote: 'Here in the void. Building the future.',
  status: 'ONLINE' as const,
  availabilityValue: 99.9,
  links: [
    { label: 'GITHUB →', href: 'https://github.com/Alejandro-M-P' },
  ],
};

// Projects and tech stack are loaded dynamically from JSON files
// Keeping empty arrays for TypeScript compatibility
export const projects: Project[] = [];
export const techStack: TechTool[] = [];

export const logs: LogEntry[] = [
  { id: '1', timestamp: '2025-01-15 09:00:00', level: 'MILESTONE', message: 'INIT — git-courer published. 11 stars and counting.' },
  { id: '2', timestamp: '2025-02-10 14:22:10', level: 'INFO', message: 'DEPLOYED AXIOM v1.0 — Isolated GPU bunkers on Distrobox + Podman.' },
  { id: '3', timestamp: '2025-03-01 08:14:02', level: 'INFO', message: 'SHIPPED git-courer auto-install script. Zero-config setup.' },
  { id: '4', timestamp: '2025-03-20 11:45:33', level: 'WARN', message: 'Refactoring MCP protocol layer. Breaking changes ahead.' },
  { id: '5', timestamp: '2025-04-01 10:11:00', level: 'INFO', message: 'MERGED: Multi-tool AI support (Claude, Cursor, Windsurf) in git-courer.' },
  { id: '6', timestamp: '2025-04-10 16:30:00', level: 'INFO', message: 'AXIOM Vault — token security hardened with read-only volumes.' },
  { id: '7', timestamp: '2026-04-19 15:37:00', level: 'MILESTONE', message: 'PORTFOLIO V3 — Industrial Structuralism. Building in public.' },
  { id: '8', timestamp: '2026-04-20 00:00:01', level: 'INFO', message: 'hint: press Ctrl+` to open bunker terminal' },
];

export const ambitions: Ambition[] = [
  { id: 'short-1', section: 'short', text: 'Ship git-courer v2.0 with multi-model support', completed: false },
  { id: 'short-2', section: 'short', text: 'Add streaming support to MCP protocol layer', completed: false },
  { id: 'mid-1', section: 'mid', text: 'Architect a distributed local AI inference cluster', completed: false },
  { id: 'mid-2', section: 'mid', text: 'Build AXIOM GPU bunker marketplace', completed: false },
  { id: 'long-1', section: 'long', text: 'Full Digital Consciousness Transfer', completed: false },
  { id: 'long-2', section: 'long', text: 'Run a 100% local, sovereign AI development stack', completed: false },
];
