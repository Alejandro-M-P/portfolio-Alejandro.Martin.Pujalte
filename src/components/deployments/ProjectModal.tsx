import React, { useEffect, useState } from 'react';
import { marked } from 'marked';
import type { Project } from '../../types';

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

marked.use({ gfm: true, breaks: true });

async function fetchReadme(repoSlug: string): Promise<string> {
  const token = import.meta.env.PUBLIC_GITHUB_TOKEN;
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`https://api.github.com/repos/${repoSlug}/readme`, { headers });
  if (!res.ok) throw new Error(`README not found (${res.status})`);
  const data = await res.json();
  const binary = atob(data.content.replace(/\n/g, ''));
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}

type Tab = 'readme' | 'stack' | 'specs' | 'media';

const VERSION_MAP: Record<string, string> = {
  GO: 'v1.23+', TYPESCRIPT: 'v5.3+', JAVASCRIPT: 'ES2024', PYTHON: 'v3.12+',
  RUST: 'v1.78+', REACT: 'v19+', ASTRO: 'v5+', DOCKER: 'v26+',
  PODMAN: 'v5+', NODE: 'v22+', 'NODE.JS': 'v22+', SHELL: 'bash 5+',
  BASH: 'bash 5+', TAILWIND: 'v4+', CSS: 'CSS3', SWIFT: 'v5.9+',
  KOTLIN: 'v1.9+', JAVA: 'v21+', 'C#': 'v12+', 'C++': 'v20+',
};

const STATUS_STYLE: Record<string, string> = {
  IN_PROGRESS: 'text-warn border-warn/40 bg-warn/5',
  COMPLETED:   'text-cobalt border-cobalt/40 bg-cobalt/5',
  PAUSED:      'text-white/40 border-white/20 bg-white/[0.03]',
  ARCHIVED:    'text-err/60 border-err/30 bg-err/5',
};

function VideoEmbed({ url }: { url: string }) {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);

  if (ytMatch) return (
    <iframe src={`https://www.youtube.com/embed/${ytMatch[1]}`} className="w-full aspect-video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" />
  );
  if (vimeoMatch) return (
    <iframe src={`https://player.vimeo.com/video/${vimeoMatch[1]}`} className="w-full aspect-video" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen loading="lazy" />
  );
  return <video src={url} controls preload="none" className="w-full aspect-video bg-carbono" />;
}

