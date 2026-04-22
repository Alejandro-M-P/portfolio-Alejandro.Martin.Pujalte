import type { Project } from '../types';

function sanitizeProject(project: Project): Project {
  const photo = typeof project.photo === 'string' && project.photo.startsWith('/projects/')
    ? ''
    : project.photo;

  return { ...project, photo };
}

export function sanitizeProjects(projects: Project[]): Project[] {
  return projects.map(sanitizeProject);
}

export function parseStoredProjects(raw: string | null, fallback: Project[] = []): Project[] {
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return fallback;
    return sanitizeProjects(parsed as Project[]);
  } catch {
    return fallback;
  }
}
