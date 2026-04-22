// ADMIN_PANEL_V5_ULTRA_LIGHT_SAAS_FINAL_RESPONSIVE
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Project, TechTool, Ambition, Experience, SiteSettings, BuildEntry } from '../../types';
import { logActivity } from '../../lib/activityLog';
import { deriveFromProjects } from '../techstack/TechMatrix';

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
  stackWithUsage: { name: string; usageLevel: number }[];
  architecture: string;
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

/* ─── UI COMPONENTS ─── */

const inputClass = "bg-white border border-slate-200 px-4 py-2.5 text-[14px] text-slate-900 w-full focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 placeholder:text-slate-300 rounded-lg shadow-sm";

function SectionHeader({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 mb-8">
      <div className="flex justify-between items-center gap-4">
        <div className="flex flex-col">
          <h2 className="text-[18px] text-slate-900 font-bold tracking-tight">{title}</h2>
          {hint && <p className="text-[12px] text-slate-500 font-medium">{hint}</p>}
        </div>
        {action}
      </div>
      <div className="h-px bg-slate-100 w-full mt-2" />
    </div>
  );
}

function Field({ label, required, children, className = "" }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-[11px] text-slate-500 font-bold tracking-tight px-1 uppercase">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function CheckField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none group py-2.5 px-4 bg-slate-50 border border-slate-100 rounded-lg hover:bg-white hover:border-blue-200 transition-all">
      <div className={`w-5 h-5 rounded-md border-2 ${value ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-200' : 'bg-white border-slate-200 group-hover:border-blue-300'} transition-all flex items-center justify-center`}>
        {value && <span className="text-white text-[12px] font-bold">✓</span>}
      </div>
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} className="hidden" />
      <span className={`text-[13px] font-bold transition-colors ${value ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}>{label}</span>
    </label>
  );
}

/* ─── Password Gate ─── */

function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function startOAuth() {
    setLoading(true); setErr(''); window.location.href = '/api/github-auth';
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) { setLoading(true); handleCallback(code); setTimeout(() => { window.history.replaceState({}, '', '/admin'); }, 1000); }
  }, []);

  async function handleCallback(code: string) {
    try {
      const res = await fetch('/api/github-auth', { method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
      if (res.ok) { sessionStorage.setItem(SESSION_KEY, 'true'); sessionStorage.setItem(SESSION_TS, String(Date.now())); onAuth(); } 
      else { setErr('OAUTH_FAILED'); }
    } catch (e) { setErr('CONNECTION_FAILURE'); } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans select-none overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-blue-600" />
      <div className="relative flex flex-col gap-10 w-full max-w-md bg-white border border-slate-200 p-8 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-2xl">
        <div className="flex flex-col gap-2">
          <h1 className="text-[24px] text-slate-900 font-bold tracking-tight">Core OS Admin</h1>
          <p className="text-[14px] text-slate-500">Authenticate via GitHub to continue.</p>
        </div>
        <div className="flex flex-col gap-6">
          <div className="min-h-[20px]">
            {err ? <p className="text-[13px] text-red-600 font-bold">⚠️ {err}</p> : <p className="text-[13px] text-slate-500">Redirection to GitHub required.</p>}
          </div>
          <button onClick={startOAuth} disabled={loading} className="w-full text-[14px] font-bold py-4 bg-slate-900 text-white rounded-xl active:scale-[0.98] disabled:opacity-50 transition-all">{loading ? 'Redirecting...' : 'Sign in with GitHub →'}</button>
        </div>
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
    setScanLoading(true); onLog(`SCANNING: ${repoSlug}`);
    try {
      const res = await fetch('/api/github', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'getRepoDetails', repoSlug }) });
      if (!res.ok) throw new Error(`GH_${res.status}`);
      const r = await res.json() as GitHubDetails;
      setForm(f => ({ ...f, id: f.id || r.id, name: r.name, photo: f.photo || r.photo, specsDescription: r.specsDescription, specsLanguage: r.specsLanguage, specsStars: r.specsStars, specsRepo: r.specsRepo, specsRepoSlug: r.specsRepoSlug, specsStatus: r.specsStatus, pushedAt: r.pushedAt, stack: r.stack, architecture: r.architecture || f.architecture }));
      onLog(`SYNC_SUCCESS: ${repoSlug}`);
    } catch (e: any) { onLog(`SYNC_FAILED: ${e.message}`); } finally { setScanLoading(false); }
  }

  function save() {
    if (!form.name.trim()) { onLog('ERROR: NAME_REQUIRED'); return; }
    const specs: any = { status: form.specsStatus, stars: form.specsStars, language: form.specsLanguage, license: form.specsLicense, description: form.specsDescription, repo: form.specsRepo, repoSlug: form.specsRepoSlug, demo: form.specsDemo, tags: form.specsTags.split(',').filter(Boolean), video: form.video };
    const p: Project = { id: form.id || String(Date.now()), name: form.name.toUpperCase(), photo: form.photo, stack: form.stack.split(',').map(s => s.trim().toUpperCase()).filter(Boolean), architecture: form.architecture, initSequence: form.initSequence, description: form.description, businessImpact: form.businessImpact, specs, isHighlighted: form.isHighlighted, isFavorite: form.isFavorite, isPrivate: form.isPrivate, pushedAt: form.pushedAt || undefined, order: Number(form.order) || 0 };
    const next = editing ? projects.map(x => x.id === editing ? p : x) : [...projects, p];
    localStorage.setItem('portfolioProjects', JSON.stringify(next));
    setProjects(next); onLog(`SAVED: ${p.name}`); setEditing(p.id);
  }

  function select(p: Project) {
    setEditing(p.id); onLog(`SELECT: ${p.name}`);
    setForm({ ...emptyProject, id: p.id, name: p.name, photo: p.photo, video: (p.specs?.video as string) || '', stack: p.stack.join(', '), architecture: p.architecture, initSequence: p.initSequence, description: p.description ?? '', businessImpact: p.businessImpact ?? '', specsStatus: (p.specs?.status as string) || '', specsStars: (p.specs?.stars as string) || '', specsLanguage: (p.specs?.language as string) || '', specsLicense: (p.specs?.license as string) || '', specsDescription: (p.specs?.description as string) || '', specsRepo: (p.specs?.repo as string) || '', specsRepoSlug: (p.specs?.repoSlug as string) || '', specsDemo: (p.specs?.demo as string) || '', specsTags: Array.isArray(p.specs?.tags) ? p.specs.tags.join(', ') : '', isHighlighted: !!p.isHighlighted, isFavorite: !!p.isFavorite, isPrivate: !!p.isPrivate, pushedAt: p.pushedAt || '', order: p.order || 0 });
  }

  return (
    <div className="flex flex-col gap-10">
      <section className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
        <SectionHeader title="Project Modules" action={<button onClick={() => { setEditing(null); setForm(emptyProject); }} className="text-[12px] font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">New Module</button>} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {projects.map(p => (
            <div key={p.id} onClick={() => select(p)} className={`p-5 rounded-xl border-2 transition-all cursor-pointer ${editing === p.id ? 'border-blue-500 bg-blue-50' : 'border-slate-50 bg-slate-50 hover:border-slate-200'}`}>
              <p className="text-[13px] font-bold text-slate-900 truncate uppercase">{p.name}</p>
              <p className="text-[10px] text-slate-400 font-mono mt-1">{p.id}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Field label="ID" required><input value={form.id} onChange={e => setForm(f => ({ ...f, id: e.target.value }))} className={inputClass} /></Field>
          <Field label="Name" required><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} /></Field>
          <div className="col-span-full flex gap-4">
             <Field label="GitHub URL" className="flex-1"><input value={form.gitUrl} onChange={e => setForm(f => ({ ...f, gitUrl: e.target.value }))} className={inputClass} /></Field>
             <button onClick={fetchGitHub} disabled={scanLoading} className="self-end px-6 py-2.5 bg-slate-900 text-white text-[12px] font-bold rounded-lg disabled:opacity-50">{scanLoading ? '...' : 'Sync GitHub'}</button>
          </div>
          <div className="col-span-full grid grid-cols-3 gap-4"><CheckField label="Highlight" value={form.isHighlighted} onChange={v => setForm(f => ({ ...f, isHighlighted: v }))} /><CheckField label="Favorite" value={form.isFavorite} onChange={v => setForm(f => ({ ...f, isFavorite: v }))} /><CheckField label="Private" value={form.isPrivate} onChange={v => setForm(f => ({ ...f, isPrivate: v }))} /></div>
          <Field label="Stack"><input value={form.stack} onChange={e => setForm(f => ({ ...f, stack: e.target.value }))} className={inputClass} /></Field>
          <Field label="Status"><select value={form.specsStatus} onChange={e => setForm(f => ({ ...f, specsStatus: e.target.value }))} className={inputClass}><option value="">-</option><option value="COMPLETED">COMPLETED</option><option value="IN_PROGRESS">IN_PROGRESS</option></select></Field>
        </div>
        <button onClick={save} className="mt-10 w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-100">Commit Module Changes</button>
      </section>
    </div>
  );
}

/* ─── Identity Tab ─── */

function IdentityTab({ onLog }: { onLog: (msg: string) => void }) {
  const [data, setData] = useState({ name: '', handle: '', bio: '', githubUrl: '', linkedinUrl: '', email: '', photo: '' });
  useEffect(() => { const s = localStorage.getItem('portfolioIdentity'); if (s) setData(JSON.parse(s)); }, []);
  function update(partial: Partial<typeof data>) { const next = { ...data, ...partial }; setData(next); localStorage.setItem('portfolioIdentity', JSON.stringify(next)); onLog(`IDENTITY: ${Object.keys(partial)[0].toUpperCase()}`); }
  return (
    <section className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm space-y-8">
      <SectionHeader title="Core Identity" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Field label="Name"><input value={data.name} onChange={e => update({ name: e.target.value })} className={inputClass} /></Field>
        <Field label="Handle"><input value={data.handle} onChange={e => update({ handle: e.target.value })} className={inputClass} /></Field>
        <div className="col-span-full"><Field label="Bio"><textarea value={data.bio} onChange={e => update({ bio: e.target.value })} className={`${inputClass} h-24 resize-none`} /></Field></div>
        <Field label="Email"><input value={data.email} onChange={e => update({ email: e.target.value })} className={inputClass} /></Field>
        <Field label="Photo URL"><input value={data.photo} onChange={e => update({ photo: e.target.value })} className={inputClass} /></Field>
      </div>
    </section>
  );
}

/* ─── Tech Tab ─── */

function TechTab({ onLog }: { onLog: (msg: string) => void }) {
  const [tools, setTools] = useState<TechTool[]>([]);
  const load = useCallback(() => { const s = localStorage.getItem('portfolioTechstack'); if (s) setTools(JSON.parse(s)); }, []);
  useEffect(() => { load(); }, [load]);
  async function scan() {
    const s = localStorage.getItem('portfolioProjects'); if (!s) return;
    const projects = JSON.parse(s) as Project[];
    const derived = deriveFromProjects(projects);
    setTools(derived); localStorage.setItem('portfolioTechstack', JSON.stringify(derived));
    onLog('TECH_MATRIX_RECALCULATED');
  }
  return (
    <section className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm space-y-8">
      <SectionHeader title="Tech Registry" action={<button onClick={scan} className="text-[12px] font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">Scan Projects</button>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tools.map(t => (
          <div key={t.name} className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <p className="text-[12px] font-bold text-slate-900">{t.name}</p>
            <p className="text-[10px] text-blue-600 font-bold">{t.usageLevel}%</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Settings Tab ─── */

function SettingsTab({ onLog }: { onLog: (msg: string) => void }) {
  const [s, setS] = useState<SiteSettings>({ availabilityValue: 99, status: 'ONLINE', dustThresholdDays: 60, starsForGold: 5, logLimit: 10 });
  useEffect(() => { const stored = localStorage.getItem('portfolioSettings'); if (stored) setS(JSON.parse(stored)); }, []);
  function update(p: Partial<SiteSettings>) { const next = { ...s, ...p }; setS(next); localStorage.setItem('portfolioSettings', JSON.stringify(next)); onLog(`SETTING: ${Object.keys(p)[0].toUpperCase()}`); }
  return (
    <section className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm space-y-8">
      <SectionHeader title="System Engine" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Field label={`Availability: ${s.availabilityValue}%`}><input type="range" min="0" max="100" value={s.availabilityValue} onChange={e => update({ availabilityValue: Number(e.target.value) })} className="w-full h-2 bg-slate-100 rounded-full appearance-none accent-blue-600" /></Field>
        <Field label="System Status"><select value={s.status} onChange={e => update({ status: e.target.value as any })} className={inputClass}><option value="ONLINE">ONLINE</option><option value="BUSY">BUSY</option><option value="OFFLINE">OFFLINE</option></select></Field>
      </div>
    </section>
  );
}

/* ─── Publish Tab ─── */

function PublishTab({ onLog }: { onLog: (msg: string) => void }) {
  const [loading, setLoading] = useState(false);
  async function publish() {
    setLoading(true); onLog('INIT_GLOBAL_SYNC...');
    try {
      const keys = ['portfolioProjects', 'portfolioSettings', 'portfolioIdentity', 'portfolioTechstack'];
      const files = keys.filter(k => !!localStorage.getItem(k)).map(k => ({ path: `public/data/${k.replace('portfolio', '').toLowerCase()}.json`, content: localStorage.getItem(k)! }));
      const res = await fetch('/api/github', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'publish', branch: 'main', files }) });
      if (res.ok) onLog('PUBLISH_SUCCESS'); else throw new Error('SYNC_FAILED');
    } catch (e: any) { onLog(`ERROR: ${e.message}`); } finally { setLoading(false); }
  }
  return (
    <section className="bg-slate-900 p-12 rounded-3xl text-white space-y-6 shadow-2xl shadow-blue-900/20 relative overflow-hidden">
      <div className="relative z-10 space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Production Uplink</h2>
        <p className="text-slate-400 text-sm">Sync local changes with the live production site.</p>
      </div>
      <button onClick={publish} disabled={loading} className="relative z-10 w-full py-6 bg-blue-600 hover:bg-blue-500 font-bold rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50">{loading ? 'Synchronizing Buffers...' : 'Execute Publish Sequence ↑'}</button>
    </section>
  );
}

/* ─── MAIN CONSOLE ─── */

export default function AdminPanel() {
  const [auth, setAuth] = useState(false);
  const [tab, setTab] = useState<string>('projects');
  const [ready, setReady] = useState(false);
  const [logs, setLogs] = useState<string[]>(['SYSTEM READY', 'AWAITING OPERATOR INPUT']);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const addLog = useCallback((msg: string) => { setLogs(prev => [`${new Date().toLocaleTimeString()} — ${msg}`, ...prev].slice(0, 50)); }, []);

  useEffect(() => { if (isSessionValid()) { setAuth(true); addLog('SESSION RECOVERED'); } setReady(true); }, [addLog]);
  
  if (!ready) return null;
  if (!auth) return <PasswordGate onAuth={() => setAuth(true)} />;

  const menuItems = [
    { id: 'projects', label: 'Modules', icon: '◈' },
    { id: 'identity', label: 'Identity', icon: '👤' },
    { id: 'tech', label: 'Registry', icon: '◰' },
    { id: 'system', label: 'System', icon: '◉' },
    { id: 'publish', label: 'Publish', icon: '↑' },
  ];

  return (
    <div className="h-screen bg-[#f8fafc] flex flex-col lg:flex-row overflow-hidden font-sans text-slate-900 select-none relative">
      
      {/* MOBILE HEADER */}
      <header className="lg:hidden h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-30">
        <p className="text-[18px] font-black tracking-tighter">Core OS <span className="text-blue-600">Admin</span></p>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-100">
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* SIDEBAR NAVIGATION (DRAWER ON MOBILE) */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 w-72 border-r border-slate-200 flex flex-col shrink-0 bg-white z-40 transition-transform duration-300
        ${mobileMenuOpen ? 'translate-x-0 shadow-2xl shadow-blue-900/10' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="hidden lg:flex p-10 border-b border-slate-50 flex-col gap-1">
          <p className="text-[20px] text-slate-900 font-black tracking-tighter">Core OS</p>
          <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Operator Active</p></div>
        </div>
        <nav className="flex-1 p-6 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
          {menuItems.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); addLog(`NAV: ${t.label}`); setMobileMenuOpen(false); }} className={`text-left px-6 py-4 text-[14px] font-bold transition-all duration-200 rounded-xl flex items-center gap-4 ${tab === t.id ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
              <span className={`text-[18px] ${tab === t.id ? 'opacity-100' : 'opacity-40'}`}>{t.icon}</span> {t.label}
            </button>
          ))}
        </nav>
        <div className="p-8 border-t border-slate-50 flex flex-col gap-3">
          <a href="/" className="text-center py-3 text-[12px] text-slate-600 font-bold bg-slate-100 rounded-lg hover:bg-slate-200 transition-all uppercase tracking-widest">View Portfolio</a>
          <button onClick={() => { sessionStorage.removeItem(SESSION_KEY); window.location.reload(); }} className="text-[10px] text-red-500 font-bold hover:underline tracking-widest uppercase transition-all">✕ TERMINATE_SESSION</button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] relative">
        <div className="flex-1 overflow-y-auto px-6 sm:px-16 py-10 sm:py-16 custom-scrollbar island-load relative z-10">
          <div className="max-w-5xl mx-auto">
            {tab === 'projects' && <ProjectsTab onLog={addLog} />}
            {tab === 'identity' && <IdentityTab onLog={addLog} />}
            {tab === 'tech'     && <TechTab onLog={addLog} />}
            {tab === 'system'   && <SettingsTab onLog={addLog} />}
            {tab === 'publish'  && <PublishTab onLog={addLog} />}
          </div>
        </div>
      </main>

      {/* SESSION HISTORY (DESKTOP ONLY) */}
      <aside className="hidden xl:flex w-72 border-l border-slate-200 bg-white flex flex-col shrink-0 z-20">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Terminal Logs</p>
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
        </div>
        <div className="flex-1 p-6 flex flex-col gap-3 overflow-y-auto text-[11px] font-medium opacity-60">
          {logs.map((l, i) => <div key={i} className={`flex gap-3 leading-relaxed border-b border-slate-50 pb-2 ${i === 0 ? 'text-blue-600' : 'text-slate-500'}`}><span className="font-bold opacity-30">{logs.length - i}</span><span>{l}</span></div>)}
        </div>
      </aside>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 10px; }
        .island-load { animation: island-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes island-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}
