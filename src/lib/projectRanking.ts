import type { Project } from '../types';

export const PROJECTS_AUTO_REFRESH_LIMIT = 5;

function parseStars(project: Project): number {
  const raw = project.specs?.stars;
  if (typeof raw !== 'string') return 0;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getManualBoost(project: Project): number {
  let boost = 0;

  if (project.isHighlighted) boost += 100;
  if (project.isFavorite) boost += 30;

  return boost;
}

function getPriorityValue(project: Project): number {
  return getManualBoost(project) + parseStars(project);
}

export function compareProjects(a: Project, b: Project): number {
  const aPriority = getPriorityValue(a);
  const bPriority = getPriorityValue(b);

  if (bPriority !== aPriority) return bPriority - aPriority;

  if (a.pushedAt && b.pushedAt) {
    const pushedDiff = new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime();
    if (pushedDiff !== 0) return pushedDiff;
  }

  return (a.order ?? 0) - (b.order ?? 0);
}

export function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort(compareProjects);
}

export function getAutoRefreshProjects(projects: Project[], limit = PROJECTS_AUTO_REFRESH_LIMIT): Project[] {
  return sortProjects(projects).slice(0, limit);
}
