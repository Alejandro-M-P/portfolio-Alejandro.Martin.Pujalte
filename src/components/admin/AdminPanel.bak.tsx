// FORCE_REFRESH_V1_CORE
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Project, TechTool, Ambition, Experience, SiteSettings, BuildEntry } from '../../types';
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
  specsStars: string;
  specsRepo: string;
  specsRepoSlug: string;
  specsStatus: string;
  pushedAt: string;
  stack: string;
  architecture: string;
}

function parseReadme(raw: string) {
  const archMatch = raw.match(/#+\s*(architect\w*|structure|design|overview)[^\n]*\n([\s\S]*?)(?=\n#+\s|\n---|\n___|\n\*\*\*|$)/i);
  const architecture = archMatch ? archMatch[2].replace(/```[\s\S]*?```/g, '').replace(/[#*`]/g, '').trim().slice(0, 400) : '';
  const techMatches = raw.match(/`([A-Za-z][A-Za-z0-9+#._-]{1,20})`/g) ?? [];
  const stack = [...new Set(techMatches.map(t => t.replace(/`/g, '').toUpperCase()))].slice(0, 12);
  return { architecture, stack };
}

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

const inputClass = "bg-transparent border-b border-white/10 px-0 py-2 text-[13px] text-white font-mono w-full focus:outline-none focus:border-cobalt transition-colors duration-100 placeholder:opacity-20";

/* ─── Shared Industrial Components ─── */

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] text-text-faint tracking-widest uppercase font-bold">// {label}{required && <span className="text-cobalt ml-1">*</span>}</label>
      {children}
    </div>
  );
}

function CheckField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none group">
      <div className={`w-3 h-3 border ${value ? 'bg-cobalt border-cobalt' : 'border-white/20 group-hover:border-white/40'} transition-colors`} />
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} className="hidden" />
      <span className="text-[10px] text-text-muted tracking-widest uppercase group-hover:text-white transition-colors">{label}</span>
    </label>
  );
}

/* ─── Password Gate ─── */

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
          setErr('SYSTEM_LOCKOUT_ENFORCED');
        } else { setErr(`ACCESS_DENIED: ${MAX_ATTEMPTS - attempts} ATTEMPTS_REMAINING`); }
        setPw('');
      }
    } finally { setLoading(false); }
  }

  const mins = Math.floor(countdown / 60);
  const secs = String(countdown % 60).padStart(2, '0');

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-start justify-start p-16 font-mono select-none">
      <div className="flex flex-col gap-12 w-full max-w-2xl border-l border-white/5 pl-12">
        <div className="flex flex-col gap-3">
          <p className="text-[12px] text-cobalt tracking-[0.4em] font-bold uppercase">CORE_CONSOLE // AUTHORIZATION_REQUIRED</p>
          <div className="h-px bg-white/5 w-full" />
        </div>
        <form onSubmit={submit} className="flex flex-col gap-12">
          <div className="flex flex-col gap-4">
            <label className="text-[11px] text-text-faint tracking-widest uppercase font-bold">// ACCESS_TOKEN_INPUT</label>
            <div className="flex items-center gap-4">
              <span className="text-cobalt text-xl font-bold animate-pulse">$</span>
              <input type="password" value={pw} onChange={e => setPw(e.target.value)} className="bg-transparent border-none p-0 text-white focus:outline-none w-full text-xl tracking-[0.5em]" placeholder="••••••••" autoFocus disabled={countdown > 0 || loading} />
            </div>
          </div>
          {countdown > 0 ? (
            <div className="p-6 border border-err/30 bg-err/5 text-xs text-err tracking-widest leading-relaxed uppercase font-bold">SYSTEM_LOCKOUT: {mins}:{secs} REMAINING</div>
          ) : err ? (
            <p className="text-xs text-err tracking-widest animate-pulse uppercase font-bold">// {err}</p>
          ) : (
            <p className="text-[11px] text-text-faint tracking-widest italic opacity-30 uppercase">Ready for manual override...</p>
          )}
          <button type="submit" disabled={countdown > 0 || loading} className="self-start text-[11px] font-bold tracking-widest uppercase py-4 px-10 border border-white/10 text-white/40 hover:text-cobalt hover:border-cobalt transition-all">{loading ? 'DECRYPTING...' : 'INITIALIZE_ADMIN_BRIDGE \u2192'}</button>
        </form>
      </div>
    </div>
  );
}

/* ─── Projects Tab ─── */

const emptyProject = {
  id: '', name: '', gitUrl: '', photo: '', video: '', stack: '', architecture: '', initSequence: '', description: '', businessImpact: '',
  specsStatus: '', specsStars: '', specsLanguage: '', specsLicense: '', specsDescription: '', specsRepo: '', specsRepoSlug: '', specsDemo: '', specsTags: '',
  isHighlighted: false, isPrivate: false, isFavorite: false, pushedAt: '', order: 0
};

function ProjectsTab({ onLog }: { onLog: (msg: string) => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState(emptyProject);
  const [editing, setEditing] = useState<string | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [privateMode, setPrivateMode] = useState(false);
  const [manualReadme, setManualReadme] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    const stored = localStorage.getItem('portfolioProjects');
    if (stored) setProjects(JSON.parse(stored));
  }, []);

  useEffect(() => { load(); }, [load]);


  async function fetchGitHub() {
    const urlMatch = form.gitUrl.trim().match(/github\.com\/([^/]+)\/([^/\s]+)/);
    if (!urlMatch) { onLog('ERROR: INVALID_URL'); return; }
    const repoSlug = `${urlMatch[1]}/${urlMatch[2].replace(/\.git$/, '')}`;
    setScanLoading(true); onLog(`SCANNING_REPO: ${repoSlug}...`);
    try {
      const res = await fetch('/api/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getRepoDetails', repoSlug })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `GH_${res.status}`);
      }
      const r = await res.json() as GitHubDetails;
      
      setForm(f => ({
        ...f,
        id: f.id || r.id,
        name: r.name,
        photo: f.photo || r.photo,
        specsDescription: r.specsDescription,
        specsLanguage: r.specsLanguage,
        specsStars: r.specsStars,
        specsRepo: r.specsRepo,
        specsRepoSlug: r.specsRepoSlug,
        specsStatus: r.specsStatus,
        pushedAt: r.pushedAt,
        stack: r.stack,
        architecture: r.architecture || f.architecture
      }));
      onLog(`SYNC_SUCCESS: ${repoSlug}`);
    } catch (e: any) { onLog(`SYNC_FAILED: ${e.message}`); setPrivateMode(true); }
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
    const specs: any = { status: form.specsStatus, stars: form.specsStars, language: form.specsLanguage, license: form.specsLicense, description: form.specsDescription, repo: form.specsRepo, repoSlug: form.specsRepoSlug, demo: form.specsDemo, tags: form.specsTags.split(',').filter(Boolean), video: form.video };
    const p: Project = { id: form.id || String(Date.now()), name: form.name.toUpperCase(), photo: form.photo, stack: form.stack.split(',').map(s => s.trim().toUpperCase()).filter(Boolean), architecture: form.architecture, initSequence: form.initSequence, description: form.description, businessImpact: form.businessImpact, specs, isHighlighted: form.isHighlighted, isFavorite: form.isFavorite, isPrivate: form.isPrivate, pushedAt: form.pushedAt || undefined, order: Number(form.order) || 0 };
    const next = editing ? projects.map(x => x.id === editing ? p : x) : [...projects, p];
    localStorage.setItem('portfolioProjects', JSON.stringify(next));
    setProjects(next); onLog(`MODULE_COMMITTED: ${p.name}`); setEditing(p.id);
  }

  function select(p: Project) {
    setEditing(p.id); onLog(`SELECT: ${p.id}`);
    setForm({ ...emptyProject, id: p.id, name: p.name, photo: p.photo, video: (p.specs?.video as string) || '', stack: p.stack.join(', '), architecture: p.architecture, initSequence: p.initSequence, description: p.description ?? '', businessImpact: p.businessImpact ?? '', specsStatus: (p.specs?.status as string) || '', specsStars: (p.specs?.status as string) || '', specsLanguage: (p.specs?.language as string) || '', specsLicense: (p.specs?.license as string) || '', specsDescription: (p.specs?.description as string) || '', specsRepo: (p.specs?.repo as string) || '', specsRepoSlug: (p.specs?.repoSlug as string) || '', specsDemo: (p.specs?.demo as string) || '', specsTags: Array.isArray(p.specs?.tags) ? p.specs.tags.join(', ') : '', isHighlighted: !!p.isHighlighted, isFavorite: !!p.isFavorite, isPrivate: !!p.isPrivate, pushedAt: p.pushedAt || '', order: p.order || 0 });
  }

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-6">
        <header className="flex justify-between items-center border-b border-white/5 pb-3">
          <p className="text-[11px] text-cobalt tracking-widest font-bold uppercase">// MODULE_REPOSITORY</p>
          <button onClick={() => { setEditing(null); setForm(emptyProject); onLog('MODE: INITIALIZE'); }} className="text-[10px] text-white/40 hover:text-white tracking-widest">[+] NEW_MODULE</button>
        </header>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {projects.map(p => (
            <div key={p.id} onClick={() => select(p)} className={`p-5 border transition-all cursor-pointer ${editing === p.id ? 'border-cobalt bg-cobalt/5' : 'border-white/5 hover:border-white/20 bg-white/1'}`}>
              <p className="text-[11px] font-bold text-white mb-1 uppercase truncate">{p.name}</p>
              <div className="flex justify-between items-center opacity-30">
                <p className="text-[9px] text-text-faint tracking-widest uppercase">{p.id}</p>
                {p.isFavorite && <span className="text-bronze text-[10px]">★</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white/1 border border-white/5 p-12 relative">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-cobalt/20" />
        <p className="text-[12px] text-white tracking-[0.3em] font-bold uppercase mb-10">// {editing ? `TERMINAL_CONFIG: ${editing}` : 'INITIALIZING_DATA'}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-10">
          <Field label="ID" required><input value={form.id} onChange={e => setForm(f => ({ ...f, id: e.target.value }))} className={inputClass} placeholder="01_CORE" /></Field>
          <Field label="NAME" required><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} placeholder="SYSTEM_MODULE" /></Field>
          
          <div className="col-span-2 flex gap-6">
            <div className="flex-1"><Field label="GITHUB_ENDPOINT"><input value={form.gitUrl} onChange={e => setForm(f => ({ ...f, gitUrl: e.target.value }))} className={inputClass} placeholder="https://github.com/..." /></Field></div>
            <button onClick={fetchGitHub} disabled={scanLoading} className="self-end px-8 py-3 border border-cobalt/40 text-cobalt text-[11px] font-bold tracking-widest hover:bg-cobalt/10 uppercase transition-all">{scanLoading ? 'SCANNING...' : 'SYNC_METADATA'}</button>
          </div>

          {privateMode && (
            <div className="col-span-2 border border-warn/30 bg-warn/5 p-6 space-y-4">
              <p className="text-[10px] text-warn tracking-widest font-bold uppercase">// MANUAL_PARSING_MODE</p>
              <textarea value={manualReadme} onChange={e => setManualReadme(e.target.value)} className={`${inputClass} h-32 border-white/5 bg-black/20 p-4`} placeholder="Paste README.md here for manual metadata extraction..." />
              <button onClick={() => { const { architecture, stack } = parseReadme(manualReadme); setForm(f => ({ ...f, architecture, stack: stack.join(', ') })); onLog('README_PARSED'); }} className="px-6 py-2 border border-warn/40 text-warn text-[10px] font-bold tracking-widest hover:bg-warn/10 uppercase transition-all">EXEC_PARSE_BUFFER</button>
            </div>
          )}

          <div className="col-span-2 bg-carbono-low border border-white/5 p-6 flex flex-wrap gap-12">
            <CheckField label="HIGH_VALUE (ORO)" value={form.isHighlighted} onChange={v => setForm(f => ({ ...f, isHighlighted: v }))} />
            <CheckField label="PINNED (FAVORITO)" value={form.isFavorite} onChange={v => setForm(f => ({ ...f, isFavorite: v }))} />
            <CheckField label="REDACTED (PRIVADO)" value={form.isPrivate} onChange={v => setForm(f => ({ ...f, isPrivate: v }))} />
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
              {form.photo && <div className="border border-white/10 p-2 bg-carbono-low"><img src={form.photo} className="h-32 w-full object-cover opacity-60" /></div>}
            </div>
            <div className="space-y-4">
              <Field label="STREAM_SOURCE [VIDEO]"><input value={form.video} onChange={e => setForm(f => ({ ...f, video: e.target.value }))} className={inputClass} /></Field>
              {form.video && <div className="border border-white/10 p-2 bg-carbono-low h-32 flex items-center justify-center"><p className="text-[9px] text-cobalt tracking-widest font-bold uppercase animate-pulse">● SIGNAL_ESTABLISHED</p></div>}
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

        <div className="mt-12 flex items-center gap-10">
          <button onClick={save} className="bg-cobalt text-white text-[11px] font-bold tracking-[0.3em] uppercase px-12 py-5 hover:bg-cobalt-light transition-all shadow-[0_0_30px_rgba(0,85,255,0.2)]">COMMIT_CHANGES [CTRL+S]</button>
          {editing && <button onClick={() => { if(confirm('DECOMMISSION?')) { const n = projects.filter(x => x.id !== editing); localStorage.setItem('portfolioProjects', JSON.stringify(n)); load(); setEditing(null); onLog(`REMOVED: ${editing}`); } }} className="text-[10px] text-err/50 hover:text-err tracking-widest uppercase">DECOMMISSION</button>}
        </div>
      </div>
    </div>
  );
}

/* ─── Tech Tab ─── */

function TechTab({ onLog }: { onLog: (msg: string) => void }) {
  const [tools, setTools] = useState<TechTool[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', version: '', usageLevel: 80 });
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => { const s = localStorage.getItem('portfolioTechstack'); if (s) setTools(JSON.parse(s)); }, []);
  useEffect(() => { load(); }, [load]);

  async function scanAll() {
    const s = localStorage.getItem('portfolioProjects'); if (!s) return;
    const projects = JSON.parse(s) as Project[];
    const slugs = projects.map(p => p.specs?.repoSlug as string).filter(Boolean);
    setLoading(true); onLog(`SCANNING_${slugs.length}_REPOS...`);
    try {
      const results = await Promise.all(slugs.map(slug => 
        fetch(`/api/github`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ action: 'getRepoDetails', repoSlug: slug }) 
        }).then(r => r.ok ? r.json() : {}) as Promise<Partial<GitHubDetails>>
      ));
      const totals: Record<string, number> = {};
      for (const r of results) { 
        if (!r?.stack) continue;
        const stackItems = r.stack.split(',').map((s: string) => s.trim().toUpperCase());
        for (const item of stackItems) {
          totals[item] = (totals[item] || 0) + 1; // Simplified weighting for now
        }
      }
      const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
      const max = sorted[0]?.[1] || 1;
      const derived = sorted.map(([n, v]) => ({ name: n.toUpperCase(), version: '', usageLevel: Math.round((v/max) * 100) }));
      setTools(derived); localStorage.setItem('portfolioTechstack', JSON.stringify(derived));
      onLog(`SCAN_COMPLETE: ${sorted.length} MODULES DETECTED`);
    } catch (e: any) { onLog(`SCAN_ERROR: ${e.message}`); }
    finally { setLoading(false); }
  }

  function save() {
    if (!form.name) return;
    const tool = { ...form, name: form.name.toUpperCase() };
    const next = editing !== null ? tools.map((t, i) => i === editing ? tool : t) : [...tools, tool];
    setTools(next); localStorage.setItem('portfolioTechstack', JSON.stringify(next));
    setForm({ name: '', version: '', usageLevel: 80 }); setEditing(null); onLog(`TECH_SAVED: ${tool.name}`);
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="flex justify-between items-center border-b border-white/5 pb-3">
        <p className="text-[11px] text-cobalt tracking-widest font-bold uppercase">// TECH_MATRIX_REGISTRY</p>
        <button onClick={scanAll} disabled={loading} className="text-[10px] text-cobalt hover:underline uppercase transition-all tracking-widest">{loading ? 'SCANNING_GITHUB...' : '[REFRESH_FROM_GITHUB]'}</button>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tools.map((t, i) => (
          <div key={t.name} onClick={() => { setEditing(i); setForm(t); }} className={`p-6 border transition-all cursor-pointer ${editing === i ? 'border-cobalt bg-cobalt/5' : 'border-white/5 bg-white/1 hover:border-white/20'}`}>
            <div className="flex justify-between items-center mb-4">
              <p className="text-[12px] font-bold text-white uppercase">{t.name}</p>
              <span className="text-[11px] text-cobalt font-bold">{t.usageLevel}%</span>
            </div>
            <div className="h-1 bg-white/5 w-full"><div className="h-full bg-cobalt transition-all" style={{ width: `${t.usageLevel}%` }} /></div>
          </div>
        ))}
      </div>
      <div className="bg-white/1 border border-white/5 p-10 space-y-8">
        <p className="text-[11px] text-white tracking-widest font-bold uppercase">// {editing !== null ? 'UPDATE_TOOL' : 'ADD_NEW_TOOL'}</p>
        <div className="grid grid-cols-3 gap-8">
          <Field label="NAME"><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} /></Field>
          <Field label="VERSION"><input value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} className={inputClass} /></Field>
          <Field label="USAGE_%"><input type="number" value={form.usageLevel} onChange={e => setForm(f => ({ ...f, usageLevel: Number(e.target.value) }))} className={inputClass} /></Field>
        </div>
        <div className="flex gap-4"><button onClick={save} className="px-8 py-3 bg-cobalt text-white text-[10px] font-bold uppercase tracking-widest">SAVE_TOOL</button>
        {editing !== null && <button onClick={() => { setTools(tools.filter((_, i) => i !== editing)); setEditing(null); setForm({ name: '', version: '', usageLevel: 80 }); }} className="text-err text-[10px] font-bold uppercase tracking-widest ml-auto">DELETE</button>}</div>
      </div>
    </div>
  );
}

/* ─── Ambitions Tab ─── */

function AmbitionsTab({ onLog }: { onLog: (msg: string) => void }) {
  const [items, setItems] = useState<Ambition[]>([]);
  const [form, setForm] = useState({ text: '', section: 'short' as any });
  const [editing, setEditing] = useState<string | null>(null);

  const load = useCallback(() => { const s = localStorage.getItem('portfolioAmbitions'); if (s) setItems(JSON.parse(s)); }, []);
  useEffect(() => { load(); }, [load]);

  function save() {
    if (!form.text) return;
    const item = { id: editing || `${form.section}-${Date.now()}`, text: form.text, section: form.section, completed: false };
    const next = editing ? items.map(i => i.id === editing ? item : i) : [...items, item];
    setItems(next); localStorage.setItem('portfolioAmbitions', JSON.stringify(next));
    setForm({ text: '', section: 'short' }); setEditing(null); onLog('ROADMAP_UPDATED');
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="border-b border-white/5 pb-3"><p className="text-[11px] text-cobalt tracking-widest font-bold uppercase">// STRATEGIC_ROADMAP</p></header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['short', 'mid', 'long'].map(sec => (
          <div key={sec} className="bg-white/1 border border-white/5 p-6 flex flex-col gap-4">
            <p className="text-[10px] text-cobalt font-bold tracking-widest uppercase">{sec}_TERM</p>
            <div className="flex flex-col gap-2">
              {items.filter(i => i.section === sec).map(i => (
                <div key={i.id} onClick={() => { setEditing(i.id); setForm({ text: i.text, section: i.section }); }} className="text-[11px] text-text-muted hover:text-white cursor-pointer transition-colors p-2 border border-transparent hover:border-white/5 hover:bg-white/2 flex items-start gap-2"><span className="text-cobalt opacity-40">\u25b8</span> {i.text}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white/1 border border-white/5 p-10 space-y-8">
        <p className="text-[11px] text-white font-bold uppercase">// {editing ? 'EDIT_OBJECTIVE' : 'ADD_OBJECTIVE'}</p>
        <div className="flex gap-8">
          <div className="flex-1"><Field label="GOAL_DESCRIPTION"><input value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} className={inputClass} /></Field></div>
          <div className="w-48"><Field label="TIMEFRAME"><select value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value as any }))} className={inputClass}><option value="short">SHORT</option><option value="mid">MID</option><option value="long">LONG</option></select></Field></div>
        </div>
        <button onClick={save} className="px-8 py-3 bg-cobalt text-white text-[10px] font-bold uppercase">SAVE_GOAL</button>
      </div>
    </div>
  );
}

/* ─── Settings Tab ─── */

function SettingsTab({ onLog }: { onLog: (msg: string) => void }) {
  const [settings, setSettings] = useState<SiteSettings>({ availabilityValue: 99.9, dustThresholdDays: 60, starsForGold: 5, status: 'ONLINE', logLimit: 10 });
  const [cvLoading, setCvLoading] = useState(false);

  useEffect(() => { const s = localStorage.getItem('portfolioSettings'); if (s) setSettings(JSON.parse(s)); }, []);

  function update(partial: Partial<SiteSettings>) {
    const next = { ...settings, ...partial }; setSettings(next);
    localStorage.setItem('portfolioSettings', JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('portfolioSettingsChanged'));
    onLog(`PARAM_MODIFIED: ${Object.keys(partial)[0].toUpperCase()}`);
  }

  async function uploadCv(e: any) {
    const file = e.target.files?.[0]; if (!file) return;
    setCvLoading(true); onLog('CV_UPLOAD_INITIALIZED...');
    try {
      const b64 = await new Promise(r => { const rd = new FileReader(); rd.onload = () => r((rd.result as string).split(',')[1]); rd.readAsDataURL(file); });
      const res = await fetch('/api/github', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'uploadCv', base64: b64, repo: import.meta.env.PUBLIC_GITHUB_REPO }) });
      if (!res.ok) throw new Error('API_REJECTED');
      update({ cvUrl: '/cv.pdf' }); onLog('CV_UPLOAD_SUCCESS');
    } catch (e: any) { onLog(`CV_UPLOAD_ERROR: ${e.message}`); }
    finally { setCvLoading(false); }
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-2 gap-10">
        <div className="bg-white/1 border border-white/5 p-10 space-y-10">
          <p className="text-[11px] text-cobalt tracking-widest font-bold uppercase">// MASTER_CONTROLS</p>
          <div className="space-y-6">
            <Field label="AVAILABILITY (%)"><input type="range" min={0} max={100} step={0.1} value={settings.availabilityValue} onChange={e => update({ availabilityValue: Number(e.target.value) })} className="w-full accent-cobalt h-1 bg-white/5 appearance-none" /></Field>
            <Field label="SYSTEM_STATUS"><select value={settings.status} onChange={e => update({ status: e.target.value as any })} className={inputClass}><option value="ONLINE">ONLINE</option><option value="BUSY">BUSY</option><option value="OFFLINE">OFFLINE</option></select></Field>
            <div className="pt-6 border-t border-white/5 space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-[10px] text-text-faint tracking-widest uppercase font-bold">// SECURE_CV_UPLINK</p>
                {settings.cvUrl && (
                  <a 
                    href={settings.cvUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[9px] text-cobalt hover:underline tracking-widest uppercase font-bold"
                  >
                    [ VIEW_CURRENT_CV ]
                  </a>
                )}
              </div>
              <input type="file" onChange={uploadCv} className="hidden" id="cv-up" />
              <label htmlFor="cv-up" className="block text-center border border-white/10 p-4 cursor-pointer text-[10px] text-white/40 hover:text-white hover:border-cobalt transition-all uppercase tracking-widest font-bold">{cvLoading ? 'UPLOADING...' : '[ CLICK_TO_UPLOAD_PDF ]'}</label>
            </div>
          </div>
        </div>
        <div className="bg-white/1 border border-white/5 p-10 space-y-10">
          <p className="text-[11px] text-cobalt tracking-widest font-bold uppercase">// ENGINE_PARAMS</p>
          <div className="space-y-8">
            <Field label="DUST_THRESHOLD (DAYS)"><input type="range" min={7} max={365} value={settings.dustThresholdDays} onChange={e => update({ dustThresholdDays: Number(e.target.value) })} className="w-full accent-warn h-1 bg-white/5 appearance-none" /></Field>
            <Field label="GOLD_REQUIREMENT (STARS)"><input type="range" min={0} max={50} value={settings.starsForGold} onChange={e => update({ starsForGold: Number(e.target.value) })} className="w-full accent-bronze h-1 bg-white/5 appearance-none" /></Field>
          </div>
          <div className="pt-10 border-t border-err/20">
            <button onClick={() => { if(confirm('RESET?')) { localStorage.clear(); window.location.reload(); } }} className="w-full py-4 border border-err/30 text-err text-[10px] font-bold uppercase hover:bg-err/10 transition-all">FACTORY_RESET_CACHE</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Publish Tab ─── */

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
      <div className="bg-white/1 border border-white/5 p-12 flex flex-col gap-10">
        <div><p className="text-[13px] text-white tracking-[0.3em] font-bold uppercase mb-2">// DEPLOYMENT_BRIDGE</p><p className="text-[11px] text-text-faint tracking-widest uppercase opacity-40">Sync local state with remote production grid. Rebuild latency: ~60s.</p></div>
        <div className="p-6 bg-black/40 border border-white/10"><p className="text-[9px] text-text-faint tracking-widest uppercase mb-1">target_uplink:</p><p className="text-[12px] text-cobalt font-bold tracking-[0.2em]">{repo}</p></div>
        <button onClick={publish} disabled={publishing} className="bg-cobalt text-white text-[11px] font-bold tracking-[0.4em] py-6 hover:bg-cobalt-light transition-all shadow-[0_0_50px_rgba(0,85,255,0.2)]">{publishing ? 'SYNCHRONIZING_BUFFERS...' : 'EXECUTE_PUBLISH_SEQUENCE \u2191'}</button>
      </div>
      <div className="space-y-6">
        <p className="text-[10px] text-text-faint tracking-widest font-bold uppercase">// BUILD_HISTORY</p>
        <div className="border border-white/5 bg-black/20 divide-y divide-white/5">
          {builds.map(b => (
            <div key={b.buildNumber} className="px-8 py-4 flex items-center justify-between group hover:bg-white/1">
              <div className="flex items-center gap-6"><span className="text-cobalt font-bold">#{b.buildNumber}</span><span className="text-[10px] text-white tracking-widest">{b.status}</span><span className="text-[10px] text-text-faint opacity-40 font-mono">{b.timestamp}</span></div>
              <span className="text-[9px] text-text-faint tracking-widest italic opacity-0 group-hover:opacity-30 transition-opacity">[{b.files.join(', ')}]</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Admin Panel Console ─── */

export default function AdminPanel() {
  const [auth, setAuth] = useState(false);
  const [tab, setTab] = useState<any>('projects');
  const [ready, setReady] = useState(false);
  const [logs, setLogs] = useState<string[]>(['CORE_SYSTEM_ONLINE', 'AWAITING_OPERATOR_INPUT']);

  const addLog = useCallback((msg: string) => { setLogs(prev => [`${new Date().toLocaleTimeString()} \u2014 ${msg}`, ...prev].slice(0, 50)); }, []);

  useEffect(() => {
    if (isSessionValid()) {
      setAuth(true);
      // Check for sync status
      fetch('/api/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getCache' })
      })
      .then(res => res.json())
      .then(data => {
        const serverCache = data.data || {};
        const local = localStorage.getItem('portfolioProjects');
        if (local) {
          const projects = JSON.parse(local) as Project[];
          const cachedSlugs = Object.keys(serverCache);
          const localSlugs = projects.map(p => p.specs?.repoSlug).filter(Boolean) as string[];
          
          const pending = localSlugs.filter(s => !cachedSlugs.includes(s));
          if (pending.length > 0) {
            addLog(`[WARN] LOCAL_BUFFER_OUT_OF_SYNC: ${pending.length} pending projects.`);
          } else {
            addLog('UPLINK_STATUS: SYNCHRONIZED');
          }
        }
      })
      .catch(() => addLog('WARN: SYNC_ENGINE_OFFLINE'));
    }
    setReady(true);
  }, [addLog]);
  
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); addLog('MANUAL_SYNC_TRIGGERED'); } };
    window.addEventListener('keydown', handleKeys); return () => window.removeEventListener('keydown', handleKeys);
  }, [addLog]);

  if (!ready) return null;
  if (!auth) return <PasswordGate onAuth={() => setAuth(true)} />;

  return (
    <div className="h-screen bg-[#0f1117] flex overflow-hidden font-mono text-white select-none">
      <aside className="w-80 border-r border-white/5 flex flex-col shrink-0 bg-[#0a0c12]">
        <div className="p-12 border-b border-white/5 flex flex-col gap-2">
          <p className="text-[15px] text-white tracking-[0.4em] font-bold uppercase leading-none">Core_OS</p>
          <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-cobalt animate-pulse rounded-full" /><p className="text-[9px] text-cobalt tracking-widest uppercase font-bold">Admin_Active</p></div>
        </div>
        <nav className="flex-1 p-6 flex flex-col gap-2">
          {[
            { id: 'projects', label: 'PROJECT_MODULES', icon: '◈' },
            { id: 'tech', label: 'TECH_REGISTRY', icon: '◰' },
            { id: 'ambitions', label: 'ROADMAP_MAPPER', icon: '▲' },
            { id: 'settings', label: 'SYSTEM_CONFIG', icon: '⚙' },
            { id: 'publish', label: 'PUBLISH_BRIDGE', icon: '↑' },
          ].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); addLog(`NAV_TO: ${t.id.toUpperCase()}`); }} className={`text-left px-8 py-5 text-[11px] tracking-[0.3em] uppercase transition-all duration-200 border-l-2 ${tab === t.id ? 'bg-cobalt/5 text-cobalt border-l-cobalt' : 'border-l-transparent text-text-faint hover:text-white hover:bg-white/2'}`}>
              <span className="mr-6 opacity-30">{t.icon}</span> {t.label}
            </button>
          ))}
        </nav>
        <div className="p-12 border-t border-white/5"><button onClick={() => { sessionStorage.removeItem(SESSION_KEY); window.location.reload(); }} className="text-[10px] text-err/40 hover:text-err tracking-widest uppercase transition-all">✕ TERMINATE_SESSION</button></div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-[#0f1117] shadow-[inset_0_0_150px_rgba(0,0,0,0.4)]">
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

      <aside className="w-80 border-l border-white/5 bg-[#0a0c12] flex flex-col shrink-0">
        <div className="p-10 border-b border-white/5 bg-[#0f1117]"><p className="text-[10px] text-text-faint tracking-widest font-bold uppercase leading-none">// SESSION_HISTORY</p></div>
        <div className="flex-1 p-8 flex flex-col gap-1 overflow-y-auto text-[10px] opacity-40 hover:opacity-100 transition-opacity">
          {logs.map((l, i) => <p key={i} className={`py-1 border-b border-white/2 ${i === 0 ? 'text-cobalt font-bold' : 'text-text-faint'}`}> {'>'} {l}</p>)}
        </div>
        <div className="p-10 bg-[#0f1117] border-t border-white/5 flex flex-col gap-6">
          <div className="flex flex-col gap-1"><span className="text-[9px] text-text-faint uppercase tracking-widest font-bold opacity-30 italic">operator:</span><p className="text-[11px] text-white tracking-widest font-bold uppercase">admin@gest_core</p></div>
          <div className="flex flex-col gap-1"><span className="text-[9px] text-text-faint uppercase tracking-widest font-bold opacity-30 italic">status:</span><p className="text-[11px] text-green-500/80 tracking-widest font-bold uppercase">ENCRYPTED_SESSION</p></div>
        </div>
      </aside>
    </div>
  );
}
