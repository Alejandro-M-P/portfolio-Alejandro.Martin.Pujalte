import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Project, TechTool, Ambition, Experience, SiteSettings, BuildEntry } from '../../types';
import { logActivity } from '../../lib/activityLog';

const ADMIN_PASSWORD = import.meta.env.PUBLIC_ADMIN_PASSWORD;
const GITHUB_TOKEN = import.meta.env.PUBLIC_GITHUB_TOKEN;
const SESSION_KEY = 'admin_session';

function ghHeaders(): HeadersInit {
  const h: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (GITHUB_TOKEN) h['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
  return h;
}

/* ─── helpers ─── */

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[12px] text-text-faint tracking-widest uppercase">
        {label}{required && <span className="text-cobalt ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function CheckField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={value}
        onChange={e => onChange(e.target.checked)}
        className="accent-cobalt w-3 h-3"
      />
      <span className="text-[11px] text-text-muted tracking-widest uppercase">{label}</span>
    </label>
  );
}

function StatusMsg({ status }: { status: { type: 'success' | 'error' | 'idle'; msg: string } }) {
  if (!status.msg) return null;
  return (
    <p className={`text-[12px] tracking-widest ${status.type === 'success' ? 'text-cobalt' : 'text-err'}`}>
      {status.type === 'success' ? '✓ ' : '✗ '}{status.msg}
    </p>
  );
}

const input = "bg-carbono border border-white/20 px-4 py-3 text-[13px] text-white font-mono w-full focus:outline-none focus:border-cobalt transition-colors duration-100";

/* ─── Password gate ─── */

function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) { sessionStorage.setItem(SESSION_KEY, 'true'); onAuth(); }
    else { setErr('ACCESS_DENIED: Invalid credentials.'); setPw(''); }
  };
  return (
    <div className="min-h-screen bg-carbono flex items-center justify-center px-6" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      <div className="border border-white/10 bg-carbono-surface p-8 w-full max-w-sm flex flex-col gap-5">
        <div>
          <p className="text-[12px] text-text-faint tracking-widest mb-2">ALEJANDRO.MP // ADMIN</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">ENTER_ADMIN_ACCESS</h1>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <Field label="Password" required>
            <input type="password" value={pw} onChange={e => setPw(e.target.value)} className={input} placeholder="••••••••" autoFocus />
          </Field>
          {err && <p className="text-[12px] text-err tracking-widest">{err}</p>}
          <button type="submit" className="bg-cobalt text-white text-xs font-bold tracking-widest uppercase px-6 py-3 hover:bg-cobalt-light transition-colors">AUTHENTICATE →</button>
        </form>
      </div>
    </div>
  );
}

/* ─── Projects tab ─── */

const emptyProject = {
  id: '', name: '', gitUrl: '', photo: '', video: '',
  stack: '', architecture: '', initSequence: '',
  specs: '', specsStatus: '', specsStars: '', specsLanguage: '',
  specsLicense: '', specsDescription: '', specsRepo: '',
  specsRepoSlug: '', specsDemo: '', specsTags: '',
  isHighlighted: false, isPrivate: false, isFavorite: false,
  pushedAt: '', order: 0,
};

function ProjectsTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState(emptyProject);
  const [editing, setEditing] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle'; msg: string }>({ type: 'idle', msg: '' });
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [privateMode, setPrivateMode] = useState(false);
  const [manualReadme, setManualReadme] = useState('');
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      setStatus({ type: 'error', msg: 'IMAGEN DEMASIADO GRANDE (máx 1.5MB)' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { setForm(f => ({ ...f, photo: reader.result as string })); setPhotoFileName(file.name); };
    reader.readAsDataURL(file);
  }

  function parseReadme(raw: string): { architecture: string; description: string; stack: string[] } {
    const archMatch = raw.match(/#+\s*(architect\w*|structure|design|overview)[^\n]*\n([\s\S]*?)(?=\n#+\s|\n---|\n___|\n\*\*\*|$)/i);
    const architecture = archMatch ? archMatch[2].replace(/```[\s\S]*?```/g, '').replace(/[#*`]/g, '').trim().slice(0, 400) : '';
    const firstPara = raw.replace(/^#[^\n]*\n/, '').match(/([^\n].{20,})/);
    const description = firstPara ? firstPara[1].replace(/[#*`[\]()]/g, '').trim().slice(0, 200) : '';
    const techMatches = raw.match(/`([A-Za-z][A-Za-z0-9+#._-]{1,20})`/g) ?? [];
    const stack = [...new Set(techMatches.map(t => t.replace(/`/g, '').toUpperCase()))].slice(0, 12);
    return { architecture, description, stack };
  }

  function applyManualReadme() {
    if (!manualReadme.trim()) return;
    const { architecture, description, stack } = parseReadme(manualReadme);
    setForm(f => ({
      ...f,
      architecture: architecture || f.architecture,
      specsDescription: description || f.specsDescription,
      stack: stack.length ? stack.join(', ') : f.stack,
    }));
    setStatus({ type: 'success', msg: 'README PARSED' });
  }

  async function fetchGitHub() {
    const urlMatch = form.gitUrl.trim().match(/github\.com\/([^/]+)\/([^/\s]+)/);
    if (!urlMatch) { setStatus({ type: 'error', msg: 'INVALID_GITHUB_URL' }); return; }
    const [, owner, repoName] = urlMatch;
    const repoSlug = `${owner}/${repoName.replace(/\.git$/, '')}`;
    setScanLoading(true);
    setStatus({ type: 'idle', msg: '' });
    try {
      const base = `https://api.github.com/repos/${repoSlug}`;
      const gh = ghHeaders();
      const topicsH = { ...gh, Accept: 'application/vnd.github.mercy-preview+json' } as HeadersInit;
      const [repoRes, langsRes, topicsRes, readmeRes] = await Promise.all([
        fetch(base, { headers: gh }),
        fetch(`${base}/languages`, { headers: gh }),
        fetch(`${base}/topics`, { headers: topicsH }),
        fetch(`${base}/readme`, { headers: gh }),
      ]);
      if (repoRes.status === 404) {
        setPrivateMode(true);
        setStatus({ type: 'error', msg: 'REPO_PRIVATE — llenalo manual o pegá el README abajo' });
        setScanLoading(false); return;
      }
      if (repoRes.status === 403) {
        const reset = repoRes.headers.get('x-ratelimit-reset');
        const waitMin = reset ? Math.ceil((Number(reset) * 1000 - Date.now()) / 60000) : 60;
        setStatus({ type: 'error', msg: `RATE_LIMIT — esperá ${waitMin}min` });
        setScanLoading(false); return;
      }
      if (!repoRes.ok) throw new Error(`GitHub ${repoRes.status}`);
      const r = await repoRes.json();
      const langs: Record<string, number> = langsRes.ok ? await langsRes.json() : {};
      const topics: { names: string[] } = topicsRes.ok ? await topicsRes.json() : { names: [] };
      const allLangs = Object.keys(langs);
      let architecture = '';
      if (readmeRes.ok) {
        const readmeData = await readmeRes.json();
        const raw = atob(readmeData.content?.replace(/\n/g, '') ?? '');
        architecture = parseReadme(raw).architecture;
      }
      const autoName = r.name?.toUpperCase().replace(/-/g, '_') ?? '';
      setForm(f => ({
        ...f,
        id: f.id || autoName.slice(0, 20),
        name: autoName || f.name,
        photo: f.photo || `https://opengraph.githubassets.com/1/${repoSlug}`,
        specsDescription: r.description ?? f.specsDescription,
        specsLanguage: r.language ?? allLangs[0] ?? f.specsLanguage,
        specsLicense: r.license?.spdx_id ?? f.specsLicense,
        specsStars: String(r.stargazers_count ?? ''),
        specsRepo: r.html_url ?? f.specsRepo,
        specsRepoSlug: repoSlug,
        specsDemo: r.homepage || f.specsDemo,
        specsTags: topics.names?.join(', ') || f.specsTags,
        stack: allLangs.map((l: string) => l.toUpperCase()).join(', '),
        architecture: architecture || f.architecture,
        specsStatus: r.archived ? 'ARCHIVED' : 'PROD',
        pushedAt: r.pushed_at ?? f.pushedAt,
      }));
      setPrivateMode(false);
      setStatus({ type: 'success', msg: `SCANNED: ${repoSlug} — ${allLangs.length} langs` });
    } catch (e: unknown) {
      setStatus({ type: 'error', msg: e instanceof Error ? e.message : 'SCAN_FAILED' });
    } finally { setScanLoading(false); }
  }

  const load = useCallback(async () => {
    try {
      const stored = localStorage.getItem('portfolioProjects');
      if (stored) { setProjects(JSON.parse(stored)); return; }
      const res = await fetch('/data/projects.json');
      if (res.ok) {
        const content = await res.json();
        setProjects(content);
        localStorage.setItem('portfolioProjects', JSON.stringify(content));
      }
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  function select(p: Project) {
    setEditing(p.id);
    setForm({
      id: p.id, name: p.name,
      gitUrl: (p.specs?.repo as string) ?? '',
      photo: p.photo, video: (p.specs?.video as string) ?? '',
      stack: p.stack.join(', '), architecture: p.architecture,
      initSequence: p.initSequence,
      specsStatus: (p.specs?.status as string) ?? '',
      specsStars: (p.specs?.stars as string) ?? '',
      specsLanguage: (p.specs?.language as string) ?? '',
      specsLicense: (p.specs?.license as string) ?? '',
      specsDescription: (p.specs?.description as string) ?? '',
      specsRepo: (p.specs?.repo as string) ?? '',
      specsRepoSlug: (p.specs?.repoSlug as string) ?? '',
      specsDemo: (p.specs?.demo as string) ?? '',
      specsTags: Array.isArray(p.specs?.tags) ? (p.specs?.tags as string[]).join(', ') : '',
      specs: '',
      isHighlighted: p.isHighlighted ?? false,
      isPrivate: p.isPrivate ?? false,
      isFavorite: p.isFavorite ?? false,
      pushedAt: p.pushedAt ?? '',
      order: p.order ?? 0,
    });
    setStatus({ type: 'idle', msg: '' });
  }

  function clear() { setEditing(null); setForm(emptyProject); setStatus({ type: 'idle', msg: '' }); }

  function parse(): Project | null {
    if (!form.name.trim()) { setStatus({ type: 'error', msg: 'TITLE_REQUIRED' }); return null; }
    const specs: Record<string, string | string[]> = {};
    if (form.specsStatus?.trim()) specs.status = form.specsStatus.trim();
    if (form.specsStars?.trim()) specs.stars = form.specsStars.trim();
    if (form.specsLanguage?.trim()) specs.language = form.specsLanguage.trim();
    if (form.specsLicense?.trim()) specs.license = form.specsLicense.trim();
    if (form.specsDescription?.trim()) specs.description = form.specsDescription.trim();
    if (form.specsRepo?.trim()) specs.repo = form.specsRepo.trim();
    if (form.specsRepoSlug?.trim()) specs.repoSlug = form.specsRepoSlug.trim();
    if (form.specsDemo?.trim()) specs.demo = form.specsDemo.trim();
    if (form.specsTags?.trim()) specs.tags = form.specsTags.split(',').map(t => t.trim()).filter(Boolean);
    if (form.video?.trim()) specs.video = form.video.trim();
    if (!specs.repo && form.gitUrl.trim()) {
      specs.repo = form.gitUrl.trim();
      const urlMatch = form.gitUrl.trim().match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (urlMatch && !specs.repoSlug) specs.repoSlug = `${urlMatch[1]}/${urlMatch[2]}`;
    }
    return {
      id: form.id || String(Date.now()),
      name: form.name.trim().toUpperCase(),
      photo: form.photo.trim(),
      stack: form.stack.split(',').map(s => s.trim().toUpperCase()).filter(Boolean),
      architecture: form.architecture.trim(),
      initSequence: form.initSequence.trim(),
      specs,
      isHighlighted: form.isHighlighted,
      isPrivate: form.isPrivate,
      isFavorite: form.isFavorite,
      pushedAt: form.pushedAt || undefined,
      order: Number(form.order) || 0,
    };
  }

  async function save() {
    const p = parse(); if (!p) return;
    setLoading(true);
    try {
      const updated = editing ? projects.map(x => x.id === editing ? p : x) : [...projects, p];
      setProjects(updated);
      localStorage.setItem('portfolioProjects', JSON.stringify(updated));
      sessionStorage.setItem('lastDataUpdate', Date.now().toString());
      setStatus({ type: 'success', msg: editing ? 'PROJECT_UPDATED' : 'PROJECT_CREATED' });
      logActivity('INFO', editing ? `PROJECT_UPDATED ${p.id}` : `PROJECT_ADDED ${p.id} — ${p.name}`);
      clear(); await load();
    } catch (e: unknown) {
      setStatus({ type: 'error', msg: e instanceof Error ? e.message : 'SAVE_FAILED' });
    } finally { setLoading(false); }
  }

  async function del(id: string) {
    setLoading(true);
    try {
      const updated = projects.filter(p => p.id !== id);
      setProjects(updated);
      localStorage.setItem('portfolioProjects', JSON.stringify(updated));
      sessionStorage.setItem('lastDataUpdate', Date.now().toString());
      setStatus({ type: 'success', msg: 'PROJECT_DELETED' });
      logActivity('WARN', `PROJECT_REMOVED ${id}`);
      setConfirm(null); clear(); await load();
    } catch (e: unknown) {
      setStatus({ type: 'error', msg: e instanceof Error ? e.message : 'DELETE_FAILED' });
    } finally { setLoading(false); }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
      {/* List */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <p className="text-[12px] text-text-faint tracking-widest uppercase">Projects ({projects.length})</p>
          <button onClick={clear} className="text-[12px] text-cobalt tracking-widest hover:text-cobalt-light">+ NEW</button>
        </div>
        {projects.map(p => (
          <button key={p.id} onClick={() => select(p)} className={`text-left border px-3 py-2 text-xs transition-colors relative ${editing === p.id ? 'border-cobalt bg-cobalt/5 text-white' : 'border-white/10 bg-carbono-surface text-text-muted hover:border-white/20 hover:text-white'}`}>
            <div className="flex items-center gap-1">
              {p.isFavorite && <span className="text-bronze text-[8px]">★</span>}
              {p.isHighlighted && <span className="text-bronze text-[8px]">◈</span>}
              {p.isPrivate && <span className="text-err/60 text-[8px]">🔒</span>}
              <span className="text-text-faint text-[11px]">{p.id}</span>
            </div>
            <span className="text-[11px]">{p.name}</span>
          </button>
        ))}
        {projects.length === 0 && <p className="text-[12px] text-text-faint tracking-widest px-2">NO_PROJECTS</p>}
      </div>

      {/* Form */}
      <div className="border border-white/10 bg-carbono-surface p-4 flex flex-col gap-3">
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <p className="text-xs font-bold text-white tracking-widest">{editing ? `EDIT: ${form.name || editing}` : 'CREATE_PROJECT'}</p>
          {editing && <button onClick={clear} className="text-[12px] text-text-faint hover:text-white">CANCEL</button>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="ID" required><input value={form.id} onChange={e => setForm(f => ({ ...f, id: e.target.value }))} className={input} placeholder="01_MY_PROJECT" /></Field>
          <Field label="Name" required><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={input} placeholder="MY_PROJECT" /></Field>
        </div>

        <Field label="Git URL">
          <div className="flex gap-2">
            <input value={form.gitUrl} onChange={e => { setForm(f => ({ ...f, gitUrl: e.target.value })); setPrivateMode(false); }} className={`${input} flex-1`} placeholder="https://github.com/user/repo" />
            <button type="button" onClick={fetchGitHub} disabled={scanLoading || !form.gitUrl.includes('github.com')} className="bg-cobalt/20 border border-cobalt/40 text-cobalt text-[11px] font-bold tracking-widest uppercase px-3 hover:bg-cobalt/30 disabled:opacity-30 transition-colors flex-shrink-0">
              {scanLoading ? '...' : 'SCAN'}
            </button>
            <button type="button" onClick={() => setPrivateMode(p => !p)} className={`border text-[11px] font-bold tracking-widest uppercase px-3 transition-colors flex-shrink-0 ${privateMode ? 'border-warn/60 text-warn bg-warn/10' : 'border-white/20 text-text-faint hover:text-white'}`}>PRIV</button>
          </div>
        </Field>

        {privateMode && (
          <div className="border border-warn/20 bg-warn/5 p-3 flex flex-col gap-2">
            <p className="text-[11px] text-warn tracking-widest uppercase">MODO MANUAL — pegá el README acá</p>
            <textarea value={manualReadme} onChange={e => setManualReadme(e.target.value)} className={`${input} h-28 resize-none text-[11px]`} placeholder="Pegá el README.md acá..." />
            <button type="button" onClick={applyManualReadme} disabled={!manualReadme.trim()} className="self-start bg-warn/20 border border-warn/40 text-warn text-[11px] font-bold tracking-widest uppercase px-4 py-1.5 hover:bg-warn/30 disabled:opacity-30 transition-colors">PARSE README →</button>
          </div>
        )}

        {/* Visual flags */}
        <div className="border border-white/10 bg-carbono p-3 flex flex-col gap-2">
          <p className="text-[10px] text-text-faint tracking-widest uppercase mb-1">VISUAL FLAGS</p>
          <div className="flex flex-wrap gap-5">
            <CheckField label="Highlighted (Oro/Bronce)" value={form.isHighlighted} onChange={v => setForm(f => ({ ...f, isHighlighted: v }))} />
            <CheckField label="Private (Redacted)" value={form.isPrivate} onChange={v => setForm(f => ({ ...f, isPrivate: v }))} />
            <CheckField label="Favorito (Pinned)" value={form.isFavorite} onChange={v => setForm(f => ({ ...f, isFavorite: v }))} />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-1">
            <Field label="Pushed At (ISO)">
              <input value={form.pushedAt} onChange={e => setForm(f => ({ ...f, pushedAt: e.target.value }))} className={input} placeholder="2026-01-15T10:30:00Z" />
            </Field>
            <Field label="Order (favoritos)">
              <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} className={input} placeholder="0" />
            </Field>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Foto">
            <div className="flex gap-1">
              <input value={form.photo.startsWith('data:') ? (photoFileName ?? '[imagen subida]') : form.photo} onChange={e => { setForm(f => ({ ...f, photo: e.target.value })); setPhotoFileName(null); }} className={`${input} flex-1`} placeholder="URL o subí archivo →" />
              {form.specsRepoSlug && (
                <button type="button" onClick={() => { setForm(f => ({ ...f, photo: `https://opengraph.githubassets.com/1/${f.specsRepoSlug}` })); setPhotoFileName(null); }} className="border border-cobalt/40 text-cobalt text-[10px] font-bold tracking-widest uppercase px-2 hover:bg-cobalt/20 transition-colors flex-shrink-0">GH</button>
              )}
              <button type="button" onClick={() => photoInputRef.current?.click()} className="border border-white/20 text-text-faint text-[10px] font-bold tracking-widest uppercase px-2 hover:text-white hover:border-white/40 transition-colors flex-shrink-0">↑</button>
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>
            {form.photo && (
              <img src={form.photo} alt="preview" className="mt-1 h-16 w-full object-cover border border-white/10 opacity-70" onError={e => (e.currentTarget.style.display = 'none')} />
            )}
          </Field>
          <Field label="Stack (CSV)"><input value={form.stack} onChange={e => setForm(f => ({ ...f, stack: e.target.value }))} className={input} placeholder="GO, REACT, DOCKER" /></Field>
        </div>

        <Field label="Video"><input value={form.video || ''} onChange={e => setForm(f => ({ ...f, video: e.target.value }))} className={input} placeholder="YouTube, Vimeo, o /projects/demo.mp4" /></Field>
        <Field label="Architecture"><textarea value={form.architecture} onChange={e => setForm(f => ({ ...f, architecture: e.target.value }))} className={`${input} h-16 resize-none`} /></Field>
        <Field label="Init Sequence"><textarea value={form.initSequence} onChange={e => setForm(f => ({ ...f, initSequence: e.target.value }))} className={`${input} h-14 resize-none`} /></Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Status">
            <select value={form.specsStatus || ''} onChange={e => setForm(f => ({ ...f, specsStatus: e.target.value }))} className={input}>
              <option value="">— sin estado —</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="PAUSED">PAUSED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </Field>
          <Field label="Stars"><input value={form.specsStars || ''} onChange={e => setForm(f => ({ ...f, specsStars: e.target.value }))} className={input} placeholder="11" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Language"><input value={form.specsLanguage || ''} onChange={e => setForm(f => ({ ...f, specsLanguage: e.target.value }))} className={input} placeholder="Go" /></Field>
          <Field label="License"><input value={form.specsLicense || ''} onChange={e => setForm(f => ({ ...f, specsLicense: e.target.value }))} className={input} placeholder="MIT" /></Field>
        </div>
        <Field label="Description"><input value={form.specsDescription || ''} onChange={e => setForm(f => ({ ...f, specsDescription: e.target.value }))} className={input} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Repo URL"><input value={form.specsRepo || ''} onChange={e => setForm(f => ({ ...f, specsRepo: e.target.value }))} className={input} /></Field>
          <Field label="Repo Slug"><input value={form.specsRepoSlug || ''} onChange={e => setForm(f => ({ ...f, specsRepoSlug: e.target.value }))} className={input} placeholder="user/repo" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Demo URL"><input value={form.specsDemo || ''} onChange={e => setForm(f => ({ ...f, specsDemo: e.target.value }))} className={input} /></Field>
          <Field label="Tags (CSV)"><input value={form.specsTags || ''} onChange={e => setForm(f => ({ ...f, specsTags: e.target.value }))} className={input} /></Field>
        </div>

        <StatusMsg status={status} />
        <div className="flex gap-2">
          <button onClick={save} disabled={loading} className="flex-1 bg-cobalt text-white text-[12px] font-bold tracking-widest uppercase py-3 hover:bg-cobalt-light disabled:opacity-40 transition-colors">
            {loading ? 'PROCESANDO...' : editing ? 'ACTUALIZAR PROYECTO' : 'CREAR PROYECTO'}
          </button>
          {editing && <button onClick={() => setConfirm(editing)} className="border border-err/40 text-err text-[12px] font-bold tracking-widest uppercase px-4 hover:bg-err/5 transition-colors">ELIMINAR</button>}
        </div>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="border border-err/30 bg-carbono-surface p-6 max-w-sm w-full mx-4 flex flex-col gap-4">
            <p className="text-sm font-bold text-white">CONFIRM_DELETE</p>
            <p className="text-xs text-text-muted">Project <span className="text-err">{confirm}</span> will be permanently removed.</p>
            <div className="flex gap-2">
              <button onClick={() => del(confirm)} disabled={loading} className="flex-1 bg-err text-white text-xs font-bold tracking-widest uppercase py-2.5">{loading ? 'DELETING...' : 'CONFIRM'}</button>
              <button onClick={() => setConfirm(null)} className="flex-1 border border-white/20 text-white text-xs font-bold tracking-widest uppercase py-2.5">CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Tech Stack tab ─── */

const emptyTool = { name: '', version: '', usageLevel: 80 };

function TechTab() {
  const [tools, setTools] = useState<TechTool[]>([]);
  const [form, setForm] = useState(emptyTool);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle'; msg: string }>({ type: 'idle', msg: '' });
  const [loading, setLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [calcLoading, setCalcLoading] = useState(false);

  function calcFromProjects() {
    const stored = localStorage.getItem('portfolioProjects');
    if (!stored) { setStatus({ type: 'error', msg: 'NO_PROJECTS_FOUND' }); return; }
    const projects = JSON.parse(stored) as { stack?: string[] }[];
    if (!projects.length) { setStatus({ type: 'error', msg: 'NO_PROJECTS' }); return; }
    setCalcLoading(true);
    const counts: Record<string, number> = {};
    for (const p of projects) {
      for (const tech of (p.stack ?? [])) {
        counts[tech] = (counts[tech] ?? 0) + 1;
      }
    }
    const total = projects.length;
    const derived = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, count]) => ({
        name: name.toUpperCase(),
        version: '',
        usageLevel: Math.round((count / total) * 100),
      }));
    setTools(derived);
    localStorage.setItem('portfolioTechstack', JSON.stringify(derived));
    window.dispatchEvent(new CustomEvent('portfolioTechstackChanged'));
    setStatus({ type: 'success', msg: `CALCULATED — ${derived.length} techs from ${total} projects` });
    setCalcLoading(false);
  }

  async function scanAllRepos() {
    const stored = localStorage.getItem('portfolioProjects');
    if (!stored) { setStatus({ type: 'error', msg: 'NO_PROJECTS_FOUND' }); return; }
    const projects = JSON.parse(stored) as { specs?: Record<string, unknown> }[];
    const slugs = projects.map(p => p.specs?.repoSlug as string).filter(Boolean);
    if (slugs.length === 0) { setStatus({ type: 'error', msg: 'NO_REPOS_IN_PROJECTS' }); return; }
    setScanLoading(true);
    try {
      const langResults = await Promise.all(
        slugs.map(slug => fetch(`https://api.github.com/repos/${slug}/languages`, { headers: ghHeaders() }).then(r => r.ok ? r.json() : {}))
      );
      const totals: Record<string, number> = {};
      for (const langs of langResults) {
        for (const [lang, bytes] of Object.entries(langs as Record<string, number>)) {
          totals[lang] = (totals[lang] ?? 0) + bytes;
        }
      }
      const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
      const maxBytes = sorted[0]?.[1] ?? 1;
      const existingNames = new Set(tools.map(t => t.name.toUpperCase()));
      const newTools: TechTool[] = sorted.map(([lang, bytes]) => ({ name: lang.toUpperCase(), version: '', usageLevel: Math.round((bytes / maxBytes) * 100) }));
      const merged = [
        ...tools.map(t => { const found = newTools.find(n => n.name === t.name.toUpperCase()); return found ? { ...t, usageLevel: found.usageLevel } : t; }),
        ...newTools.filter(n => !existingNames.has(n.name)),
      ];
      setTools(merged);
      localStorage.setItem('portfolioTechstack', JSON.stringify(merged));
      setStatus({ type: 'success', msg: `SCANNED ${slugs.length} REPOS — ${sorted.length} LANGS DETECTED` });
    } catch (e: unknown) {
      setStatus({ type: 'error', msg: e instanceof Error ? e.message : 'SCAN_FAILED' });
    } finally { setScanLoading(false); }
  }

  const load = useCallback(async () => {
    const stored = localStorage.getItem('portfolioTechstack');
    if (stored) { setTools(JSON.parse(stored)); return; }
    const res = await fetch('/data/techstack.json');
    if (res.ok) { const content = await res.json(); setTools(content); localStorage.setItem('portfolioTechstack', JSON.stringify(content)); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!form.name.trim()) { setStatus({ type: 'error', msg: 'NAME_REQUIRED' }); return; }
    const tool: TechTool = { name: form.name.trim().toUpperCase(), version: form.version.trim(), usageLevel: Number(form.usageLevel) };
    setLoading(true);
    try {
      const updated = editIdx !== null ? tools.map((t, i) => i === editIdx ? tool : t) : [...tools, tool];
      setTools(updated);
      localStorage.setItem('portfolioTechstack', JSON.stringify(updated));
      setStatus({ type: 'success', msg: editIdx !== null ? 'TOOL_UPDATED' : 'TOOL_ADDED' });
      setForm(emptyTool); setEditIdx(null); await load();
    } catch (e: unknown) {
      setStatus({ type: 'error', msg: e instanceof Error ? e.message : 'SAVE_FAILED' });
    } finally { setLoading(false); }
  }

  async function del(idx: number) {
    setLoading(true);
    try {
      const updated = tools.filter((_, i) => i !== idx);
      setTools(updated);
      localStorage.setItem('portfolioTechstack', JSON.stringify(updated));
      setStatus({ type: 'success', msg: 'TOOL_DELETED' }); await load();
    } catch (e: unknown) {
      setStatus({ type: 'error', msg: e instanceof Error ? e.message : 'DELETE_FAILED' });
    } finally { setLoading(false); }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-text-faint tracking-widest uppercase">Tools ({tools.length})</p>
        <div className="flex gap-2">
          <button onClick={calcFromProjects} disabled={calcLoading} className="bg-cobalt/10 border border-cobalt/30 text-cobalt text-[11px] font-bold tracking-widest uppercase px-3 py-1.5 hover:bg-cobalt/20 disabled:opacity-30 transition-colors">
            {calcLoading ? 'CALCULATING...' : 'CALC_FROM_PROJECTS'}
          </button>
          <button onClick={scanAllRepos} disabled={scanLoading} className="bg-cobalt/20 border border-cobalt/40 text-cobalt text-[11px] font-bold tracking-widest uppercase px-4 py-1.5 hover:bg-cobalt/30 disabled:opacity-30 transition-colors">
            {scanLoading ? 'SCANNING...' : 'SCAN_REPOS →'}
          </button>
        </div>
      </div>
      <div className="border border-white/10 bg-carbono-surface overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead><tr className="border-b border-white/10 bg-carbono">
            <th className="text-left px-3 py-2 text-[12px] text-text-faint tracking-widest font-normal uppercase">Tool</th>
            <th className="text-left px-3 py-2 text-[12px] text-text-faint tracking-widest font-normal uppercase">Version</th>
            <th className="text-left px-3 py-2 text-[12px] text-text-faint tracking-widest font-normal uppercase">Usage %</th>
            <th className="px-3 py-2"></th>
          </tr></thead>
          <tbody>
            {tools.map((t, i) => (
              <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                <td className="px-3 py-2 text-white uppercase">{t.name}</td>
                <td className="px-3 py-2 text-text-muted">{t.version}</td>
                <td className="px-3 py-2 text-cobalt">{t.usageLevel}%</td>
                <td className="px-3 py-2 flex gap-2 justify-end">
                  <button onClick={() => { setEditIdx(i); setForm({ name: t.name, version: t.version, usageLevel: t.usageLevel }); }} className="text-[12px] text-text-faint hover:text-white tracking-widest">EDIT</button>
                  <button onClick={() => del(i)} className="text-[10px] text-err/60 hover:text-err tracking-widest">DEL</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border border-white/10 bg-carbono-surface p-4 flex flex-col gap-3">
        <p className="text-xs font-bold text-white tracking-widest border-b border-white/10 pb-2">{editIdx !== null ? 'EDIT_TOOL' : 'ADD_TOOL'}</p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Name" required><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={input} placeholder="TYPESCRIPT" /></Field>
          <Field label="Version"><input value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} className={input} placeholder="v5.3+" /></Field>
          <Field label="Usage (0-100)"><input type="number" min={0} max={100} value={form.usageLevel} onChange={e => setForm(f => ({ ...f, usageLevel: Number(e.target.value) }))} className={input} /></Field>
        </div>
        <StatusMsg status={status} />
        <div className="flex gap-2">
          <button onClick={save} disabled={loading} className="flex-1 bg-cobalt text-white text-xs font-bold tracking-widest uppercase py-2.5 hover:bg-cobalt-light disabled:opacity-40 transition-colors">
            {loading ? 'PROCESSING...' : editIdx !== null ? 'UPDATE_TOOL' : 'ADD_TOOL'}
          </button>
          {editIdx !== null && <button onClick={() => { setEditIdx(null); setForm(emptyTool); }} className="border border-white/20 text-white text-xs tracking-widest uppercase px-4">CANCEL</button>}
        </div>
      </div>
    </div>
  );
}

/* ─── Ambitions tab ─── */

const sectionLabels: Record<string, string> = { short: 'SHORT_TERM', mid: 'MID_TERM', long: 'LONG_TERM' };
const emptyAmbition = { text: '', section: 'short' as Ambition['section'] };

function AmbitionsTab() {
  const [items, setItems] = useState<Ambition[]>([]);
  const [form, setForm] = useState(emptyAmbition);
  const [editId, setEditId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle'; msg: string }>({ type: 'idle', msg: '' });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const stored = localStorage.getItem('portfolioAmbitions');
    if (stored) { setItems(JSON.parse(stored)); return; }
    const res = await fetch('/data/ambitions.json');
    if (res.ok) { const content = await res.json(); setItems(content); localStorage.setItem('portfolioAmbitions', JSON.stringify(content)); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!form.text.trim()) { setStatus({ type: 'error', msg: 'TEXT_REQUIRED' }); return; }
    const item: Ambition = { id: editId ?? `${form.section}-${Date.now()}`, section: form.section, text: form.text.trim(), completed: false };
    setLoading(true);
    try {
      const updated = editId ? items.map(a => a.id === editId ? item : a) : [...items, item];
      setItems(updated);
      localStorage.setItem('portfolioAmbitions', JSON.stringify(updated));
      setStatus({ type: 'success', msg: editId ? 'UPDATED' : 'ADDED' });
      setForm(emptyAmbition); setEditId(null); await load();
    } catch (e: unknown) {
      setStatus({ type: 'error', msg: e instanceof Error ? e.message : 'SAVE_FAILED' });
    } finally { setLoading(false); }
  }

  async function del(id: string) {
    setLoading(true);
    try {
      const updated = items.filter(a => a.id !== id);
      setItems(updated);
      localStorage.setItem('portfolioAmbitions', JSON.stringify(updated));
      setStatus({ type: 'success', msg: 'DELETED' }); await load();
    } catch (e: unknown) {
      setStatus({ type: 'error', msg: e instanceof Error ? e.message : 'DELETE_FAILED' });
    } finally { setLoading(false); }
  }

  return (
    <div className="flex flex-col gap-4">
      {(['short', 'mid', 'long'] as const).map(section => (
        <div key={section} className="border border-white/10 bg-carbono-surface">
          <div className="border-b border-white/10 px-4 py-2 bg-carbono">
            <p className="text-[10px] text-cobalt tracking-widest font-bold">{sectionLabels[section]}</p>
          </div>
          <div className="flex flex-col">
            {items.filter(a => a.section === section).map(a => (
              <div key={a.id} className="flex items-center justify-between px-4 py-2 border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                <span className={`text-xs ${a.completed ? 'line-through text-text-faint' : 'text-text-muted'}`}>{a.text}</span>
                <div className="flex gap-3 flex-shrink-0 ml-3">
                  <button onClick={() => { setEditId(a.id); setForm({ text: a.text, section: a.section }); }} className="text-[10px] text-text-faint hover:text-white tracking-widest">EDIT</button>
                  <button onClick={() => del(a.id)} className="text-[10px] text-err/60 hover:text-err tracking-widest">DEL</button>
                </div>
              </div>
            ))}
            {items.filter(a => a.section === section).length === 0 && <p className="text-[10px] text-text-faint px-4 py-3 tracking-widest">EMPTY</p>}
          </div>
        </div>
      ))}
      <div className="border border-white/10 bg-carbono-surface p-4 flex flex-col gap-3">
        <p className="text-xs font-bold text-white tracking-widest border-b border-white/10 pb-2">{editId ? 'EDIT_AMBITION' : 'ADD_AMBITION'}</p>
        <div className="grid grid-cols-[1fr_140px] gap-3">
          <Field label="Goal text" required><input value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} className={input} placeholder="Master WebGPU Rendering" /></Field>
          <Field label="Section">
            <select value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value as Ambition['section'] }))} className={input}>
              <option value="short">SHORT_TERM</option>
              <option value="mid">MID_TERM</option>
              <option value="long">LONG_TERM</option>
            </select>
          </Field>
        </div>
        <StatusMsg status={status} />
        <div className="flex gap-2">
          <button onClick={save} disabled={loading} className="flex-1 bg-cobalt text-white text-xs font-bold tracking-widest uppercase py-2.5 hover:bg-cobalt-light disabled:opacity-40 transition-colors">
            {loading ? 'PROCESSING...' : editId ? 'UPDATE' : 'ADD'}
          </button>
          {editId && <button onClick={() => { setEditId(null); setForm(emptyAmbition); }} className="border border-white/20 text-white text-xs tracking-widest uppercase px-4">CANCEL</button>}
        </div>
      </div>
    </div>
  );
}

/* ─── Experience tab ─── */

const emptyExp: Omit<Experience, 'id'> = { company: '', role: '', period: '', description: '', tech: [], url: '', current: false, impact: '', logoUrl: '' };

function ExperienceTab() {
  const [items, setItems] = useState<Experience[]>([]);
  const [form, setForm] = useState<Omit<Experience, 'id'> & { techStr: string }>({ ...emptyExp, techStr: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle'; msg: string }>({ type: 'idle', msg: '' });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const stored = localStorage.getItem('portfolioExperience');
    if (stored) { setItems(JSON.parse(stored)); return; }
    const res = await fetch('/data/experience.json');
    if (res.ok) { const data = await res.json(); setItems(data); localStorage.setItem('portfolioExperience', JSON.stringify(data)); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function select(exp: Experience) {
    setEditId(exp.id);
    setForm({ company: exp.company, role: exp.role, period: exp.period, description: exp.description, tech: exp.tech, url: exp.url ?? '', current: exp.current ?? false, impact: exp.impact ?? '', logoUrl: exp.logoUrl ?? '', techStr: exp.tech.join(', ') });
    setStatus({ type: 'idle', msg: '' });
  }

  function clear() { setEditId(null); setForm({ ...emptyExp, techStr: '' }); setStatus({ type: 'idle', msg: '' }); }

  async function save() {
    if (!form.company.trim() || !form.role.trim()) { setStatus({ type: 'error', msg: 'COMPANY y ROLE requeridos' }); return; }
    const exp: Experience = { id: editId ?? String(Date.now()), company: form.company.trim().toUpperCase(), role: form.role.trim(), period: form.period.trim(), description: form.description.trim(), tech: form.techStr.split(',').map(t => t.trim().toUpperCase()).filter(Boolean), url: form.url?.trim() || undefined, current: form.current, impact: form.impact?.trim() || undefined, logoUrl: form.logoUrl?.trim() || undefined };
    setLoading(true);
    try {
      const updated = editId ? items.map(x => x.id === editId ? exp : x) : [...items, exp];
      setItems(updated);
      localStorage.setItem('portfolioExperience', JSON.stringify(updated));
      setStatus({ type: 'success', msg: editId ? 'UPDATED' : 'ADDED' });
      clear(); await load();
    } catch (e: unknown) { setStatus({ type: 'error', msg: e instanceof Error ? e.message : 'SAVE_FAILED' }); }
    finally { setLoading(false); }
  }

  async function del(id: string) {
    setLoading(true);
    try {
      const updated = items.filter(x => x.id !== id);
      setItems(updated);
      localStorage.setItem('portfolioExperience', JSON.stringify(updated));
      setStatus({ type: 'success', msg: 'DELETED' }); clear(); await load();
    } catch (e: unknown) { setStatus({ type: 'error', msg: e instanceof Error ? e.message : 'DELETE_FAILED' }); }
    finally { setLoading(false); }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <p className="text-[12px] text-text-faint tracking-widest uppercase">Experience ({items.length})</p>
          <button onClick={clear} className="text-[12px] text-cobalt tracking-widest hover:text-cobalt-light">+ NEW</button>
        </div>
        {items.map(exp => (
          <button key={exp.id} onClick={() => select(exp)} className={`text-left border px-3 py-2 text-xs transition-colors ${editId === exp.id ? 'border-cobalt bg-cobalt/5 text-white' : 'border-white/10 bg-carbono-surface text-text-muted hover:border-white/20 hover:text-white'}`}>
            <p className="font-bold text-[11px] uppercase">{exp.company}</p>
            <p className="text-[10px] text-text-faint">{exp.role}</p>
          </button>
        ))}
        {items.length === 0 && <p className="text-[12px] text-text-faint tracking-widest px-2">NO_EXPERIENCE</p>}
      </div>
      <div className="border border-white/10 bg-carbono-surface p-4 flex flex-col gap-3">
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <p className="text-xs font-bold text-white tracking-widest">{editId ? `EDIT: ${form.company || editId}` : 'ADD_EXPERIENCE'}</p>
          {editId && <button onClick={clear} className="text-[12px] text-text-faint hover:text-white">CANCEL</button>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Company" required><input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className={input} placeholder="ACME CORP" /></Field>
          <Field label="Role" required><input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className={input} placeholder="Senior Engineer" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Period"><input value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))} className={input} placeholder="2022 — Present" /></Field>
          <Field label="URL (opcional)"><input value={form.url || ''} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} className={input} placeholder="https://company.com" /></Field>
        </div>
        <Field label="Description"><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={`${input} h-16 resize-none`} placeholder="Qué hiciste, qué resolviste..." /></Field>
        <Field label="Impact (para recruiters no técnicos)"><textarea value={form.impact ?? ''} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))} className={`${input} h-14 resize-none`} placeholder="Reducí el deploy time un 60%, coordiné un equipo de 5..." /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tech (CSV)"><input value={form.techStr} onChange={e => setForm(f => ({ ...f, techStr: e.target.value }))} className={input} placeholder="GO, REACT, DOCKER" /></Field>
          <Field label="Logo URL (opcional)"><input value={form.logoUrl ?? ''} onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))} className={input} placeholder="https://company.com/logo.png" /></Field>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="current" checked={form.current ?? false} onChange={e => setForm(f => ({ ...f, current: e.target.checked }))} className="accent-cobalt" />
          <label htmlFor="current" className="text-[12px] text-text-muted tracking-widest">Trabajo actual</label>
        </div>
        <StatusMsg status={status} />
        <div className="flex gap-2">
          <button onClick={save} disabled={loading} className="flex-1 bg-cobalt text-white text-[12px] font-bold tracking-widest uppercase py-3 hover:bg-cobalt-light disabled:opacity-40 transition-colors">
            {loading ? 'PROCESANDO...' : editId ? 'ACTUALIZAR' : 'AGREGAR'}
          </button>
          {editId && <button onClick={() => del(editId)} disabled={loading} className="border border-err/40 text-err text-[12px] font-bold tracking-widest uppercase px-4 hover:bg-err/5 transition-colors">ELIMINAR</button>}
        </div>
      </div>
    </div>
  );
}

/* ─── Settings tab ─── */

const DEFAULT_SETTINGS: SiteSettings = { availabilityValue: 99.9, dustThresholdDays: 60, starsForGold: 5, status: 'ONLINE', logLimit: 10 };

function SettingsTab() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [cvUploading, setCvUploading] = useState(false);
  const [cvStatus, setCvStatus] = useState<{ type: 'success' | 'error' | 'idle'; msg: string }>({ type: 'idle', msg: '' });

  async function uploadCv(file: File) {
    const token = import.meta.env.PUBLIC_GITHUB_TOKEN;
    const repo  = import.meta.env.PUBLIC_GITHUB_REPO;
    if (!token || !repo) { setCvStatus({ type: 'error', msg: 'Falta PUBLIC_GITHUB_TOKEN o PUBLIC_GITHUB_REPO' }); return; }

    setCvUploading(true);
    setCvStatus({ type: 'idle', msg: 'Leyendo archivo...' });

    try {
      // Read file as base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // strip data:...;base64, prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' };
      const filePath = 'public/cv.pdf';
      const apiUrl   = `https://api.github.com/repos/${repo}/contents/${filePath}`;

      // Get existing SHA (needed to overwrite)
      setCvStatus({ type: 'idle', msg: 'Verificando archivo existente...' });
      let existingSha: string | undefined;
      const existRes = await fetch(apiUrl, { headers });
      if (existRes.ok) { const d = await existRes.json(); existingSha = d.sha; }

      // Upload (create or replace)
      setCvStatus({ type: 'idle', msg: existingSha ? 'Reemplazando CV...' : 'Subiendo CV...' });
      const body: Record<string, string> = {
        message: existingSha ? 'cv: replace resume' : 'cv: add resume',
        content: base64,
      };
      if (existingSha) body.sha = existingSha;

      const upRes = await fetch(apiUrl, { method: 'PUT', headers, body: JSON.stringify(body) });
      if (!upRes.ok) { const err = await upRes.json(); throw new Error(err.message ?? `Upload failed ${upRes.status}`); }

      // Auto-set cvUrl to /cv.pdf and save
      update({ cvUrl: '/cv.pdf' });
      setCvStatus({ type: 'success', msg: '✓ CV subido — disponible en /cv.pdf (Vercel redeploya en ~30s)' });
    } catch (e: unknown) {
      setCvStatus({ type: 'error', msg: e instanceof Error ? e.message : 'Upload failed' });
    } finally {
      setCvUploading(false);
    }
  }

  useEffect(() => {
    const stored = localStorage.getItem('portfolioSettings');
    if (stored) { setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) }); return; }
    fetch('/data/settings.json').then(r => r.ok ? r.json() : null).then(data => {
      if (data) { setSettings({ ...DEFAULT_SETTINGS, ...data }); localStorage.setItem('portfolioSettings', JSON.stringify(data)); }
    }).catch(() => {});
  }, []);

  function update(partial: Partial<SiteSettings>) {
    const next = { ...settings, ...partial };
    setSettings(next);
    localStorage.setItem('portfolioSettings', JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('portfolioSettingsChanged'));
    const keys = Object.keys(partial);
    if (keys.some(k => !['cvUrl'].includes(k))) {
      logActivity('INFO', `SETTINGS_UPDATED — ${keys.join(', ')}`);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      {saved && <p className="text-[12px] text-cobalt tracking-widest">✓ SETTINGS_SAVED — se aplica en tiempo real</p>}

      <div className="border border-white/10 bg-carbono-surface p-5 flex flex-col gap-4">
        <p className="text-xs font-bold text-white tracking-widest border-b border-white/10 pb-2">IDENTITY</p>

            <div className="flex flex-col gap-1">
              <label className="text-[12px] text-text-faint tracking-widest uppercase">
                Availability: <span className="text-cobalt">{settings.availabilityValue.toFixed(1)}%</span>
              </label>
              <input type="range" min={0} max={100} step={0.1} value={settings.availabilityValue}
                onChange={e => update({ availabilityValue: Number(e.target.value) })}
                className="w-full accent-cobalt" />
            </div>

        <Field label="Status">
          <select value={settings.status ?? 'ONLINE'} onChange={e => update({ status: e.target.value as SiteSettings['status'] })} className={input}>
            <option value="ONLINE">ONLINE</option>
            <option value="BUSY">BUSY</option>
            <option value="OFFLINE">OFFLINE</option>
          </select>
        </Field>

        {/* CV Upload */}
        <div className="flex flex-col gap-2">
          <label className="text-[12px] text-text-faint tracking-widest uppercase">CV / Resume</label>

          {/* File upload */}
          <label className={`flex items-center gap-3 border border-dashed px-4 py-3 cursor-pointer transition-colors ${cvUploading ? 'border-white/10 opacity-40 pointer-events-none' : 'border-white/20 hover:border-cobalt/60'}`}>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              disabled={cvUploading}
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadCv(f); e.target.value = ''; }}
            />
            <span className="text-[11px] text-cobalt tracking-widest">
              {cvUploading ? '↑ SUBIENDO...' : '↑ SUBIR PDF'}
            </span>
            <span className="text-[10px] text-text-faint/60">
              {settings.cvUrl === '/cv.pdf' ? 'cv.pdf ya subido — reemplazar' : 'seleccioná un .pdf'}
            </span>
          </label>

          {cvStatus.msg && (
            <p className={`text-[11px] tracking-widest ${cvStatus.type === 'success' ? 'text-cobalt' : cvStatus.type === 'error' ? 'text-err' : 'text-text-faint animate-pulse'}`}>
              {cvStatus.msg}
            </p>
          )}

          {/* Manual URL fallback */}
          <div className="flex flex-col gap-1 mt-1">
            <span className="text-[10px] text-text-faint/50 tracking-widest">o usá una URL externa</span>
            <input
              value={settings.cvUrl ?? ''}
              onChange={e => update({ cvUrl: e.target.value.trim() || undefined })}
              className={input}
              placeholder="https://drive.google.com/..."
            />
          </div>
          <p className="text-[10px] text-text-faint/50">Aparece como botón ↓ DOWNLOAD CV y como comando <code className="text-cobalt">wget cv.pdf</code> en la terminal</p>
        </div>

        <Field label="LinkedIn URL">
          <input
            value={settings.linkedinUrl ?? ''}
            onChange={e => update({ linkedinUrl: e.target.value.trim() || undefined })}
            className={input}
            placeholder="https://linkedin.com/in/tu-perfil"
          />
        </Field>
      </div>

      <div className="border border-white/10 bg-carbono-surface p-5 flex flex-col gap-4">
        <p className="text-xs font-bold text-white tracking-widest border-b border-white/10 pb-2">EFECTOS VISUALES</p>

        <div className="flex flex-col gap-1">
          <label className="text-[12px] text-text-faint tracking-widest uppercase">
            Dust threshold: <span className="text-warn">{settings.dustThresholdDays} días</span>
          </label>
          <p className="text-[10px] text-text-faint/60">Días sin commits antes de que empiece el polvo</p>
          <input type="range" min={7} max={365} step={1} value={settings.dustThresholdDays}
            onChange={e => update({ dustThresholdDays: Number(e.target.value) })}
            className="w-full accent-warn" />
          <div className="flex justify-between text-[9px] text-text-faint/40">
            <span>7d</span><span>60d (default)</span><span>365d</span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[12px] text-text-faint tracking-widest uppercase">
            Stars para Oro: <span className="text-bronze">{settings.starsForGold} ★</span>
          </label>
          <p className="text-[10px] text-text-faint/60">Stars mínimas para activar el efecto bronce/oro automáticamente</p>
          <input type="range" min={0} max={50} step={1} value={settings.starsForGold}
            onChange={e => update({ starsForGold: Number(e.target.value) })}
            className="w-full accent-bronze" />
          <div className="flex justify-between text-[9px] text-text-faint/40">
            <span>0 (todos)</span><span>5 (default)</span><span>50</span>
          </div>
        </div>
      </div>

      <div className="border border-white/10 bg-carbono/40 p-4 text-[11px] text-text-faint leading-relaxed">
        <p className="text-cobalt font-bold mb-1 tracking-widest text-[10px]">NOTA</p>
        Los cambios se aplican en tiempo real al portfolio. Para persistirlos entre sesiones, usá el botón <span className="text-cobalt">↑ PUBLISH</span>.
      </div>
    </div>
  );
}

/* ─── Publish tab ─── */

function PublishTab() {
  const [repo, setRepo] = useState(import.meta.env.PUBLIC_GITHUB_REPO ?? '');
  const [branch, setBranch] = useState('main');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle'; msg: string }>({ type: 'idle', msg: '' });
  const [publishing, setPublishing] = useState(false);
  const [builds, setBuilds] = useState<BuildEntry[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('portfolioBuildHistory');
    if (stored) setBuilds(JSON.parse(stored));
  }, []);

  function nextBuildNumber(): number {
    const stored = localStorage.getItem('portfolioBuildHistory');
    if (!stored) return 1;
    const history: BuildEntry[] = JSON.parse(stored);
    return (history[0]?.buildNumber ?? 0) + 1;
  }

  function saveBuild(entry: BuildEntry) {
    const stored = localStorage.getItem('portfolioBuildHistory');
    const history: BuildEntry[] = stored ? JSON.parse(stored) : [];
    const updated = [entry, ...history].slice(0, 20);
    localStorage.setItem('portfolioBuildHistory', JSON.stringify(updated));
    setBuilds(updated);
  }

  async function publish() {
    const token = import.meta.env.PUBLIC_GITHUB_TOKEN;
    if (!token) { setStatus({ type: 'error', msg: 'Falta PUBLIC_GITHUB_TOKEN en .env' }); return; }
    if (!repo.includes('/')) { setStatus({ type: 'error', msg: 'Repo inválido — formato: owner/repo' }); return; }

    setPublishing(true);
    setStatus({ type: 'idle', msg: '' });
    const buildNum = nextBuildNumber();
    const authHeaders = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' };

    try {
      const files = [
        { key: 'portfolioProjects',   path: 'public/data/projects.json',   label: 'projects' },
        { key: 'portfolioTechstack',  path: 'public/data/techstack.json',  label: 'techstack' },
        { key: 'portfolioAmbitions',  path: 'public/data/ambitions.json',  label: 'ambitions' },
        { key: 'portfolioExperience', path: 'public/data/experience.json', label: 'experience' },
        { key: 'portfolioSettings',   path: 'public/data/settings.json',   label: 'settings' },
      ];

      const toCommit = files.filter(f => !!localStorage.getItem(f.key));
      if (toCommit.length === 0) throw new Error('No hay datos para publicar');

      // 1. Get latest commit SHA
      const refRes = await fetch(`https://api.github.com/repos/${repo}/git/ref/heads/${branch}`, { headers: authHeaders });
      if (!refRes.ok) throw new Error(`Branch '${branch}' not found — ${refRes.status}`);
      const ref = await refRes.json();
      const latestSha: string = ref.object.sha;

      // 2. Get tree SHA
      const commitRes = await fetch(`https://api.github.com/repos/${repo}/git/commits/${latestSha}`, { headers: authHeaders });
      if (!commitRes.ok) throw new Error(`Commit not found — ${commitRes.status}`);
      const commitData = await commitRes.json();
      const baseTree: string = commitData.tree.sha;

      // 3. Create blobs
      setStatus({ type: 'idle', msg: 'Creating blobs...' });
      const treeItems = await Promise.all(toCommit.map(async (f) => {
        const content = localStorage.getItem(f.key)!;
        const blobRes = await fetch(`https://api.github.com/repos/${repo}/git/blobs`, {
          method: 'POST', headers: authHeaders,
          body: JSON.stringify({ content: btoa(unescape(encodeURIComponent(content))), encoding: 'base64' }),
        });
        if (!blobRes.ok) throw new Error(`Blob failed for ${f.label}`);
        const blob = await blobRes.json();
        return { path: f.path, mode: '100644', type: 'blob', sha: blob.sha };
      }));

      // 4. Create tree
      setStatus({ type: 'idle', msg: 'Creating tree...' });
      const treeRes = await fetch(`https://api.github.com/repos/${repo}/git/trees`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ base_tree: baseTree, tree: treeItems }),
      });
      if (!treeRes.ok) throw new Error(`Tree creation failed — ${treeRes.status}`);
      const tree = await treeRes.json();

      // 5. Create commit
      setStatus({ type: 'idle', msg: 'Creating commit...' });
      const newCommitRes = await fetch(`https://api.github.com/repos/${repo}/git/commits`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({
          message: `data: update portfolio content [build #${buildNum}]`,
          tree: tree.sha,
          parents: [latestSha],
        }),
      });
      if (!newCommitRes.ok) throw new Error(`Commit creation failed — ${newCommitRes.status}`);
      const newCommit = await newCommitRes.json();

      // 6. Update branch ref
      setStatus({ type: 'idle', msg: 'Updating branch...' });
      const updateRes = await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/${branch}`, {
        method: 'PATCH', headers: authHeaders,
        body: JSON.stringify({ sha: newCommit.sha }),
      });
      if (!updateRes.ok) throw new Error(`Ref update failed — ${updateRes.status}`);

      const entry: BuildEntry = {
        buildNumber: buildNum,
        status: 'SUCCESS',
        timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
        files: toCommit.map(f => f.label),
      };
      saveBuild(entry);
      logActivity('MILESTONE', `PUBLISHED build #${buildNum} — ${toCommit.map(f => f.label).join(', ')}`);
      setStatus({ type: 'success', msg: `BUILD #${buildNum} — SUCCESS — Vercel redeploya en ~30s` });
    } catch (e: unknown) {
      const entry: BuildEntry = {
        buildNumber: buildNum,
        status: 'FAIL',
        timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
        files: [],
      };
      saveBuild(entry);
      setStatus({ type: 'error', msg: e instanceof Error ? e.message : 'PUBLISH_FAILED' });
    } finally { setPublishing(false); }
  }

  return (
    <div className="flex flex-col gap-5 max-w-lg">
      <div className="border border-white/10 bg-carbono-surface p-5 flex flex-col gap-4">
        <div>
          <p className="text-xs font-bold text-white tracking-widest mb-1">DEPLOY → GITHUB → VERCEL</p>
          <p className="text-xs text-text-muted leading-relaxed">Un solo commit con todos los cambios. Vercel detecta el push y redeploya automáticamente.</p>
        </div>
        <div className="grid grid-cols-[1fr_120px] gap-3">
          <Field label="Repo (owner/repo)">
            <input value={repo} onChange={e => setRepo(e.target.value)} className={input} placeholder="Alejandro-M-P/portfolio" />
          </Field>
          <Field label="Branch">
            <input value={branch} onChange={e => setBranch(e.target.value)} className={input} placeholder="main" />
          </Field>
        </div>
        <StatusMsg status={status} />
        <button onClick={publish} disabled={publishing} className="bg-cobalt text-white text-xs font-bold tracking-widest uppercase py-3 hover:bg-cobalt-light disabled:opacity-40 transition-colors">
          {publishing ? 'PUBLISHING...' : '↑ PUBLISH TO GITHUB'}
        </button>
      </div>

      {/* Build history */}
      <div className="border border-white/10 bg-carbono-surface flex flex-col">
        <div className="border-b border-white/10 px-4 py-2 bg-carbono flex items-center justify-between">
          <p className="text-[10px] text-text-faint tracking-widest uppercase font-bold">BUILD HISTORY</p>
          {builds.length > 0 && (
            <button onClick={() => { localStorage.removeItem('portfolioBuildHistory'); setBuilds([]); }} className="text-[10px] text-err/60 hover:text-err tracking-widest">CLEAR</button>
          )}
        </div>
        {builds.length === 0 ? (
          <p className="text-[11px] text-text-faint px-4 py-3 tracking-widest">NO_BUILDS_YET</p>
        ) : (
          builds.map(b => (
            <div key={b.buildNumber} className={`px-4 py-2 border-b border-white/5 last:border-0 flex items-center gap-3 text-[11px] ${b.status === 'SUCCESS' ? '' : 'bg-err/5'}`}>
              <span className={`font-bold tracking-widest flex-shrink-0 ${b.status === 'SUCCESS' ? 'text-cobalt' : 'text-err'}`}>
                #{b.buildNumber}
              </span>
              <span className={`text-[10px] font-bold tracking-widest ${b.status === 'SUCCESS' ? 'text-cobalt' : 'text-err'}`}>{b.status}</span>
              <span className="text-text-faint tabular-nums">{b.timestamp}</span>
              <span className="text-text-faint/50 text-[10px] ml-auto">[{b.files.join(', ')}]</span>
            </div>
          ))
        )}
      </div>

      <div className="border border-cobalt/20 bg-cobalt/5 p-4 flex flex-col gap-2">
        <p className="text-[10px] text-cobalt tracking-widest uppercase font-bold">Setup (una sola vez)</p>
        {['Token con scope repo → GitHub → Settings → Developer settings → Tokens (classic)', 'En Vercel: Settings → Env Vars → PUBLIC_GITHUB_TOKEN, PUBLIC_ADMIN_PASSWORD, PUBLIC_GITHUB_REPO', 'Conectá el repo en Vercel → cada push redeploya automáticamente'].map((s, i) => (
          <div key={i} className="text-[11px] text-text-muted flex gap-2">
            <span className="text-cobalt flex-shrink-0">{i + 1}.</span><span>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main AdminPanel ─── */

type AdminTab = 'projects' | 'experience' | 'tech' | 'ambitions' | 'settings' | 'publish';

export default function AdminPanel() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<AdminTab>('projects');

  useEffect(() => { if (sessionStorage.getItem(SESSION_KEY) === 'true') setAuthed(true); }, []);

  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen bg-carbono text-text-primary font-mono">
      <nav className="border-b border-white/10 bg-carbono/80 backdrop-blur-md px-6 h-12 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <a href="/" className="text-[10px] text-text-faint tracking-widest hover:text-white transition-colors">← PORTFOLIO</a>
          <span className="text-white/20">|</span>
          <span className="text-xs font-bold text-white tracking-widest">ADMIN_PANEL</span>
        </div>
        <button onClick={() => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false); }} className="text-[10px] text-text-faint hover:text-err tracking-widest transition-colors">LOGOUT</button>
      </nav>

      <div className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="flex flex-wrap border-b border-white/10 mb-6">
          {([
            ['projects',   'PROJECTS'],
            ['experience', 'EXPERIENCE'],
            ['tech',       'TECH & TOOLS'],
            ['ambitions',  'AMBITIONS'],
            ['settings',   '⚙ SETTINGS'],
            ['publish',    '↑ PUBLISH'],
          ] as [AdminTab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} className={`px-5 py-2.5 text-xs tracking-widest uppercase border-b-2 transition-colors ${tab === t ? 'border-cobalt text-white' : 'border-transparent text-text-faint hover:text-white'} ${t === 'publish' ? 'ml-auto' : ''}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'projects'   && <ProjectsTab />}
        {tab === 'experience' && <ExperienceTab />}
        {tab === 'tech'       && <TechTab />}
        {tab === 'ambitions'  && <AmbitionsTab />}
        {tab === 'settings'   && <SettingsTab />}
        {tab === 'publish'    && <PublishTab />}
      </div>
    </div>
  );
}
