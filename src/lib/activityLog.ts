import type { LogEntry } from '../types';

const KEY = 'portfolioActivityLog';
const MAX = 40;

export function logActivity(level: LogEntry['level'], message: string): void {
  try {
    const stored = localStorage.getItem(KEY);
    const entries: LogEntry[] = stored ? JSON.parse(stored) : [];
    const entry: LogEntry = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
      level,
      message,
    };
    const updated = [entry, ...entries].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('portfolioActivityLogged'));
  } catch {}
}

export function getActivityLog(): LogEntry[] {
  try {
    const stored = localStorage.getItem(KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}
