import type { Project, TechTool, LogEntry, Ambition } from '../types';

// All data is loaded from /public/data/*.json
// These are kept for TypeScript compatibility only
export const projects: Project[] = [];
export const techStack: TechTool[] = [];

// Empty arrays - data comes from JSON files only
export const logs: LogEntry[] = [];
export const ambitions: Ambition[] = [];