export default function ProjectModal({ project, onClose }: ProjectModalProps) {
  const [tab, setTab] = useState<Tab>('readme');
  const [readme, setReadme] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!project) { setTab('readme'); setReadme(null); return; }
    const repoSlug = project.specs?.repoSlug as string | undefined;
    if (!repoSlug) { setTab('specs'); return; }
    setTab('readme');
    setReadme(null);
    setError(null);
    setLoading(true);
    fetchReadme(repoSlug)
      .then(md => setReadme(md))
      .catch(e => { setError(e.message); setTab('specs'); })
      .finally(() => setLoading(false));
  }, [project?.id]);

  useEffect(() => {
    if (!project) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [project, onClose]);

  if (!project) return null;

  const hasRepo = !!(project.specs?.repoSlug);
  const hasVideo = !!(project.specs?.video);
  const status = project.specs?.status as string | undefined;
  const html = readme ? marked.parse(readme) as string : '';
  const specsEntries = Object.entries(project.specs || {}).filter(([k]) => !['repoSlug', 'video', 'status'].includes(k));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="border border-white/15 bg-carbono-surface w-full max-w-3xl h-[88vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 flex-shrink-0 gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="text-[10px] text-text-faint tracking-widest flex-shrink-0">{project.id}</span>
            <span className="text-sm font-bold text-white uppercase tracking-wide truncate">{project.name}</span>
            {project.stack.map(t => (
              <span key={t} className="text-[10px] border border-white/20 px-1.5 py-0.5 text-white/50 uppercase tracking-widest">{t}</span>
            ))}
          </div>
          <button
            onClick={onClose}
            className="text-[10px] text-text-faint hover:text-white tracking-widest border border-white/15 px-2 py-1 hover:border-white/40 transition-colors duration-100 flex-shrink-0"
          >
            [ESC]
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 flex-shrink-0 flex-wrap">
          {hasRepo && (
            <button onClick={() => setTab('readme')} className={`px-5 py-2 text-xs tracking-widest uppercase transition-colors duration-100 border-b-2 ${tab === 'readme' ? 'border-cobalt text-white' : 'border-transparent text-text-faint hover:text-white'}`}>README</button>
          )}
          <button onClick={() => setTab('stack')} className={`px-5 py-2 text-xs tracking-widest uppercase transition-colors duration-100 border-b-2 ${tab === 'stack' ? 'border-cobalt text-white' : 'border-transparent text-text-faint hover:text-white'}`}>STACK</button>
          <button onClick={() => setTab('specs')} className={`px-5 py-2 text-xs tracking-widest uppercase transition-colors duration-100 border-b-2 ${tab === 'specs' ? 'border-cobalt text-white' : 'border-transparent text-text-faint hover:text-white'}`}>SPECS</button>
          {hasVideo && (
            <button onClick={() => setTab('media')} className={`px-5 py-2 text-xs tracking-widest uppercase transition-colors duration-100 border-b-2 ${tab === 'media' ? 'border-cobalt text-white' : 'border-transparent text-text-faint hover:text-white'}`}>▶ MEDIA</button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* README tab */}
          {tab === 'readme' && (
            <>
              {loading && (
                <div className="flex items-center justify-center h-32 text-xs text-text-faint tracking-widest animate-pulse">
                  FETCHING_README...
                </div>
              )}
              {!loading && readme && (
                <div
                  className="p-5 readme-content"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              )}
              {!loading && error && (
                <div className="p-5 text-xs text-err tracking-widest">{error}</div>
              )}
            </>
          )}

          {/* STACK tab */}
          {tab === 'stack' && (
            <div className="p-5 flex flex-col gap-6">
              {status && STATUS_STYLE[status] && (
                <span className={`self-start text-[11px] font-bold tracking-widest uppercase border px-3 py-1.5 ${STATUS_STYLE[status]}`}>
                  {status.replace('_', ' ')}
                </span>
              )}
              <div className="flex flex-col gap-3">
                <p className="text-[10px] text-cobalt tracking-widest uppercase">// Technologies used</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[...new Set(project.stack)].map(tech => (
                    <div key={tech} className="border border-white/15 bg-carbono px-4 py-3 flex flex-col gap-1">
                      <span className="text-sm font-bold text-white tracking-widest uppercase">{tech}</span>
                      {VERSION_MAP[tech]
                        ? <span className="text-[11px] text-cobalt tracking-widest">{VERSION_MAP[tech]}</span>
                        : <span className="text-[11px] text-text-faint tracking-widest">—</span>
                      }
                    </div>
                  ))}
                  {project.stack.length === 0 && (
                    <span className="text-xs text-text-faint tracking-widest col-span-3">NO_STACK_DEFINED</span>
                  )}
                </div>
              </div>
              {project.specs?.language && (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] text-cobalt tracking-widest uppercase">// Primary language</p>
                  <span className="text-sm font-bold text-white tracking-widest uppercase">{String(project.specs.language)}</span>
                </div>
              )}
            </div>
          )}

          {/* MEDIA tab */}
          {tab === 'media' && hasVideo && (
            <div className="p-5 flex flex-col gap-4">
              <VideoEmbed url={project.specs!.video as string} />
            </div>
          )}

          {/* SPECS tab */}
          {tab === 'specs' && (
            <div className="p-5 flex flex-col gap-5">
              <div>
                <p className="text-[10px] text-cobalt tracking-widest uppercase mb-2">// Architecture</p>
                <p className="text-xs text-text-muted leading-relaxed">{project.architecture || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] text-cobalt tracking-widest uppercase mb-2">// Init Sequence</p>
                <pre className="bg-carbono-low border border-white/10 p-3 text-xs text-text-primary leading-relaxed overflow-x-auto">{project.initSequence || 'N/A'}</pre>
              </div>
              {specsEntries.length > 0 && (
                <div>
                  <p className="text-[10px] text-cobalt tracking-widest uppercase mb-2">// Technical Specs</p>
                  <div className="border border-white/10">
                    {specsEntries.map(([key, value]) => (
                      <div key={key} className="flex border-b border-white/5 last:border-b-0">
                        <span className="text-[10px] text-text-faint tracking-widest uppercase px-3 py-2 border-r border-white/10 w-28 flex-shrink-0">{key}</span>
                        <span className="text-xs text-text-primary px-3 py-2">{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {project.specs?.repo && (
          <div className="border-t border-white/10 px-5 py-2 flex-shrink-0">
            <a
              href={`https://${project.specs.repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-cobalt tracking-widest hover:text-cobalt-light transition-colors"
            >
              → {String(project.specs.repo)}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
