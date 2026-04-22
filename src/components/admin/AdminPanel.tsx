// AdminPanel.tsx - INDUSTRIAL LIGHT CARBON EDITION (FIXED TYPES)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Project, TechTool, Ambition, SiteSettings, BuildEntry, LogEntry } from '../../types';
import { logActivity } from '../../lib/activityLog';

const ADMIN_PASSWORD = import.meta.env.PUBLIC_ADMIN_PASSWORD;
const SESSION_KEY   = 'admin_session';
const SESSION_TS    = 'admin_session_ts';
const ATTEMPTS_KEY  = 'admin_attempts';
const LOCKOUT_KEY   = 'admin_lockout';
const MAX_ATTEMPTS  = 3;
const LOCKOUT_MS    = 5 * 60 * 1000;
const SESSION_TTL   = 30 * 60 * 1000;

interface GitHubDetails {
  id: string;
  name: string;
  photo: string;
  specsDescription: string;
  specsLanguage: string;
  specsStars: string | number;
  specsRepo: string;
  specsRepoSlug: string;
  specsStatus: string;
  pushedAt: string;
  stack: string;
  architecture: string;
}

/* --- Utilities --- */

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function isSessionValid(): boolean {
  if (typeof window === 'undefined') return false;
  if (sessionStorage.getItem(SESSION_KEY) !== 'true') return false;
  const ts = Number(sessionStorage.getItem(SESSION_TS) ?? 0);
  if (Date.now() - ts > SESSION_TTL) {
    sessionStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(SESSION_TS);
    return false;
  }
  return true;
}

/* --- Styled Components --- */

const inputClass = "bg-transparent border-b border-white/10 px-0 py-2 text-[13px] text-white font-mono w-full focus:outline-none focus:border-cobalt transition-colors duration-100 placeholder:opacity-20";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[9px] text-white/40 tracking-[0.2em] uppercase font-black">/ {label}{required && <span className="text-cobalt ml-1">*</span>}</label>
      {children}
    </div>
  );
}

function CheckField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none group">
      <div className={`w-3 h-3 border ${value ? 'bg-cobalt border-cobalt' : 'border-white/20 group-hover:border-white/40'} transition-colors`} />
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} className="hidden" />
      <span className="text-[10px] text-white/60 tracking-widest uppercase group-hover:text-white transition-colors">{label}</span>
    </label>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-2 mb-8">
      <h2 className="text-[14px] text-white font-black tracking-[0.3em] uppercase">{title}</h2>
      <div className="h-0.5 w-12 bg-cobalt shadow-[0_0_10px_rgba(0,85,255,0.5)]" />
    </div>
  );
}

/* --- Password Gate --- */

function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const tick = () => {
      const lockUntil = Number(localStorage.getItem(LOCKOUT_KEY) ?? 0);
      setCountdown(Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000)));
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (countdown > 0 || loading) return;
    setLoading(true);
    try {
      const hash = await sha256(pw);
      const pwHash = await sha256(ADMIN_PASSWORD ?? '');
      if (hash === pwHash) {
        localStorage.removeItem(ATTEMPTS_KEY); localStorage.removeItem(LOCKOUT_KEY);
        sessionStorage.setItem(SESSION_KEY, 'true'); sessionStorage.setItem(SESSION_TS, String(Date.now()));
        onAuth();
      } else {
        const attempts = Number(localStorage.getItem(ATTEMPTS_KEY) ?? 0) + 1;
        localStorage.setItem(ATTEMPTS_KEY, String(attempts));
        if (attempts >= MAX_ATTEMPTS) {
          localStorage.setItem(LOCKOUT_KEY, String(Date.now() + LOCKOUT_MS));
          localStorage.setItem(ATTEMPTS_KEY, '0');
          setErr('LOCKOUT_ENFORCED');
        } else { setErr(`DENIED: ${MAX_ATTEMPTS - attempts} LEFT`); }
        setPw('');
      }
    } finally { setLoading(false); }
  }

  const mins = Math.floor(countdown / 60);
  const secs = String(countdown % 60).padStart(2, '0');

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center font-mono select-none">
      <div className="flex flex-col gap-10 w-full max-w-sm p-12 border border-white/10 bg-[#222222] shadow-2xl">
        <div className="flex flex-col gap-2">
          <p className="text-[10px] text-white font-black tracking-[0.4em] uppercase">ADMIN_OVERRIDE</p>
          <div className="h-px bg-white/10 w-full" />
        </div>
        <form onSubmit={submit} className="flex flex-col gap-8">
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} className="bg-transparent border-b border-white p-2 text-white focus:outline-none w-full text-center tracking-[0.5em]" placeholder="••••" autoFocus disabled={countdown > 0 || loading} />
          {countdown > 0 ? (
            <p className="text-[10px] text-red-400 text-center font-bold tracking-widest uppercase">LOCKOUT: {mins}:{secs}</p>
          ) : err && (
            <p className="text-[10px] text-red-400 text-center font-bold tracking-widest uppercase">{err}</p>
          )}
          <button type="submit" disabled={countdown > 0 || loading} className="w-full py-4 bg-cobalt text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-cobalt-light transition-all">{loading ? '...' : 'AUTHENTICATE'}</button>
        </form>
      </div>
    </div>
  );
}

