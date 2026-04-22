// ADMIN_PANEL_V5_ULTRA_LIGHT_SAAS
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

/* ─── UI COMPONENTS (LIGHT THEME) ─── */

const inputClass = "bg-white border border-slate-200 px-4 py-2.5 text-[14px] text-slate-900 w-full focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 placeholder:text-slate-300 rounded-lg shadow-sm";

function SectionHeader({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 mb-8">
      <div className="flex justify-between items-center">
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
      <label className="text-[12px] text-slate-600 font-bold tracking-tight px-1 uppercase">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function CheckField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none group py-2 px-4 bg-slate-50 border border-slate-100 rounded-lg hover:bg-white hover:border-blue-200 transition-all">
      <div className={`w-5 h-5 rounded-md border-2 ${value ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-200' : 'bg-white border-slate-200 group-hover:border-blue-300'} transition-all flex items-center justify-center`}>
        {value && <span className="text-white text-[12px] font-bold">✓</span>}
      </div>
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} className="hidden" />
      <span className={`text-[13px] font-semibold transition-colors ${value ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`}>{label}</span>
    </label>
  );
}

/* ─── Password Gate ─── */

function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    localStorage.removeItem(LOCKOUT_KEY);
    localStorage.removeItem(ATTEMPTS_KEY);
    setCountdown(0);
  }, []);

  async function startOAuth() {
    setLoading(true);
    setErr('');
    // Direct redirect to GitHub OAuth - no fetch needed
    window.location.href = '/api/github-auth';
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      setLoading(true);
      handleCallback(code);
      setTimeout(() => {
        window.history.replaceState({}, '', '/admin');
      }, 1000);
    }
  }, []);

  async function handleCallback(code: string) {
    try {
      const res = await fetch('/api/github-auth', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      if (res.ok) {
        localStorage.removeItem(ATTEMPTS_KEY);
        localStorage.removeItem(LOCKOUT_KEY);
        sessionStorage.setItem(SESSION_KEY, 'true');
        sessionStorage.setItem(SESSION_TS, String(Date.now()));
        onAuth();
      } else {
        setErr('OAUTH_FAILED');
      }
    } catch (e) {
      setErr('CONNECTION_FAILURE');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const mins = Math.floor(countdown / 60);
  const secs = String(countdown % 60).padStart(2, '0');

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans select-none overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-blue-600" />
      
      <div className="relative flex flex-col gap-10 w-full max-w-md bg-white border border-slate-200 p-12 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-2xl">
        <div className="flex flex-col gap-2">
          <h1 className="text-[24px] text-slate-900 font-bold tracking-tight">Core OS Admin</h1>
          <p className="text-[14px] text-slate-500">Authenticate via GitHub to continue.</p>
        </div>
        
        <div className="flex flex-col gap-6">
          <div className="min-h-[20px]">
            {err ? (
              <p className="text-[13px] text-red-600 font-bold">⚠️ {err}</p>
            ) : (
              <p className="text-[13px] text-slate-500">You'll be redirected to GitHub for authentication.</p>
            )}
          </div>

          <button 
            onClick={startOAuth}
            disabled={loading}
            className="w-full text-[14px] font-bold py-4 bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 rounded-xl active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Redirecting...' : 'Sign in with GitHub →'}
          </button>
        </div>

        <div className="flex justify-center items-center opacity-40 pt-4 border-t border-slate-100">
          <span className="text-[11px] text-slate-500 font-medium">OAuth V2 Protected</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Projects Tab ─── */

const emptyProject = {
  id: '', name: '', gitUrl: '', photo: '', video: '', stack: '', architecture: '', initSequence: '', description: '', businessImpact: '',
  specsStatus: '', specsStars: '', specsLanguage: '', specsLicense: '', specsDescription: '', specsRepo: '', specsRepoSlug: '', specsDemo: '', specsTags: '',
  isHighlighted: false, isPrivate: false, isFavorite: false, pushedAt: '', order: 0, _stackWithUsage: [] as { name: string; usageLevel: number }[]
};

function ProjectsTab({ onLog }: { onLog: (msg: string) => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState(emptyProject);
  const [editing, setEditing] = useState<string | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [allRepos, setAllRepos] = useState<{ name: string; fullName: string; description: string; language: string; private: boolean; pushedAt: string; stars: number; url: string; _details: any }[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<{ name: string; fullName: string; description: string; language: string; private: boolean; pushedAt: string; stars: number; url: string; _details: any }[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    const stored = localStorage.getItem('portfolioProjects');
    if (stored) setProjects(JSON.parse(stored));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const cached = localStorage.getItem('portfolioCachedRepos');
    if (cached) {
      try { setAllRepos(JSON.parse(cached)); } catch {}
    }
  }, []);

  async function loadAllRepos() {
    setLoadingRepos(true); onLog('FETCHING ALL REPOS...');
    try {
      const res = await fetch('/api/github', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'getUserRepos' }) });
      if (!res.ok) throw new Error(`GH_${res.status}`);
      const repos = await res.json();
      onLog(`FETCHING DETAILS FOR ${repos.length} REPOS...`);
      const detailedRepos = await Promise.all(repos.map(async (repo: any) => {
        try {
          const detailRes = await fetch('/api/github', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'getRepoDetails', repoSlug: repo.fullName }) });
          if (!detailRes.ok) return { ...repo, _details: null };
          const details = await detailRes.json();
          return { ...repo, _details: details };
        } catch { return { ...repo, _details: null }; }
      }));
      localStorage.setItem('portfolioCachedRepos', JSON.stringify(detailedRepos));
      setAllRepos(detailedRepos); setSelectedRepos([]);
      onLog(`CACHED ${detailedRepos.length} REPOS WITH DETAILS`);
    } catch (e: any) { onLog(`ERROR: ${e.message}`); }
    finally { setLoadingRepos(false); }
  }

  async function importRepo(repo: { fullName: string; name: string; description: string; language: string; private: boolean; pushedAt: string; stars: number; url: string; _details: any }) {
    const existing = projects.find(p => p.specs?.repoSlug === repo.fullName);
    if (existing) { onLog('ALREADY IN PORTFOLIO'); return; }
    const pending = allRepos.filter(r => !projects.some(p => p.specs?.repoSlug === r.fullName));
    setAllRepos(pending); onLog(`SELECTED: ${repo.name} (${pending.length - 1} pending)`);
  }

  async function fetchSelectedRepos() {
    if (selectedRepos.length === 0) return;
    setScanLoading(true); onLog(`IMPORTING ${selectedRepos.length} REPOS...`);
    try {
      const newProjects: Project[] = [];
      for (const repo of selectedRepos) {
        const r = repo._details;
        if (!r) {
          const res = await fetch('/api/github', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'getRepoDetails', repoSlug: repo.fullName }) });
          if (!res.ok) continue;
          const r = await res.json() as GitHubDetails;
          const stackArr = Array.isArray(r.stack) ? r.stack : r.stack.split(',').map((s: string) => s.trim()).filter(Boolean);
          newProjects.push({ id: r.id || String(Date.now()), name: r.name, photo: r.photo, stack: stackArr, architecture: r.architecture || '', initSequence: '', description: r.specsDescription || repo.description || '', businessImpact: '', specs: { status: r.specsStatus, stars: String(repo.stars), language: r.specsLanguage, repo: repo.url, repoSlug: repo.fullName, description: r.specsDescription, tags: [], video: '', stackWithUsage: r.stackWithUsage }, isHighlighted: false, isFavorite: false, isPrivate: repo.private, pushedAt: repo.pushedAt, order: projects.length + newProjects.length });
        } else {
          const stackArr = Array.isArray(r.stack) ? r.stack : r.stack.split(',').map((s: string) => s.trim()).filter(Boolean);
          newProjects.push({ id: r.id || String(Date.now()), name: r.name, photo: r.photo, stack: stackArr, architecture: r.architecture || '', initSequence: '', description: r.specsDescription || repo.description || '', businessImpact: '', specs: { status: r.specsStatus, stars: String(repo.stars), language: r.specsLanguage, repo: repo.url, repoSlug: repo.fullName, description: r.specsDescription, tags: [], video: '', stackWithUsage: r.stackWithUsage }, isHighlighted: false, isFavorite: false, isPrivate: repo.private, pushedAt: repo.pushedAt, order: projects.length + newProjects.length });
        }
      }
      const next = [...projects, ...newProjects];
      localStorage.setItem('portfolioProjects', JSON.stringify(next));
      setProjects(next); setAllRepos([]); setSelectedRepos([]); onLog(`IMPORTED ${newProjects.length} REPOS`);
    } catch (e: any) { onLog(`ERROR: ${e.message}`); }
    finally { setScanLoading(false); }
  }

  async function fetchGitHub() {
    const urlMatch = form.gitUrl.trim().match(/github\.com\/([^/]+)\/([^/\s]+)/);
    if (!urlMatch) { onLog('ERROR: INVALID_URL'); return; }
    const repoSlug = `${urlMatch[1]}/${urlMatch[2].replace(/\.git$/, '')}`;
    setScanLoading(true); onLog(`SCANNING: ${repoSlug}`);
    try {
      const res = await fetch('/api/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getRepoDetails', repoSlug })
      });
      if (!res.ok) throw new Error(`GH_${res.status}`);
      const r = await res.json() as GitHubDetails;
      const stackArr = Array.isArray(r.stack) ? r.stack : r.stack.split(',').map((s: string) => s.trim()).filter(Boolean);
      setForm(f => ({
        ...f, id: f.id || r.id, name: r.name, photo: f.photo || r.photo,
        specsDescription: r.specsDescription, specsLanguage: r.specsLanguage, specsStars: r.specsStars,
        specsRepo: r.specsRepo, specsRepoSlug: r.specsRepoSlug, specsStatus: r.specsStatus,
        pushedAt: r.pushedAt, stack: stackArr.join(', '), architecture: r.architecture || f.architecture,
        _stackWithUsage: r.stackWithUsage
      }));
      onLog(`SYNC_SUCCESS: ${repoSlug}`);
    } catch (e: any) { onLog(`SYNC_FAILED: ${e.message}`); }
    finally { setScanLoading(false); }
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setForm(f => ({ ...f, photo: reader.result as string })); onLog(`IMG_READY: ${file.name}`); };
    reader.readAsDataURL(file);
  }

  function save() {
    if (!form.name.trim()) { onLog('ERROR: NAME_REQUIRED'); return; }
    const stackArr = form.stack.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    const specs: any = { 
      status: form.specsStatus, stars: form.specsStars, language: form.specsLanguage, 
      license: form.specsLicense, description: form.specsDescription, repo: form.specsRepo, 
      repoSlug: form.specsRepoSlug, demo: form.specsDemo, tags: form.specsTags.split(',').filter(Boolean).map(t => t.trim()), 
      video: form.video, 
      stackWithUsage: form._stackWithUsage || stackArr.map((name: string) => ({ name, usageLevel: 50 }))
    };
    const p: Project = { id: form.id || String(Date.now()), name: form.name.toUpperCase(), photo: form.photo, stack: stackArr, architecture: form.architecture, initSequence: form.initSequence, description: form.description, businessImpact: form.businessImpact, specs, isHighlighted: form.isHighlighted, isFavorite: form.isFavorite, isPrivate: form.isPrivate, pushedAt: form.pushedAt || undefined, order: Number(form.order) || 0 };
    const next = editing ? projects.map(x => x.id === editing ? p : x) : [...projects, p];
    localStorage.setItem('portfolioProjects', JSON.stringify(next));
    setProjects(next); onLog(`SAVED: ${p.name}`); setEditing(p.id);
  }

  function select(p: Project) {
    setEditing(p.id); onLog(`SELECTED: ${p.name}`);
    const stackWithUsage = p.specs?.stackWithUsage as { name: string; usageLevel: number }[] | undefined;
    setForm({ 
      ...emptyProject, id: p.id, name: p.name, photo: p.photo, video: (p.specs?.video as string) || '', 
      stack: p.stack.join(', '), architecture: p.architecture, initSequence: p.initSequence, 
      description: p.description ?? '', businessImpact: p.businessImpact ?? '', 
      specsStatus: (p.specs?.status as string) || '', specsStars: (p.specs?.stars as string) || '', 
      specsLanguage: (p.specs?.language as string) || '', specsLicense: (p.specs?.license as string) || '', 
      specsDescription: (p.specs?.description as string) || '', specsRepo: (p.specs?.repo as string) || '', 
      specsRepoSlug: (p.specs?.repoSlug as string) || '', specsDemo: (p.specs?.demo as string) || '', 
      specsTags: Array.isArray(p.specs?.tags) ? p.specs.tags.join(', ') : '', 
      isHighlighted: !!p.isHighlighted, isFavorite: !!p.isFavorite, isPrivate: !!p.isPrivate, 
      pushedAt: p.pushedAt || '', order: p.order || 0,
      _stackWithUsage: stackWithUsage || []
    });
  }

  return (
    <div className="flex flex-col gap-10">
      <section className="bg-white border border-slate-200 p-10 rounded-2xl shadow-sm">
        <SectionHeader 
          title="Module Library" 
          hint="All registered portfolio modules"
          action={<div className="flex gap-2">
            <button onClick={loadAllRepos} disabled={loadingRepos} className="text-[13px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-lg transition-colors">{loadingRepos ? 'Loading...' : 'Load All Repos'}</button>
            <button onClick={() => { setEditing(null); setForm(emptyProject); onLog('INIT: NEW_MODULE'); }} className="text-[13px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-lg transition-colors">Create New</button>
          </div>}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {projects.map(p => (
            <div key={p.id} onClick={() => select(p)} className={`group p-6 rounded-xl border-2 transition-all cursor-pointer ${editing === p.id ? 'border-blue-500 bg-blue-50' : 'border-slate-50 bg-slate-50 hover:border-slate-200 hover:bg-white'}`}>
              <div className="flex justify-between items-start mb-2">
                <p className={`text-[13px] font-bold uppercase truncate ${editing === p.id ? 'text-blue-700' : 'text-slate-900'}`}>{p.name}</p>
                {p.isFavorite && <span className="text-amber-500 text-[14px]">★</span>}
              </div>
              <p className="text-[11px] text-slate-500 font-mono font-bold tracking-tight">{p.specs?.repoSlug || '-'}</p>
            </div>
          ))}
        </div>
      </section>

      {allRepos.length > 0 && (
        <section className="bg-white border border-slate-200 p-10 rounded-2xl shadow-sm">
          <SectionHeader 
            title="Import from GitHub" 
            hint={`${allRepos.length} repos found · ${selectedRepos.length} selected`}
            action={selectedRepos.length > 0 && (
              <button onClick={fetchSelectedRepos} disabled={scanLoading} className="text-[13px] font-bold text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors">
                {scanLoading ? 'Importing...' : `Import ${selectedRepos.length} Selected`}
              </button>
            )}
          />
          <div className="max-h-80 overflow-y-auto space-y-2">
            {allRepos.map(repo => {
              const already = projects.some(p => p.specs?.repoSlug === repo.fullName);
              const isSelected = selectedRepos.some(r => r.fullName === repo.fullName);
              return (
                <div key={repo.fullName} onClick={() => { if (already) return; setSelectedRepos(isSelected ? selectedRepos.filter(r => r.fullName !== repo.fullName) : [...selectedRepos, repo]); }} className={`flex items-center gap-4 p-4 rounded-lg border transition-all cursor-pointer ${already ? 'bg-slate-50 border-slate-100 opacity-50' : isSelected ? 'bg-green-50 border-green-300' : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${already ? 'bg-slate-200 border-slate-300' : isSelected ? 'bg-green-600 border-green-600' : 'border-slate-300'}`}>
                    {isSelected && <span className="text-white text-[12px] font-bold">✓</span>}
                  </div>
                  {repo._details?.photo && <img src={repo._details.photo} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-200" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-bold text-slate-900 truncate">{repo.name}</p>
                      {repo.private && <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded">PRIVATE</span>}
                    </div>
                    <p className="text-[12px] text-slate-500 truncate">{repo.description || repo._details?.specsDescription || 'No description'}</p>
                    <p className="text-[10px] text-cobalt mt-1">{repo._details?.stack?.join(', ') || repo.language || '-'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="bg-white border border-slate-200 p-10 rounded-2xl shadow-sm">
        <SectionHeader title={editing ? `Editing: ${projects.find(p => p.id === editing)?.name || editing}` : 'Create New Module'} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          <Field label="Module Name" required><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} placeholder="e.g., SYSTEM_X" /></Field>
          
          <div className="col-span-2 flex gap-4">
            <Field label="GitHub URL" className="flex-1"><input value={form.gitUrl} onChange={e => setForm(f => ({ ...f, gitUrl: e.target.value }))} className={inputClass} placeholder="https://github.com/..." /></Field>
            <button onClick={fetchGitHub} disabled={scanLoading} className="self-end h-[46px] px-8 bg-blue-600 text-white text-[13px] font-bold rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-100 disabled:opacity-50">
              {scanLoading ? 'Syncing...' : 'Fetch Info'}
            </button>
          </div>

          <div className="col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-100">
            <CheckField label="High Value" value={form.isHighlighted} onChange={v => setForm(f => ({ ...f, isHighlighted: v }))} />
            <CheckField label="Favorite" value={form.isFavorite} onChange={v => setForm(f => ({ ...f, isFavorite: v }))} />
            <CheckField label="Private" value={form.isPrivate} onChange={v => setForm(f => ({ ...f, isPrivate: v }))} />
          </div>

          <Field label="Short Overview"><input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputClass} /></Field>
          <Field label="Business Impact"><input value={form.businessImpact} onChange={e => setForm(f => ({ ...f, businessImpact: e.target.value }))} className={inputClass} /></Field>
          
          <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-slate-100 pt-8 mt-4">
            <Field label="Image Asset">
              <div className="flex gap-2 mb-3">
                <input value={form.photo} onChange={e => setForm(f => ({ ...f, photo: e.target.value }))} className={`${inputClass} flex-1`} />
                <button onClick={() => photoInputRef.current?.click()} className="px-4 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all font-bold">↑</button>
                <input ref={photoInputRef} type="file" className="hidden" onChange={handlePhotoUpload} />
              </div>
              {form.photo && <img src={form.photo} className="aspect-video w-full object-cover rounded-xl border border-slate-200 shadow-sm" />}
            </Field>
            <Field label="Video Link">
              <input value={form.video} onChange={e => setForm(f => ({ ...f, video: e.target.value }))} className={`${inputClass} mb-3`} />
              {form.video ? (
                <div className="aspect-video bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-[13px] animate-pulse">✓ Signal Active</span>
                </div>
              ) : <div className="aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl" />}
            </Field>
          </div>

          <div className="col-span-2"><Field label="Architecture Logic"><textarea value={form.architecture} onChange={e => setForm(f => ({ ...f, architecture: e.target.value }))} className={`${inputClass} h-32 resize-none leading-relaxed py-4`} /></Field></div>
          <div className="col-span-2"><Field label="Init Sequence"><textarea value={form.initSequence} onChange={e => setForm(f => ({ ...f, initSequence: e.target.value }))} className={`${inputClass} h-20 resize-none leading-relaxed py-4`} /></Field></div>

          <Field label="Stack (Comma separated)"><input value={form.stack} onChange={e => setForm(f => ({ ...f, stack: e.target.value }))} className={inputClass} placeholder="REACT, GO, etc." /></Field>
          <Field label="Status">
            <select value={form.specsStatus} onChange={e => setForm(f => ({ ...f, specsStatus: e.target.value }))} className={inputClass}>
              <option value="">Select Status</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="PAUSED">Paused</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </Field>
        </div>

        <div className="mt-12 flex items-center gap-6">
          <button onClick={save} className="bg-blue-600 text-white text-[14px] font-bold px-12 py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95">Save Module</button>
          {editing && <button onClick={() => { if(confirm('Delete module?')) { const n = projects.filter(x => x.id !== editing); localStorage.setItem('portfolioProjects', JSON.stringify(n)); load(); setEditing(null); onLog(`REMOVED: ${editing}`); } }} className="text-[13px] text-red-500 font-bold hover:underline">Delete Forever</button>}
        </div>
      </section>
    </div>
  );
}

/* ─── Identity Tab ─── */

function IdentityTab({ onLog }: { onLog: (msg: string) => void }) {
  const [data, setData] = useState({
    name: '', handle: '', bio: '', location: '', githubUrl: '', linkedinUrl: '', twitterUrl: '', email: '', status: 'ONLINE', availabilityValue: 99.9, photo: ''
  });
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const s = localStorage.getItem('portfolioIdentity');
    if (s) setData(JSON.parse(s));
  }, []);

  function update(partial: Partial<typeof data>) {
    const next = { ...data, ...partial }; setData(next);
    localStorage.setItem('portfolioIdentity', JSON.stringify(next));
    onLog(`IDENTITY_PARAM: ${Object.keys(partial)[0].toUpperCase()}`);
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { update({ photo: reader.result as string }); onLog(`PHOTO_BUFFERED: ${file.name}`); };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col gap-10">
      <section className="bg-white border border-slate-200 p-10 rounded-2xl shadow-sm">
        <SectionHeader title="Core Identity" hint="Personal branding and global identifiers" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          <Field label="Full Name"><input value={data.name} onChange={e => update({ name: e.target.value })} className={inputClass} /></Field>
          <Field label="Handle / ID"><input value={data.handle} onChange={e => update({ handle: e.target.value })} className={inputClass} /></Field>
          <div className="col-span-2"><Field label="Professional Bio"><textarea value={data.bio} onChange={e => update({ bio: e.target.value })} className={`${inputClass} h-24 resize-none leading-relaxed py-4`} /></Field></div>
          
          <div className="col-span-2 grid grid-cols-2 gap-10">
            <Field label="Profile Photo">
              <div className="flex gap-2 mb-3">
                <input value={data.photo} onChange={e => update({ photo: e.target.value })} className={`${inputClass} flex-1`} />
                <button onClick={() => photoInputRef.current?.click()} className="px-4 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all font-bold">↑</button>
                <input ref={photoInputRef} type="file" className="hidden" onChange={handlePhotoUpload} />
              </div>
              {data.photo && <img src={data.photo} className="w-32 h-32 rounded-full object-cover border-4 border-slate-50 shadow-md" />}
            </Field>
            <div className="space-y-6">
              <Field label="Location"><input value={data.location} onChange={e => update({ location: e.target.value })} className={inputClass} /></Field>
              <Field label="Contact Email"><input value={data.email} onChange={e => update({ email: e.target.value })} className={inputClass} /></Field>
            </div>
          </div>

          <div className="col-span-2 border-t border-slate-100 pt-10 mt-4 grid grid-cols-1 md:grid-cols-3 gap-8">
            <Field label="GitHub URL"><input value={data.githubUrl} onChange={e => update({ githubUrl: e.target.value })} className={inputClass} /></Field>
            <Field label="LinkedIn URL"><input value={data.linkedinUrl} onChange={e => update({ linkedinUrl: e.target.value })} className={inputClass} /></Field>
            <Field label="Twitter URL"><input value={data.twitterUrl} onChange={e => update({ twitterUrl: e.target.value })} className={inputClass} /></Field>
          </div>
        </div>
      </section>
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
    const settingsS = localStorage.getItem('portfolioSettings');
    let versionMap: Record<string, string> = {};
    try { if (settingsS) { const settings = JSON.parse(settingsS); versionMap = settings.versionMap || {}; } } catch {}
    
    const projects = JSON.parse(s) as Project[];
    setLoading(true); onLog(`SCANNING FROM TOP 5...`);
    try {
      const derived = deriveFromProjects(projects, versionMap);
      setTools(derived); localStorage.setItem('portfolioTechstack', JSON.stringify(derived));
      onLog(`SCAN DONE: ${derived.length} TOOLS FOUND`);
    } catch (e: any) { onLog(`SCAN_ERROR: ${e.message}`); }
    finally { setLoading(false); }
  }

  function save() {
    if (!form.name) return;
    const tool = { ...form, name: form.name.toUpperCase() };
    const next = editing !== null ? tools.map((t, i) => i === editing ? tool : t) : [...tools, tool];
    setTools(next); localStorage.setItem('portfolioTechstack', JSON.stringify(next));
    setForm({ name: '', version: '', usageLevel: 80 }); setEditing(null); onLog(`TECH SAVED: ${tool.name}`);
  }

  return (
    <div className="flex flex-col gap-10">
      <section className="bg-white border border-slate-200 p-10 rounded-2xl shadow-sm">
<SectionHeader 
            title="Technology Registry" 
            hint="Master stack across all projects" 
            action={<button onClick={scanAll} disabled={loading} className="text-[13px] font-bold text-blue-600 px-4 py-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all">{loading ? 'Calculating...' : 'Recalculate'}</button>}
          />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tools.length === 0 && (
            <div className="col-span-3 py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
              <p className="text-slate-400 font-medium italic">No technology modules registered...</p>
            </div>
          )}
          {tools.map((t, i) => (
            <div key={t.name + i} onClick={() => { setEditing(i); setForm(t); }} className={`p-8 bg-slate-50 border-2 rounded-xl transition-all cursor-pointer group ${editing === i ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:border-slate-200 hover:bg-white'}`}>
              <div className="flex justify-between items-center mb-4">
                <p className={`text-[15px] font-bold ${editing === i ? 'text-blue-700' : 'text-slate-900'}`}>{t.name}</p>
                <span className="text-[12px] font-bold text-blue-600">{t.usageLevel}%</span>
              </div>
              <div className="h-2 bg-slate-200 w-full rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${t.usageLevel}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border border-slate-200 p-10 rounded-2xl shadow-sm">
        <h3 className="text-[16px] font-bold text-slate-800 mb-8">{editing !== null ? 'Modify Technology' : 'Register New Tool'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <Field label="Name"><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} /></Field>
          <Field label="Version"><input value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} className={inputClass} /></Field>
          <Field label="Usage (%)"><input type="number" value={form.usageLevel} onChange={e => setForm(f => ({ ...f, usageLevel: Number(e.target.value) }))} className={inputClass} /></Field>
        </div>
        <div className="mt-10 flex gap-4">
          <button onClick={save} className="px-10 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-100">Save Tool</button>
          {editing !== null && <button onClick={() => { setTools(tools.filter((_, i) => i !== editing)); setEditing(null); setForm({ name: '', version: '', usageLevel: 80 }); }} className="text-red-500 font-bold ml-auto px-4 py-2 hover:bg-red-50 rounded-lg transition-all">Delete</button>}
        </div>
      </section>
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
      <SectionHeader title="Strategic Roadmap" hint="Vision and future developments" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['short', 'mid', 'long'].map(sec => (
          <div key={sec} className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm flex flex-col gap-6">
            <h4 className="text-[12px] font-bold text-blue-600 uppercase tracking-widest">{sec} term</h4>
            <div className="flex flex-col gap-3 min-h-[100px]">
              {items.filter(i => i.section === sec).map(i => (
                <div key={i.id} onClick={() => { setEditing(i.id); setForm({ text: i.text, section: i.section }); }} className="text-[13px] text-slate-600 hover:text-blue-600 hover:bg-blue-50 cursor-pointer transition-all p-3 rounded-lg border border-transparent hover:border-blue-100 flex items-start gap-3 group">
                  <span className="text-blue-400 mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 group-hover:scale-125 transition-transform" /> 
                  <span className="flex-1">{i.text}</span>
                </div>
              ))}
              {items.filter(i => i.section === sec).length === 0 && (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-50 rounded-xl py-8">
                  <p className="text-[11px] text-slate-300 font-bold uppercase tracking-widest">No goals set</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <section className="bg-white border border-slate-200 p-10 rounded-2xl shadow-sm">
        <h3 className="text-[16px] font-bold text-slate-800 mb-8">{editing ? 'Edit Goal' : 'Add Strategic Goal'}</h3>
        <div className="flex gap-8">
          <Field label="Goal Description" className="flex-1"><input value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} className={inputClass} /></Field>
          <Field label="Timeframe" className="w-64">
            <select value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value as any }))} className={inputClass}>
              <option value="short">Short Term</option>
              <option value="mid">Mid Term</option>
              <option value="long">Long Term</option>
            </select>
          </Field>
        </div>
        <button onClick={save} className="mt-8 px-10 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-100">Save Objective</button>
      </section>
    </div>
  );
}

/* ─── Settings Tab ─── */

function SettingsTab({ onLog }: { onLog: (msg: string) => void }) {
  const [settings, setSettings] = useState<SiteSettings>({ availabilityValue: 99.9, dustThresholdDays: 60, starsForGold: 5, status: 'ONLINE', logLimit: 10, versionMap: {}, roadmapLabels: { short: { label: '', timeframe: '' }, mid: { label: '', timeframe: '' }, long: { label: '', timeframe: '' } } });
  const [cvLoading, setCvLoading] = useState(false);
  const [versionInput, setVersionInput] = useState('GO=v1.23+');
  const [labelInput, setLabelInput] = useState({ section: 'short' as 'short'|'mid'|'long', label: '', timeframe: '' });

  useEffect(() => { const s = localStorage.getItem('portfolioSettings'); if (s) setSettings(JSON.parse(s)); }, []);

  function update(partial: Partial<SiteSettings>) {
    const next = { ...settings, ...partial }; setSettings(next);
    localStorage.setItem('portfolioSettings', JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('portfolioSettingsChanged'));
    onLog(`UPDATED: ${Object.keys(partial)[0]}`);
  }

  async function uploadCv(e: any) {
    const file = e.target.files?.[0]; if (!file) return;
    setCvLoading(true); onLog('UPLOADING CV...');
    try {
      const b64 = await new Promise(r => { const rd = new FileReader(); rd.onload = () => r((rd.result as string).split(',')[1]); rd.readAsDataURL(file); });
      const res = await fetch('/api/github', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'uploadCv', base64: b64 }) });
      if (!res.ok) throw new Error('UPLOAD_FAILED');
      update({ cvUrl: '/cv.pdf' }); onLog('CV UPLOADED');
    } catch (e: any) { onLog(`CV_ERROR: ${e.message}`); }
    finally { setCvLoading(false); }
  }

  function addVersionMap() {
    const [key, val] = versionInput.split('=').map(s => s.trim());
    if (!key || !val) return;
    update({ versionMap: { ...settings.versionMap, [key.toUpperCase()]: val } });
    setVersionInput('');
    onLog(`VERSION_ADDED: ${key}`);
  }

  function removeVersionMap(key: string) {
    const next = { ...settings.versionMap };
    delete next[key];
    update({ versionMap: next });
  }

  function addRoadmapLabel() {
    if (!labelInput.label || !labelInput.timeframe) return;
    update({ roadmapLabels: { ...settings.roadmapLabels, [labelInput.section]: { label: labelInput.label, timeframe: labelInput.timeframe } } });
    setLabelInput({ section: 'short', label: '', timeframe: '' });
    onLog(`ROADMAP_LABEL_UPDATED: ${labelInput.section}`);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <section className="bg-white border border-slate-200 p-10 rounded-2xl shadow-sm flex flex-col gap-10">
        <SectionHeader title="System Status" hint="Global availability controls" />
        <div className="space-y-8">
          <Field label={`Availability Vector: ${settings.availabilityValue}%`}>
            <input type="range" min={0} max={100} step={0.1} value={settings.availabilityValue} onChange={e => update({ availabilityValue: Number(e.target.value) })} className="w-full h-2 bg-slate-100 rounded-full appearance-none accent-blue-600 cursor-pointer" />
          </Field>
          <Field label="Global Status Mode">
            <select value={settings.status} onChange={e => update({ status: e.target.value as any })} className={inputClass}>
              <option value="ONLINE">ONLINE (NORMAL)</option>
              <option value="BUSY">BUSY (THROTTLED)</option>
              <option value="OFFLINE">OFFLINE (MAINTENANCE)</option>
            </select>
          </Field>
          <div className="pt-8 border-t border-slate-100 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="text-[12px] font-bold text-slate-600">Secure CV Uplink</span>
              {settings.cvUrl && <a href={settings.cvUrl} target="_blank" className="text-[11px] font-bold text-blue-600 hover:underline">View Active PDF</a>}
            </div>
            <input type="file" onChange={uploadCv} className="hidden" id="cv-up" />
            <label htmlFor="cv-up" className="block text-center border-2 border-dashed border-slate-200 rounded-xl py-12 cursor-pointer text-[13px] font-bold text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all">
              {cvLoading ? 'Uploading...' : 'Click to Upload CV (PDF)'}
            </label>
          </div>
        </div>
      </section>

      <section className="bg-white border border-slate-200 p-10 rounded-2xl shadow-sm flex flex-col gap-10">
        <SectionHeader title="Engine Metrics" hint="Thresholds and data density" />
        <div className="space-y-10">
          <Field label={`Dust Threshold: ${settings.dustThresholdDays} Days`}>
            <input type="range" min={7} max={365} value={settings.dustThresholdDays} onChange={e => update({ dustThresholdDays: Number(e.target.value) })} className="w-full h-2 bg-slate-100 rounded-full appearance-none accent-amber-500 cursor-pointer" />
          </Field>
          <Field label={`Gold Stars Requirement: ${settings.starsForGold}`}>
            <input type="range" min={0} max={50} value={settings.starsForGold} onChange={e => update({ starsForGold: Number(e.target.value) })} className="w-full h-2 bg-slate-100 rounded-full appearance-none accent-amber-500 cursor-pointer" />
          </Field>
          <Field label="Birth Date (age auto-calculation)">
            <input type="date" value={settings.birthDate || ''} onChange={e => update({ birthDate: e.target.value })} className={inputClass} placeholder="YYYY-MM-DD" />
          </Field>
          <div className="pt-10 border-t border-slate-100">
            <button onClick={() => { if(confirm('Wipe local buffers?')) { localStorage.clear(); window.location.reload(); } }} className="w-full py-4 text-red-500 font-bold border border-red-100 bg-red-50 rounded-xl hover:bg-red-100 transition-all">Clear Local Cache</button>
          </div>
        </div>
      </section>

      
    </div>
  );
}

/* ─── Publish Tab ─── */

function PublishTab({ onLog }: { onLog: (msg: string) => void }) {
  const [publishing, setPublishing] = useState(false);
  const [builds, setBuilds] = useState<BuildEntry[]>([]);

  useEffect(() => { const s = localStorage.getItem('portfolioBuildHistory'); if (s) setBuilds(JSON.parse(s)); }, []);

  async function publish() {
    setPublishing(true); onLog('INIT SYNC...');
    try {
      const keys = ['portfolioProjects', 'portfolioSettings', 'portfolioExperience', 'portfolioAmbitions', 'portfolioTechstack', 'portfolioIdentity'];
      const files = keys.filter(k => !!localStorage.getItem(k)).map(k => ({ path: `public/data/${k.replace('portfolio', '').toLowerCase()}.json`, content: localStorage.getItem(k)! }));
      const res = await fetch('/api/github', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'publish', branch: 'main', files }) });
      if (!res.ok) throw new Error('SYNC_FAILED');
      onLog('PUBLISH SUCCESS');
      const entry: BuildEntry = { buildNumber: (builds[0]?.buildNumber ?? 0) + 1, status: 'SUCCESS', timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '), files: files.map(f => f.path.split('/').pop()!) };
      const next = [entry, ...builds].slice(0, 10); localStorage.setItem('portfolioBuildHistory', JSON.stringify(next)); setBuilds(next);
    } catch (e: any) { onLog(`PUBLISH_ERROR: ${e.message}`); }
    finally { setPublishing(false); }
  }

  return (
    <div className="flex flex-col gap-10">
      <section className="bg-white border border-slate-200 p-12 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="flex flex-col gap-6 relative z-10">
          <div>
            <h2 className="text-[24px] text-slate-900 font-bold tracking-tight mb-2">Publish Changes</h2>
            <p className="text-[14px] text-slate-500 max-w-2xl leading-relaxed font-medium">Synchronize your local workspace with the live production site. This will trigger a GitHub Action rebuild. Estimated time: 60s.</p>
          </div>
          <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Target Repository</span>
            <span className="text-[15px] font-bold text-blue-600 font-mono tracking-tight">Portfolio Live</span>
          </div>
          <button onClick={publish} disabled={publishing} className="bg-blue-600 text-white text-[15px] font-bold py-6 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-[0.99] disabled:opacity-50">
            {publishing ? 'Synchronizing Buffers...' : 'Publish to Production ↑'}
          </button>
        </div>
      </section>
      
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-[16px] font-bold text-slate-800">Deployment History</h3>
          <span className="text-[11px] font-bold text-slate-400 uppercase">Last 10 events</span>
        </div>
        <div className="divide-y divide-slate-50">
          {builds.length === 0 && <div className="p-12 text-center text-slate-300 font-medium italic">No recent builds found...</div>}
          {builds.map(b => (
            <div key={b.buildNumber} className="px-10 py-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-10">
                <span className="text-slate-900 font-bold text-[15px]">#{String(b.buildNumber).padStart(3, '0')}</span>
                <div className="flex flex-col">
                  <span className={`text-[13px] font-bold ${b.status === 'SUCCESS' ? 'text-green-600' : 'text-red-500'}`}>{b.status}</span>
                  <span className="text-[11px] text-slate-400 font-medium">{b.timestamp}</span>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 font-bold bg-slate-100 px-3 py-1 rounded-full uppercase">{b.files[0]} +{b.files.length - 1} more</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ─── MAIN CONSOLE ─── */

export default function AdminPanel() {
  const [auth, setAuth] = useState(false);
  const [tab, setTab] = useState<any>('projects');
  const [ready, setReady] = useState(false);
  const [logs, setLogs] = useState<string[]>(['SYSTEM READY', 'AWAITING OPERATOR INPUT']);

  const addLog = useCallback((msg: string) => { setLogs(prev => [`${new Date().toLocaleTimeString()} — ${msg}`, ...prev].slice(0, 50)); }, []);

  useEffect(() => {
    if (isSessionValid()) {
      setAuth(true);
      addLog('SESSION RECOVERED');
    }
    setReady(true);
  }, [addLog]);
  
  if (!ready) return null;
  if (!auth) return <PasswordGate onAuth={() => setAuth(true)} />;

  return (
    <div className="h-screen bg-[#f8fafc] flex overflow-hidden font-sans text-slate-900 select-none">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-72 border-r border-slate-200 flex flex-col shrink-0 bg-white z-20">
        <div className="p-10 border-b border-slate-50 flex flex-col gap-1">
          <p className="text-[20px] text-slate-900 font-black tracking-tighter">Core OS</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Admin Live</p>
          </div>
        </div>
        <nav className="flex-1 p-6 flex flex-col gap-2">
          {[
            { id: 'projects', label: 'Modules', icon: '◈' },
            { id: 'tech', label: 'Registry', icon: '◰' },
            { id: 'ambitions', label: 'Roadmap', icon: '▲' },
            { id: 'system', label: 'System', icon: '◉' },
            { id: 'publish', label: 'Publish', icon: '↑' },
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => { setTab(t.id); addLog(`NAV: ${t.label}`); }} 
              className={`text-left px-6 py-4 text-[14px] font-bold transition-all duration-200 rounded-xl flex items-center gap-4 ${tab === t.id ? 'text-blue-600 bg-blue-50 shadow-sm shadow-blue-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            >
              <span className={`text-[18px] transition-all duration-300 ${tab === t.id ? 'scale-110' : 'opacity-40'}`}>{t.icon}</span> 
              {t.label}
            </button>
          ))}
        </nav>
        <div className="p-8 border-t border-slate-50 flex flex-col gap-3">
          <a href="/" className="w-full flex items-center justify-center gap-3 px-4 py-3 text-[12px] text-slate-600 font-bold bg-slate-100 rounded-lg hover:bg-slate-200 transition-all">
            <span>↗</span> View Portfolio
          </a>
          <button onClick={() => { sessionStorage.removeItem(SESSION_KEY); window.location.reload(); }} className="w-full flex items-center justify-center gap-3 px-4 py-3 text-[12px] text-red-500 font-bold bg-red-50 rounded-lg hover:bg-red-100 transition-all">
            <span>✕</span> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] relative">
        <div className="flex-1 overflow-y-auto px-16 py-16 custom-scrollbar relative z-10">
          <div className="max-w-6xl mx-auto island-load">
            {tab === 'projects'   && <ProjectsTab onLog={addLog} />}
            {tab === 'tech'       && <TechTab onLog={addLog} />}
            {tab === 'ambitions'  && <AmbitionsTab onLog={addLog} />}
            {tab === 'system'     && <SettingsTab onLog={addLog} />}
            
            {tab === 'publish'    && <PublishTab onLog={addLog} />}
          </div>
        </div>
      </main>

      {/* SESSION HISTORY LOGS (LIGHT MODE) */}
      <aside className="w-72 border-l border-slate-200 bg-white flex flex-col shrink-0 z-20">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Live Terminal</p>
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
        </div>
        <div className="flex-1 p-6 flex flex-col gap-3 overflow-y-auto text-[11px] font-medium opacity-60 hover:opacity-100 transition-opacity">
          {logs.map((l, i) => (
            <div key={i} className={`flex gap-3 leading-relaxed border-b border-slate-50 pb-2 ${i === 0 ? 'text-blue-600' : 'text-slate-500'}`}>
              <span className="font-bold opacity-30">{logs.length - i}</span>
              <span>{l}</span>
            </div>
          ))}
        </div>
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-400 font-bold uppercase">Identity</span>
            <p className="text-[12px] text-slate-900 font-bold">Administrator</p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-400 font-bold uppercase">Security</span>
            <p className="text-[11px] text-green-600 font-bold">Session Active</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
