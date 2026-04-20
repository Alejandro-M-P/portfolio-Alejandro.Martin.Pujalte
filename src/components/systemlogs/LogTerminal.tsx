import React, { useEffect, useRef, useState } from 'react';
import type { LogEntry, Project } from '../../types';

const CACHE_KEY = 'portfolioGitHubLogs';
const CACHE_TS_KEY = 'portfolioGitHubLogsTs';
const PROJECTS_TS_KEY = 'portfolioProjectsRefreshTs';
const POLL_MS = 2 * 60 * 60 * 1000;
const GITHUB_TOKEN = import.meta.env.PUBLIC_GITHUB_TOKEN;

function ghHeaders(): HeadersInit {
  const h: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (GITHUB_TOKEN) h['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
  return h;
}

const levelColors: Record<LogEntry['level'], string> = {
  INFO:      'text-white',
  WARN:      'text-warn',
  ERR:       'text-err',
  MILESTONE: 'text-cobalt',
};
const levelBg: Record<LogEntry['level'], string> = {
  INFO:      '',
  WARN:      'bg-warn/5',
  ERR:       'bg-err/5',
  MILESTONE: 'bg-cobalt/5',
};

function eventToEntry(e: Record<string, unknown>, index: number): LogEntry | null {
  const repo = (e.repo as { name?: string })?.name ?? '';
  const repoShort = repo.split('/')[1] ?? repo;
  const createdAt = typeof e.created_at === 'string' ? e.created_at : '';
  const ts = createdAt.slice(0, 19).replace('T', ' ');
  const id = `gh-${e.id ?? index}`;
  const payload = e.payload as Record<string, unknown> ?? {};

  switch (e.type) {
    case 'PushEvent': {
      const commits = payload.commits as { message: string }[] ?? [];
      const count = commits.length;
      const msg = commits[0]?.message?.split('\n')[0] ?? '';
      return { id, timestamp: ts, level: 'INFO', message: `PUSH ${repoShort} — "${msg}"${count > 1 ? ` (+${count - 1})` : ''}` };
    }
    case 'PullRequestEvent': {
      const pr = payload.pull_request as { title?: string; number?: number; merged?: boolean } ?? {};
      if (payload.action === 'closed' && pr.merged)
        return { id, timestamp: ts, level: 'MILESTONE', message: `MERGED PR #${pr.number} — ${pr.title} [${repoShort}]` };
      if (payload.action === 'opened')
        return { id, timestamp: ts, level: 'INFO', message: `PR OPENED #${pr.number} — ${pr.title} [${repoShort}]` };
      return null;
    }
    case 'CreateEvent': {
      const ref = typeof payload.ref === 'string' ? payload.ref : '';
      const refType = typeof payload.ref_type === 'string' ? payload.ref_type : '';
      if (refType === 'tag') return { id, timestamp: ts, level: 'MILESTONE', message: `TAGGED ${repoShort} @ ${ref}` };
      if (refType === 'branch') return { id, timestamp: ts, level: 'INFO', message: `BRANCH CREATED ${ref} [${repoShort}]` };
      return null;
    }
    case 'DeleteEvent': {
      const ref = typeof payload.ref === 'string' ? payload.ref : '';
      const refType = typeof payload.ref_type === 'string' ? payload.ref_type : '';
      if (refType === 'branch') return { id, timestamp: ts, level: 'WARN', message: `BRANCH DELETED ${ref} [${repoShort}]` };
      return null;
    }
    case 'IssuesEvent': {
      const issue = payload.issue as { title?: string; number?: number } ?? {};
      if (payload.action === 'opened')
        return { id, timestamp: ts, level: 'WARN', message: `ISSUE #${issue.number} — ${issue.title} [${repoShort}]` };
      return null;
    }
    case 'ReleaseEvent': {
      const release = payload.release as { tag_name?: string; name?: string } ?? {};
      return { id, timestamp: ts, level: 'MILESTONE', message: `RELEASED ${release.tag_name ?? release.name} [${repoShort}]` };
    }
    default:
      return null;
  }
}

function getUsername(): string {
  try {
    const stored = localStorage.getItem('portfolioProjects');
    if (!stored) return 'Alejandro-M-P';
    const projects = JSON.parse(stored) as { specs?: Record<string, unknown> }[];
    for (const p of projects) {
      const slug = p.specs?.repoSlug as string | undefined;
      if (slug?.includes('/')) return slug.split('/')[0];
    }
  } catch {}
  return 'Alejandro-M-P';
}

async function refreshProjectsFromGitHub(): Promise<void> {
  const ts = localStorage.getItem(PROJECTS_TS_KEY);
  if (ts && Date.now() - Number(ts) < POLL_MS) return;

  try {
    const stored = localStorage.getItem('portfolioProjects');
    if (!stored) return;
    const projects: Project[] = JSON.parse(stored);
    const withRepo = projects.filter(p => p.specs?.repoSlug);
    if (withRepo.length === 0) return;

    const updated = await Promise.all(projects.map(async (project) => {
      const repoSlug = project.specs?.repoSlug as string;
      if (!repoSlug) return project;
      try {
        const res = await fetch(`https://api.github.com/repos/${repoSlug}`, { headers: ghHeaders() });
        if (!res.ok) return project;
        const r = await res.json();
        return {
          ...project,
          pushedAt: r.pushed_at ?? project.pushedAt,
          specs: {
            ...project.specs,
            stars: String(r.stargazers_count ?? project.specs?.stars ?? ''),
            language: r.language ?? project.specs?.language ?? '',
            description: r.description ?? project.specs?.description ?? '',
          },
        };
      } catch {
        return project;
      }
    }));

    localStorage.setItem('portfolioProjects', JSON.stringify(updated));
    localStorage.setItem(PROJECTS_TS_KEY, String(Date.now()));
    window.dispatchEvent(new CustomEvent('portfolioProjectsRefreshed'));
  } catch {}
}

interface LogTerminalProps {
  logs: LogEntry[];
  logLimit?: number;
  hideHeader?: boolean;
}

function getActivityLog(): LogEntry[] {
  try { return JSON.parse(localStorage.getItem('portfolioActivityLog') ?? '[]'); } catch { return []; }
}

export default function LogTerminal({ logs, logLimit = 10, hideHeader = false }: LogTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [liveEntries, setLiveEntries]     = useState<LogEntry[]>([]);
  const [activityEntries, setActivityEntries] = useState<LogEntry[]>(getActivityLog());
  const [fetching, setFetching] = useState(false);
  const [lastFetch, setLastFetch] = useState<string | null>(null);

  async function fetchGitHubActivity(skipCache = false) {
    if (!skipCache) {
      const ts = localStorage.getItem(CACHE_TS_KEY);
      const cached = localStorage.getItem(CACHE_KEY);
      if (ts && cached && Date.now() - Number(ts) < POLL_MS) {
        setLiveEntries(JSON.parse(cached));
        setLastFetch(new Date(Number(ts)).toLocaleTimeString());
        return;
      }
    }

    const username = getUsername();
    setFetching(true);
    try {
      const res = await fetch(
        `https://api.github.com/users/${username}/events/public?per_page=60`,
        { headers: ghHeaders() }
      );
      if (!res.ok) return;
      const events: Record<string, unknown>[] = await res.json();

      const stored = localStorage.getItem('portfolioProjects');
      const portfolioRepos = new Set<string>();
      if (stored) {
        const projects = JSON.parse(stored) as { specs?: Record<string, unknown> }[];
        for (const p of projects) {
          const slug = p.specs?.repoSlug as string | undefined;
          if (slug) portfolioRepos.add(slug.toLowerCase());
        }
      }

      const entries: LogEntry[] = events
        .filter(e => {
          if (portfolioRepos.size === 0) return true;
          const repoName = (e.repo as { name?: string })?.name?.toLowerCase() ?? '';
          return portfolioRepos.has(repoName) || [...portfolioRepos].some(r => repoName.endsWith(`/${r.split('/')[1] ?? ''}`));
        })
        .map((e, i) => eventToEntry(e, i))
        .filter((e): e is LogEntry => e !== null)
        .slice(0, logLimit);

      localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
      localStorage.setItem(CACHE_TS_KEY, String(Date.now()));
      setLiveEntries(entries);
      setLastFetch(new Date().toLocaleTimeString());
    } catch {}
    finally { setFetching(false); }
  }

  useEffect(() => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TS_KEY);
    fetchGitHubActivity(true);
    refreshProjectsFromGitHub();

    const interval = setInterval(() => {
      fetchGitHubActivity(false);
      refreshProjectsFromGitHub();
    }, POLL_MS);

    const onActivity = () => setActivityEntries(getActivityLog());
    window.addEventListener('portfolioActivityLogged', onActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('portfolioActivityLogged', onActivity);
    };
  }, []);

  const combined: LogEntry[] = [...logs, ...liveEntries, ...activityEntries]
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .slice(-logLimit);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [combined.length]);

  return (
    <div className={`${hideHeader ? '' : 'border border-white/10 bg-carbono-surface'} w-full flex flex-col h-full`}>
      {!hideHeader && (
        <div
          className="border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-carbono cursor-pointer hover:bg-carbono/20"
          onClick={() => window.dispatchEvent(new CustomEvent('openTerminal'))}
        >
          <span className="text-xs text-text-faint tracking-widest uppercase">SYSTEM LOGS &gt;_</span>
          <div className="flex gap-1.5 ml-auto">
            <div className="w-2 h-2 bg-err/60" />
            <div className="w-2 h-2 bg-warn/60" />
            <div className="w-2 h-2 bg-cobalt/60" />
          </div>
          {fetching
            ? <span className="text-[10px] text-warn tracking-widest animate-pulse">● FETCHING</span>
            : <span className="text-[10px] text-cobalt tracking-widest">● LIVE</span>
          }
        </div>
      )}

      <div className="px-4 py-2 border-b border-white/5 bg-carbono-low flex items-center justify-between">
        <span className="text-xs text-text-faint">
          <span className="text-cobalt">gest@portfolio ~/ </span>
          tail -f /var/log/system.log
        </span>
        {lastFetch && (
          <span className="text-[10px] text-text-faint tracking-widest">
            synced {lastFetch} · next in 2h
          </span>
        )}
      </div>

      <div ref={containerRef} className="overflow-y-auto overflow-x-hidden flex-1 min-h-0 p-3 flex flex-col gap-1">
        {combined.length === 0 ? (
          <div className="text-xs text-text-faint tracking-widest">
<span>NO RECENT ACTIVITY</span><br />
                <span className="text-cobalt">Waiting for data stream...</span>
          </div>
        ) : (
          combined.map((entry) => (
            <div key={entry.id} className={`text-xs leading-relaxed px-2 py-1 ${levelBg[entry.level]}`}>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-text-faint tabular-nums text-[10px] shrink-0">{entry.timestamp}</span>
                <span className={`font-bold text-[10px] shrink-0 ${levelColors[entry.level]}`}>[{entry.level}]</span>
              </div>
              <span className={`${levelColors[entry.level]} wrap-break-word`}>{entry.message}</span>
            </div>
          ))
        )}
        <div className="flex gap-3 text-xs mt-2">
          <span className="text-cobalt">gest@portfolio ~/ </span>
          <span className="text-white/40 animate-pulse">█</span>
        </div>
      </div>
    </div>
  );
}