/* --- Repo Importer Modal --- */

function RepoImportModal({ onClose, onImport, existingSlugs }: { onClose: () => void, onImport: (repo: any) => void, existingSlugs: string[] }) {
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetch('/api/github', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'getUserRepos' }) })
      .then(r => r.json())
      .then(data => setRepos(data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = repos.filter(r => 
    !existingSlugs.includes(r.fullName) && 
    (r.name.toLowerCase().includes(filter.toLowerCase()) || r.description?.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#222222] border border-white/10 flex flex-col max-h-[80vh] shadow-2xl">
        <header className="p-8 border-b border-white/5 flex justify-between items-center bg-[#1a1a1a]">
          <SectionHeader title="Import_GitHub_Repos" />
          <button onClick={onClose} className="text-white/40 hover:text-white mb-8">✕</button>
        </header>
        
        <div className="p-8 border-b border-white/5">
          <input 
            type="text" 
            placeholder="Filter repositories..." 
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-full bg-white/5 border border-white/10 p-3 text-[12px] text-white focus:outline-none focus:border-cobalt"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {loading ? (
            <div className="h-40 flex items-center justify-center text-[10px] tracking-widest text-white/20 uppercase animate-pulse">Scanning_Uplink...</div>
          ) : filtered.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-[10px] tracking-widest text-white/20 uppercase">No_Available_Modules</div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {filtered.map(r => (
                <div key={r.fullName} className="p-4 border border-white/5 bg-white/[0.02] flex items-center justify-between group hover:border-white/20 transition-all">
                  <div className="flex flex-col gap-1 overflow-hidden">
                    <span className="text-[12px] font-black text-white truncate">{r.name}</span>
                    <span className="text-[9px] text-white/40 truncate">{r.fullName}</span>
                  </div>
                  <button 
                    onClick={() => onImport(r)}
                    className="px-6 py-2 bg-cobalt text-white text-[9px] font-black uppercase hover:bg-cobalt-light transition-all"
                  >
                    Import
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* --- Projects Tab --- */

const emptyProject = {
  name: '', gitUrl: '', photo: '', video: '', stack: '', architecture: '', initSequence: '', description: '', businessImpact: '',
  specsStatus: '', specsStars: '', specsLanguage: '', specsLicense: '', specsDescription: '', specsRepo: '', specsRepoSlug: '', specsDemo: '', specsTags: '',
  isHighlighted: false, isPrivate: false, isFavorite: false, pushedAt: '', order: 0
};

function ProjectsTab({ onLog }: { onLog: (msg: string) => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState(emptyProject);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    const stored = localStorage.getItem('portfolioProjects');
    if (stored) setProjects(JSON.parse(stored));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleImport = (r: any) => {
    const newProj: Project = {
      id: String(Date.now()),
      name: r.name.toUpperCase(),
      description: r.description || '',
      photo: r.photo || '',
      stack: (r.language || '').split(',').map((s: string) => s.trim().toUpperCase()).filter(Boolean),
      architecture: '',
      initSequence: '',
      specs: {
        status: 'STABLE',
        stars: r.stars || 0,
        language: r.language || '',
        repo: r.url || '',
        repoSlug: r.fullName || ''
      },
      pushedAt: r.pushedAt
    };
    
    const next = [...projects, newProj];
    setProjects(next);
    localStorage.setItem('portfolioProjects', JSON.stringify(next));
    onLog(`MODULE_IMPORTED: ${r.name}`);
    setShowImport(false);
  };

  async function fetchGitHub() {
    const urlMatch = form.gitUrl.trim().match(/github\.com\/([^/]+)\/([^/\s]+)/);
    if (!urlMatch) { onLog('ERROR: INVALID_URL'); return; }
    const repoSlug = `${urlMatch[1]}/${urlMatch[2].replace(/\.git$/, '')}`;
    setScanLoading(true); onLog(`SCANNING: ${repoSlug}...`);
    try {
      const res = await fetch('/api/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getRepoDetails', repoSlug })
      });
      if (!res.ok) throw new Error(`GH_${res.status}`);
      const r = await res.json() as GitHubDetails;
      setForm(f => ({
        ...f,
        name: f.name || r.name,
        photo: f.photo || r.photo,
        specsDescription: r.specsDescription,
        specsLanguage: r.specsLanguage,
        specsStars: String(r.specsStars),
        specsRepo: r.specsRepo,
        specsRepoSlug: r.specsRepoSlug,
        specsStatus: r.specsStatus,
        pushedAt: r.pushedAt,
        stack: r.stack,
        architecture: r.architecture || f.architecture
      }));
      onLog(`SYNC_SUCCESS: ${repoSlug}`);
    } catch (e: any) { onLog(`SYNC_FAILED: ${e.message}`); }
    finally { setScanLoading(false); }
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setForm(f => ({ ...f, photo: reader.result as string })); onLog(`IMAGE_BUFFERED: ${file.name}`); };
    reader.readAsDataURL(file);
  }

  function save() {
    if (!form.name.trim()) { onLog('ERROR: NAME_REQUIRED'); return; }
    const p: Project = { 
      id: projects[editingIdx ?? -1]?.id || String(Date.now()), 
      name: form.name.toUpperCase(), 
      photo: form.photo, 
      stack: form.stack.split(',').map(s => s.trim().toUpperCase()).filter(Boolean), 
      architecture: form.architecture, 
      initSequence: form.initSequence, 
      description: form.description, 
      businessImpact: form.businessImpact, 
      specs: { 
        status: form.specsStatus, 
        stars: form.specsStars, 
        language: form.specsLanguage, 
        license: form.specsLicense, 
        description: form.specsDescription, 
        repo: form.specsRepo, 
        repoSlug: form.specsRepoSlug, 
        demo: form.specsDemo, 
        tags: form.specsTags.split(',').filter(Boolean), 
        video: form.video 
      }, 
      isHighlighted: form.isHighlighted, 
      isFavorite: form.isFavorite, 
      isPrivate: form.isPrivate, 
      pushedAt: form.pushedAt || undefined, 
      order: Number(form.order) || 0 
    };
    const next = editingIdx !== null ? projects.map((x, i) => i === editingIdx ? p : x) : [...projects, p];
    localStorage.setItem('portfolioProjects', JSON.stringify(next));
    setProjects(next); onLog(`MODULE_COMMITTED: ${p.name}`);
  }

  function select(idx: number) {
    const p = projects[idx];
    setEditingIdx(idx);
    setForm({ 
      ...emptyProject, 
      name: p.name, 
      photo: p.photo, 
      video: (p.specs?.video as string) || '', 
      stack: p.stack.join(', '), 
      architecture: p.architecture, 
      initSequence: p.initSequence, 
      description: p.description ?? '', 
      businessImpact: p.businessImpact ?? '', 
      specsStatus: (p.specs?.status as string) || '', 
      specsStars: (p.specs?.stars as string) || '', 
      specsLanguage: (p.specs?.language as string) || '', 
      specsLicense: (p.specs?.license as string) || '', 
      specsDescription: (p.specs?.description as string) || '', 
      specsRepo: (p.specs?.repo as string) || '', 
      specsRepoSlug: (p.specs?.repoSlug as string) || '', 
      specsDemo: (p.specs?.demo as string) || '', 
      specsTags: Array.isArray(p.specs?.tags) ? p.specs.tags.join(', ') : '', 
      isHighlighted: !!p.isHighlighted, 
      isFavorite: !!p.isFavorite, 
      isPrivate: !!p.isPrivate, 
      pushedAt: p.pushedAt || '', 
      order: p.order || 0,
      gitUrl: (p.specs?.repo as string) || ''
    });
  }

  const existingSlugs = projects.map(p => {
    const slug = p.specs?.repoSlug;
    return typeof slug === 'string' ? slug : '';
  }).filter(Boolean);

  return (
    <div className="flex flex-col gap-12">
      {showImport && <RepoImportModal existingSlugs={existingSlugs} onImport={handleImport} onClose={() => setShowImport(false)} />}
      
      <div className="flex flex-col gap-6">
        <header className="flex justify-between items-center border-b border-white/5 pb-3">
          <p className="text-[11px] text-white font-black tracking-widest uppercase">/ MODULE_REPOSITORY</p>
          <div className="flex gap-6 items-center">
            <button onClick={() => setShowImport(true)} className="text-[10px] text-cobalt font-black tracking-widest hover:underline uppercase transition-all">[IMPORT_SELECTIVE]</button>
            <button onClick={() => { setEditingIdx(null); setForm(emptyProject); }} className="text-[10px] text-white/40 hover:text-white tracking-widest font-black uppercase">[+] NEW_MODULE</button>
          </div>
        </header>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {projects.map((p, i) => (
            <button key={i} onClick={() => select(i)} className={`p-5 border text-left transition-all ${editingIdx === i ? 'border-cobalt bg-cobalt/5 text-white shadow-[0_0_20px_rgba(0,85,255,0.1)]' : 'border-white/5 bg-[#222222] hover:border-white/20 text-white/60'}`}>
              <p className="text-[11px] font-black uppercase truncate">{p.name}</p>
              <div className="flex justify-between items-center opacity-30 mt-2">
                <p className="text-[9px] tracking-widest uppercase">ORDER_{p.order}</p>
                {p.isFavorite && <span className="text-[10px]">★</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#222222] border border-white/10 p-12 shadow-2xl">
        <SectionHeader title={editingIdx !== null ? `TERMINAL_CONFIG: ${projects[editingIdx].name}` : 'INITIALIZING_DATA'} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-10">
          <Field label="NAME" required><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} placeholder="SYSTEM_MODULE" /></Field>
          
          <div className="col-span-2 flex gap-6">
            <div className="flex-1"><Field label="GITHUB_ENDPOINT"><input value={form.gitUrl} onChange={e => setForm(f => ({ ...f, gitUrl: e.target.value }))} className={inputClass} placeholder="https://github.com/..." /></Field></div>
            <button onClick={fetchGitHub} disabled={scanLoading} className="self-end px-8 py-3 bg-cobalt text-white text-[11px] font-black tracking-widest hover:bg-cobalt-light uppercase transition-all shadow-[0_0_15px_rgba(0,85,255,0.2)]">{scanLoading ? 'SCANNING...' : 'SYNC_METADATA'}</button>
          </div>

          <div className="col-span-2 flex flex-wrap gap-12 border-t border-white/5 pt-10">
            <CheckField label="HIGH_VALUE" value={form.isHighlighted} onChange={v => setForm(f => ({ ...f, isHighlighted: v }))} />
            <CheckField label="PINNED" value={form.isFavorite} onChange={v => setForm(f => ({ ...f, isFavorite: v }))} />
            <CheckField label="REDACTED" value={form.isPrivate} onChange={v => setForm(f => ({ ...f, isPrivate: v }))} />
          </div>

          <Field label="OVERVIEW_BRIEF"><input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputClass} /></Field>
          <Field label="BUSINESS_IMPACT"><input value={form.businessImpact} onChange={e => setForm(f => ({ ...f, businessImpact: e.target.value }))} className={inputClass} /></Field>
          
          <div className="col-span-2 grid grid-cols-2 gap-10 border-t border-white/5 pt-10">
            <div className="space-y-4">
              <Field label="VISUAL_ASSET [IMG]">
                <div className="flex gap-2">
                  <input value={form.photo} onChange={e => setForm(f => ({ ...f, photo: e.target.value }))} className={`${inputClass} flex-1`} />
                  <button onClick={() => photoInputRef.current?.click()} className="px-4 py-1 border border-white/10 text-white/40 text-[10px] hover:text-white uppercase transition-all">↑</button>
                  <input ref={photoInputRef} type="file" className="hidden" onChange={handlePhotoUpload} />
                </div>
              </Field>
              {form.photo && <div className="border border-white/10 p-2 bg-black/40"><img src={form.photo} className="h-32 w-full object-cover grayscale opacity-60" /></div>}
            </div>
            <div className="space-y-4">
              <Field label="STREAM_SOURCE [VIDEO]"><input value={form.video} onChange={e => setForm(f => ({ ...f, video: e.target.value }))} className={inputClass} /></Field>
            </div>
          </div>

          <div className="col-span-2"><Field label="SYSTEM_ARCHITECTURE"><textarea value={form.architecture} onChange={e => setForm(f => ({ ...f, architecture: e.target.value }))} className={`${inputClass} h-24 resize-none`} /></Field></div>
          <div className="col-span-2"><Field label="INIT_SEQUENCE"><textarea value={form.initSequence} onChange={e => setForm(f => ({ ...f, initSequence: e.target.value }))} className={`${inputClass} h-16 resize-none`} /></Field></div>

          <Field label="TECH_STACK (CSV)"><input value={form.stack} onChange={e => setForm(f => ({ ...f, stack: e.target.value }))} className={inputClass} /></Field>
          <Field label="STATUS">
            <select value={form.specsStatus} onChange={e => setForm(f => ({ ...f, specsStatus: e.target.value }))} className={inputClass}>
              <option value="">— SELECT_STATUS —</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="PAUSED">PAUSED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </Field>
          <Field label="STARS"><input value={form.specsStars} onChange={e => setForm(f => ({ ...f, specsStars: e.target.value }))} className={inputClass} /></Field>
          <Field label="LANGUAGE"><input value={form.specsLanguage} onChange={e => setForm(f => ({ ...f, specsLanguage: e.target.value }))} className={inputClass} /></Field>
          <Field label="LICENSE"><input value={form.specsLicense} onChange={e => setForm(f => ({ ...f, specsLicense: e.target.value }))} className={inputClass} /></Field>
          <Field label="REPO_SLUG"><input value={form.specsRepoSlug} onChange={e => setForm(f => ({ ...f, specsRepoSlug: e.target.value }))} className={inputClass} /></Field>
        </div>

        <div className="mt-12 flex items-center gap-10 border-t border-white/5 pt-10">
          <button onClick={save} className="bg-cobalt text-white text-[11px] font-black tracking-[0.3em] uppercase px-12 py-5 hover:bg-cobalt-light transition-all shadow-[0_0_30px_rgba(0,85,255,0.2)]">COMMIT_CHANGES [CTRL+S]</button>
          {editingIdx !== null && <button onClick={() => { if(confirm('DECOMMISSION?')) { const n = projects.filter((_, i) => i !== editingIdx); localStorage.setItem('portfolioProjects', JSON.stringify(n)); load(); setEditingIdx(null); } }} className="text-[10px] text-err opacity-50 hover:opacity-100 tracking-widest uppercase">DECOMMISSION</button>}
        </div>
      </div>
    </div>
  );
}

/* --- Tech Tab --- */

function TechTab({ onLog }: { onLog: (msg: string) => void }) {
  const [tools, setTools] = useState<TechTool[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', version: '', usageLevel: 80 });
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => { const s = localStorage.getItem('portfolioTechstack'); if (s) setTools(JSON.parse(s)); }, []);
  useEffect(() => { load(); }, [load]);

  async function scanAll() {
    const s = localStorage.getItem('portfolioProjects'); if (!s) return;
    const projectsLocal = JSON.parse(s) as Project[];
    const slugs = projectsLocal.map(p => {
        const slug = p.specs?.repoSlug;
        return typeof slug === 'string' ? slug : '';
    }).filter(Boolean);
    setLoading(true); onLog(`SCANNING_REPOS...`);
    try {
      const results = await Promise.all(slugs.map(slug => 
        fetch(`/api/github`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ action: 'getRepoDetails', repoSlug: slug }) 
        }).then(r => r.ok ? r.json() as Promise<GitHubDetails> : null)
      ));
      const totals: Record<string, number> = {};
      for (const r of results) { 
        if (!r?.stack) continue;
        const stackItems = r.stack.split(',').map((s: string) => s.trim().toUpperCase());
        for (const item of stackItems) totals[item] = (totals[item] || 0) + 1;
      }
      const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
      const max = sorted[0]?.[1] || 1;
      const derived: TechTool[] = sorted.map(([n, v]) => ({ name: n.toUpperCase(), version: '', usageLevel: Math.round((v/max) * 100) }));
      setTools(derived); localStorage.setItem('portfolioTechstack', JSON.stringify(derived));
      onLog(`SCAN_COMPLETE: ${sorted.length} MODULES DETECTED`);
    } catch (e: any) { onLog(`SCAN_ERROR: ${e.message}`); }
    finally { setLoading(false); }
  }

  function save() {
    if (!form.name) return;
    const tool: TechTool = { ...form, name: form.name.toUpperCase() };
    const next = editing !== null ? tools.map((t, i) => i === editing ? tool : t) : [...tools, tool];
    setTools(next); localStorage.setItem('portfolioTechstack', JSON.stringify(next));
    setForm({ name: '', version: '', usageLevel: 80 }); setEditing(null); onLog(`TECH_SAVED: ${tool.name}`);
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="flex justify-between items-center border-b border-white/5 pb-3">
        <p className="text-[11px] text-white font-black tracking-widest uppercase">/ TECH_MATRIX_REGISTRY</p>
        <button onClick={scanAll} disabled={loading} className="text-[10px] text-cobalt hover:underline uppercase transition-all tracking-widest">{loading ? 'SCANNING_GITHUB...' : '[REFRESH_FROM_GITHUB]'}</button>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tools.map((t, i) => (
          <button key={i} onClick={() => { setEditing(i); setForm({ name: t.name, version: t.version, usageLevel: t.usageLevel }); }} className={`p-6 border text-left transition-all ${editing === i ? 'border-cobalt bg-cobalt/5 text-white shadow-lg' : 'border-white/5 bg-[#222222] hover:border-white/20 text-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <p className="text-[12px] font-black uppercase">{t.name}</p>
              <span className={`text-[11px] font-black ${editing === i ? 'text-white' : 'text-cobalt'}`}>{t.usageLevel}%</span>
            </div>
            <div className={`h-1 w-full ${editing === i ? 'bg-white/20' : 'bg-white/5'}`}><div className={`h-full ${editing === i ? 'bg-white' : 'bg-cobalt'} transition-all`} style={{ width: `${t.usageLevel}%` }} /></div>
          </button>
        ))}
      </div>
      <div className="bg-[#222222] border border-white/10 p-10 space-y-8 shadow-2xl">
        <SectionHeader title={editing !== null ? 'UPDATE_TOOL' : 'ADD_NEW_TOOL'} />
        <div className="grid grid-cols-3 gap-8">
          <Field label="NAME"><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} /></Field>
          <Field label="VERSION"><input value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} className={inputClass} /></Field>
          <Field label="USAGE_%"><input type="number" value={form.usageLevel} onChange={e => setForm(f => ({ ...f, usageLevel: Number(e.target.value) }))} className={inputClass} /></Field>
        </div>
        <div className="flex gap-4 border-t border-white/5 pt-8">
          <button onClick={save} className="px-8 py-3 bg-cobalt text-white text-[10px] font-black uppercase tracking-widest">SAVE_TOOL</button>
          {editing !== null && <button onClick={() => { setTools(tools.filter((_, i) => i !== editing)); setEditing(null); setForm({ name: '', version: '', usageLevel: 80 }); }} className="text-err text-[10px] font-black uppercase tracking-widest ml-auto">DELETE</button>}
        </div>
      </div>
    </div>
  );
}

/* --- Ambitions Tab --- */

function AmbitionsTab({ onLog }: { onLog: (msg: string) => void }) {
  const [items, setItems] = useState<Ambition[]>([]);
  const [form, setForm] = useState({ text: '', completed: false });
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const load = useCallback(() => { const s = localStorage.getItem('portfolioAmbitions'); if (s) setItems(JSON.parse(s)); }, []);
  useEffect(() => { load(); }, [load]);

  function save() {
    if (!form.text) return;
    const item: Ambition = { 
        id: items[editingIdx ?? -1]?.id || String(Date.now()), 
        text: form.text, 
        completed: form.completed, 
        section: items[editingIdx ?? -1]?.section || 'short' 
    };
    const next = editingIdx !== null ? items.map((i, idx) => idx === editingIdx ? item : i) : [...items, item];
    setItems(next); localStorage.setItem('portfolioAmbitions', JSON.stringify(next));
    setForm({ text: '', completed: false }); setEditingIdx(null); onLog('ROADMAP_UPDATED');
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="border-b border-white/5 pb-3"><p className="text-[11px] text-white font-black tracking-widest uppercase">/ STRATEGIC_ROADMAP</p></header>
      <div className="flex flex-col gap-2">
        {items.map((i, idx) => (
          <button key={idx} onClick={() => { setEditingIdx(idx); setForm({ text: i.text, completed: i.completed }); }} className={`p-4 border text-left transition-all flex items-center gap-4 ${editingIdx === idx ? 'border-cobalt bg-cobalt/5 text-white shadow-lg' : 'border-white/5 bg-[#222222] hover:border-white/20 text-white'}`}>
            <div className={`w-3 h-3 border ${i.completed ? (editingIdx === idx ? 'bg-white border-white' : 'bg-cobalt border-cobalt') : 'border-white/20'}`} />
            <span className="text-[12px] font-black uppercase">{i.text}</span>
          </button>
        ))}
      </div>
      <div className="bg-[#222222] border border-white/10 p-10 space-y-8 shadow-2xl">
        <SectionHeader title={editingIdx !== null ? 'EDIT_OBJECTIVE' : 'ADD_OBJECTIVE'} />
        <div className="flex gap-8 items-end">
          <div className="flex-1"><Field label="GOAL_DESCRIPTION"><input value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} className={inputClass} /></Field></div>
          <CheckField label="COMPLETED" value={form.completed} onChange={v => setForm(f => ({ ...f, completed: v }))} />
        </div>
        <div className="flex gap-4 border-t border-white/5 pt-8">
          <button onClick={save} className="px-8 py-3 bg-cobalt text-white text-[10px] font-black uppercase tracking-widest">SAVE_GOAL</button>
          {editingIdx !== null && <button onClick={() => { setItems(items.filter((_, i) => i !== editingIdx)); setEditingIdx(null); setForm({ text: '', completed: false }); }} className="text-err text-[10px] font-black uppercase tracking-widest ml-auto">DELETE</button>}
        </div>
      </div>
    </div>
  );
}

/* --- Settings Tab --- */

function SettingsTab({ onLog }: { onLog: (msg: string) => void }) {
  const [settings, setSettings] = useState<SiteSettings>({ 
    availabilityValue: 99.9, 
    status: 'ONLINE', 
    logLimit: 10, 
    cvUrl: '',
    dustThresholdDays: 60,
    starsForGold: 5
  });
  const [cvLoading, setCvLoading] = useState(false);

  useEffect(() => { const s = localStorage.getItem('portfolioSettings'); if (s) setSettings(JSON.parse(s)); }, []);

  function update(partial: Partial<SiteSettings>) {
    const next = { ...settings, ...partial }; setSettings(next);
    localStorage.setItem('portfolioSettings', JSON.stringify(next));
    onLog(`PARAM_MODIFIED: ${Object.keys(partial)[0].toUpperCase()}`);
  }

  async function uploadCv(e: any) {
    const file = e.target.files?.[0]; if (!file) return;
    setCvLoading(true); onLog('UPLOADING_CV...');
    try {
      const reader = new FileReader();
      const b64 = await new Promise(r => { reader.onload = () => r((reader.result as string).split(',')[1]); reader.readAsDataURL(file); });
      const res = await fetch('/api/github', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'uploadCv', base64: b64, repo: import.meta.env.PUBLIC_GITHUB_REPO }) });
      if (!res.ok) throw new Error('API_REJECTED');
      update({ cvUrl: '/cv.pdf' }); onLog('CV_UPLOAD_SUCCESS');
    } catch (e: any) { onLog(`CV_UPLOAD_ERROR: ${e.message}`); }
    finally { setCvLoading(false); }
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-[#222222] border border-white/10 p-10 space-y-10 shadow-2xl">
          <p className="text-[11px] text-white font-black tracking-widest uppercase">/ MASTER_CONTROLS</p>
          <div className="space-y-6">
            <Field label="AVAILABILITY (%)"><input type="range" min={0} max={100} step={0.1} value={settings.availabilityValue} onChange={e => update({ availabilityValue: Number(e.target.value) })} className="w-full accent-cobalt h-1 bg-white/5 appearance-none" /></Field>
            <Field label="SYSTEM_STATUS"><select value={settings.status} onChange={e => update({ status: e.target.value as any })} className={inputClass}><option value="ONLINE">ONLINE</option><option value="BUSY">BUSY</option><option value="OFFLINE">OFFLINE</option></select></Field>
            <Field label="LOG_LIMIT"><input type="number" value={settings.logLimit} onChange={e => update({ logLimit: Number(e.target.value) })} className={inputClass} /></Field>
          </div>
        </div>
        <div className="bg-[#222222] border border-white/10 p-10 space-y-10 shadow-2xl">
          <p className="text-[11px] text-white font-black tracking-widest uppercase">/ ENGINE_PARAMS</p>
          <div className="space-y-8">
            <Field label={`DUST_THRESHOLD: ${settings.dustThresholdDays} DAYS`}><input type="range" min={7} max={365} value={settings.dustThresholdDays} onChange={e => update({ dustThresholdDays: Number(e.target.value) })} className="w-full accent-warn h-1 bg-white/5 appearance-none" /></Field>
            <Field label={`GOLD_REQUIREMENT: ${settings.starsForGold} STARS`}><input type="range" min={0} max={50} value={settings.starsForGold} onChange={e => update({ starsForGold: Number(e.target.value) })} className="w-full accent-bronze h-1 bg-white/5 appearance-none" /></Field>
          </div>
        </div>
        <div className="bg-[#222222] border border-white/10 p-10 space-y-10 shadow-2xl col-span-2">
          <p className="text-[11px] text-white font-black tracking-widest uppercase">/ ASSETS_&_CACHE</p>
          <div className="space-y-6">
            <Field label="CV_ENDPOINT">
              <div className="flex gap-4 items-center">
                <input value={settings.cvUrl} readOnly className={`${inputClass} flex-1 text-white/40`} />
                <input type="file" onChange={uploadCv} className="hidden" id="cv-up" />
                <label htmlFor="cv-up" className="px-6 py-2 border border-white text-white text-[10px] font-black uppercase cursor-pointer hover:bg-white hover:text-black transition-all">{cvLoading ? '...' : 'UPLOAD'}</label>
              </div>
            </Field>
            <div className="pt-6 border-t border-black/5">
              <button onClick={() => { if(confirm('RESET?')) { localStorage.clear(); window.location.reload(); } }} className="w-full py-4 border border-red-500/30 text-red-500 text-[10px] font-black uppercase hover:bg-red-500/5 transition-all">FACTORY_RESET_CACHE</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- Publish Tab --- */

function PublishTab({ onLog }: { onLog: (msg: string) => void }) {
  const repo = import.meta.env.PUBLIC_GITHUB_REPO;
  const [publishing, setPublishing] = useState(false);
  const [builds, setBuilds] = useState<BuildEntry[]>([]);

  useEffect(() => { const s = localStorage.getItem('portfolioBuildHistory'); if (s) setBuilds(JSON.parse(s)); }, []);

  async function publish() {
    setPublishing(true); onLog('INIT_GLOBAL_SYNC...');
    try {
      const keys = ['portfolioProjects', 'portfolioSettings', 'portfolioExperience', 'portfolioAmbitions', 'portfolioTechstack'];
      const files = keys.filter(k => !!localStorage.getItem(k)).map(k => ({ path: `public/data/${k.replace('portfolio', '').toLowerCase()}.json`, content: localStorage.getItem(k)! }));
      const res = await fetch('/api/github', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'publish', repo, branch: 'main', files }) });
      if (!res.ok) throw new Error('BRIDGE_REJECTED');
      onLog('UPLINK_SUCCESS');
      const entry: BuildEntry = { buildNumber: (builds[0]?.buildNumber ?? 0) + 1, status: 'SUCCESS', timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '), files: files.map(f => f.path.split('/').pop()!) };
      const next = [entry, ...builds].slice(0, 10); localStorage.setItem('portfolioBuildHistory', JSON.stringify(next)); setBuilds(next);
    } catch (e: any) { onLog(`UPLINK_ERROR: ${e.message}`); }
    finally { setPublishing(false); }
  }

  return (
    <div className="flex flex-col gap-12">
      <div className="bg-[#222222] border border-white/10 p-12 flex flex-col gap-10 shadow-2xl">
        <div><p className="text-[13px] text-white font-black tracking-[0.3em] uppercase mb-2">/ DEPLOYMENT_BRIDGE</p><p className="text-[11px] text-white/40 tracking-widest uppercase">Sync local state with production grid.</p></div>
        <div className="p-6 bg-black border border-white/10 shadow-inner"><p className="text-[9px] text-white/30 tracking-widest uppercase mb-1">target_uplink:</p><p className="text-[12px] text-cobalt font-black tracking-[0.2em]">{repo}</p></div>
        <button onClick={publish} disabled={publishing} className="bg-cobalt text-white text-[11px] font-black tracking-[0.4em] py-6 hover:bg-cobalt-light transition-all shadow-[0_0_50px_rgba(0,85,255,0.2)]">{publishing ? 'SYNCHRONIZING...' : 'EXECUTE_PUBLISH_SEQUENCE \u2191'}</button>
      </div>
      <div className="space-y-6">
        <p className="text-[10px] text-white/40 tracking-widest font-black uppercase">/ BUILD_HISTORY</p>
        <div className="border border-white/10 bg-[#222222] divide-y divide-white/5 shadow-2xl">
          {builds.map(b => (
            <div key={b.buildNumber} className="px-8 py-4 flex items-center justify-between group hover:bg-white/5">
              <div className="flex items-center gap-6"><span className="text-cobalt font-black">#{b.buildNumber}</span><span className="text-[10px] text-white tracking-widest uppercase">{b.status}</span><span className="text-[10px] text-white/30 font-mono">{b.timestamp}</span></div>
              <span className="text-[9px] text-white/20 tracking-widest italic opacity-0 group-hover:opacity-100 transition-opacity">[{b.files.join(', ')}]</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --- Main Admin Panel --- */

export default function AdminPanel() {
  const [auth, setAuth] = useState(false);
  const [tab, setTab] = useState<string>('projects');
  const [logs, setLogs] = useState<string[]>(['SYSTEM_READY', 'AWAITING_INPUT']);

  const addLog = useCallback((msg: string) => { setLogs(prev => [`${new Date().toLocaleTimeString()} > ${msg}`, ...prev].slice(0, 50)); }, []);

  useEffect(() => {
    if (isSessionValid()) setAuth(true);
  }, []);

  if (!auth) return <PasswordGate onAuth={() => setAuth(true)} />;

  return (
    <div className="h-screen bg-[#1a1a1a] flex overflow-hidden font-mono text-white select-none">
      
      {/* Sidebar Nav */}
      <aside className="w-80 border-r border-white/5 flex flex-col shrink-0 bg-[#222222] shadow-2xl z-10">
        <div className="p-12 border-b border-white/5 flex flex-col gap-2">
          <p className="text-[15px] text-white font-black tracking-[0.4em] uppercase leading-none">Core_Admin</p>
          <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-cobalt rounded-full animate-pulse shadow-[0_0_10px_rgba(0,85,255,0.8)]" /><p className="text-[9px] text-cobalt tracking-widest uppercase font-black">Active_Session</p></div>
        </div>
        <nav className="flex-1 p-6 flex flex-col gap-2">
          {[
            { id: 'projects', label: 'PROJECT_MODULES' },
            { id: 'tech', label: 'TECH_REGISTRY' },
            { id: 'ambitions', label: 'ROADMAP_MAPPER' },
            { id: 'settings', label: 'SYSTEM_CONFIG' },
            { id: 'publish', label: 'PUBLISH_BRIDGE' },
          ].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); addLog(`NAV_TO: ${t.id.toUpperCase()}`); }} className={`text-left px-8 py-5 text-[11px] font-black tracking-[0.3em] uppercase transition-all duration-200 border-l-2 ${tab === t.id ? 'bg-cobalt/10 text-cobalt border-l-cobalt shadow-[inset_0_0_20px_rgba(0,85,255,0.05)]' : 'border-l-transparent text-white/20 hover:text-white/40'}`}>
              {t.label}
            </button>
          ))}
        </nav>
        
        <div className="p-10 border-t border-white/5 flex flex-col gap-4">
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full py-4 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3"
          >
            <span>←</span> EXIT_TO_SITE
          </button>
          <button 
            onClick={() => { sessionStorage.removeItem(SESSION_KEY); window.location.reload(); }} 
            className="text-[10px] text-red-400/40 hover:text-red-400 tracking-widest uppercase transition-all text-center"
          >
            ✕ TERMINATE_SESSION
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#1a1a1a]">
        <div className="flex-1 overflow-y-auto px-20 py-16 custom-scrollbar island-load">
          <div className="max-w-5xl">
            {tab === 'projects'   && <ProjectsTab onLog={addLog} />}
            {tab === 'tech'       && <TechTab onLog={addLog} />}
            {tab === 'ambitions'  && <AmbitionsTab onLog={addLog} />}
            {tab === 'settings'   && <SettingsTab onLog={addLog} />}
            {tab === 'publish'    && <PublishTab onLog={addLog} />}
          </div>
        </div>
      </main>

      {/* History Sidebar */}
      <aside className="w-80 border-l border-white/5 bg-[#222222] flex flex-col shrink-0 shadow-2xl z-10">
        <div className="p-10 border-b border-white/5 bg-[#222222]"><p className="text-[10px] text-white/40 tracking-widest font-black uppercase leading-none">/ SESSION_HISTORY</p></div>
        <div className="flex-1 p-8 flex flex-col gap-1 overflow-y-auto text-[10px] opacity-20 hover:opacity-100 transition-opacity">
          {logs.map((l, i) => <p key={i} className={`py-1 border-b border-white/[0.03] ${i === 0 ? 'text-cobalt font-black' : 'text-white/40'}`}> {l}</p>)}
        </div>
        <div className="p-10 bg-[#222222] border-t border-white/5 flex flex-col gap-4">
          <div className="flex flex-col gap-1"><span className="text-[9px] text-white/20 uppercase tracking-widest font-black italic">operator:</span><p className="text-[11px] text-white font-black uppercase">admin@gest_core</p></div>
          <div className="flex flex-col gap-1"><span className="text-[9px] text-white/20 uppercase tracking-widest font-black italic">status:</span><p className="text-[11px] text-white font-black uppercase">ENCRYPTED</p></div>
        </div>
      </aside>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); }
        .island-load { animation: reveal-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes reveal-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}
