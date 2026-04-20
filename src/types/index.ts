export interface Project {
  id: string;
  name: string;
  photo: string;
  stack: string[];
  architecture: string;
  initSequence: string;
  specs: Record<string, string | string[]>;
  isHighlighted?: boolean;
  isPrivate?: boolean;
  isFavorite?: boolean;
  pushedAt?: string;
  order?: number;
}

export interface TechTool {
  name: string;
  version: string;
  usageLevel: number; // 0-100
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERR' | 'MILESTONE';
  message: string;
}

export interface Ambition {
  id: string;
  section: 'short' | 'mid' | 'long';
  text: string;
  completed: boolean;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  period: string;
  description: string;
  tech: string[];
  url?: string;
  current?: boolean;
  impact?: string;
  logoUrl?: string;
}

export interface SiteSettings {
  availabilityValue: number;
  dustThresholdDays: number;
  starsForGold: number;
  status?: 'ONLINE' | 'OFFLINE' | 'BUSY';
  logLimit?: number;
  cvUrl?: string;
  linkedinUrl?: string;
}

export interface BuildEntry {
  buildNumber: number;
  status: 'SUCCESS' | 'FAIL';
  timestamp: string;
  files: string[];
}
