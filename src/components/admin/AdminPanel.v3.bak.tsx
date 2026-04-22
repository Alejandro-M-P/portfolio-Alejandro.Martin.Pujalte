// FORCE_REFRESH_V2_CORE
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

const inputClass = "bg-black/20 border border-white/5 px-4 py-3 text-[13px] text-white font-mono w-full focus:outline-none focus:border-cobalt/40 transition-all duration-200 placeholder:opacity-20";

/* ─── Shared Industrial Components ─── */

function SectionHeader({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 mb-10">
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <h2 className="text-[14px] text-white tracking-[0.4em] font-bold uppercase leading-none">{title}</h2>
          {hint && <p className="text-[9px] text-text-faint tracking-widest uppercase font-bold opacity-40">{hint}</p>}
        </div>
        {action}
      </div>
      <div className="h-px bg-linear-to-r from-cobalt/40 via-white/5 to-transparent w-full" />
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="w-1 h-1 bg-cobalt opacity-40" />
        <label className="text-[10px] text-text-faint tracking-widest uppercase font-bold">{label}{required && <span className="text-cobalt ml-1">*</span>}</label>
      </div>
      {children}
    </div>
  );
}

function CheckField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-4 cursor-pointer select-none group py-1">
      <div className={`w-4 h-4 border ${value ? 'bg-cobalt border-cobalt shadow-[0_0_10px_rgba(0,85,255,0.4)]' : 'border-white/10 group-hover:border-white/20'} transition-all flex items-center justify-center`}>
        {value && <span className="text-[10px] text-white">✓</span>}
      </div>
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} className="hidden" />
      <span className="text-[10px] text-text-muted tracking-[0.2em] uppercase group-hover:text-white transition-colors">{label}</span>
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
    <div className="min-h-screen bg-[#050608] flex items-center justify-center p-6 font-mono select-none overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cobalt/5 blur-[120px] rounded-full" />
      <div className="absolute inset-0 grid grid-cols-6 opacity-5 pointer-events-none">
        {[...Array(6)].map((_, i) => <div key={i} className="border-r border-white/10" />)}
      </div>

      <div className="relative flex flex-col gap-12 w-full max-w-lg bg-[#0a0c12]/80 backdrop-blur-xl border border-white/5 p-16 shadow-2xl">
        <div className="flex flex-col gap-3">
          <p className="text-[11px] text-cobalt tracking-[0.5em] font-bold uppercase">CORE_CONSOLE // AUTH</p>
          <div className="h-px bg-linear-to-r from-cobalt/40 to-transparent w-full" />
        </div>
        
        <form onSubmit={submit} className="flex flex-col gap-10">
          <div className="flex flex-col gap-5">
            <label className="text-[10px] text-text-faint tracking-widest uppercase font-bold opacity-50">// ACCESS_TOKEN_REQUIRED</label>
            <div className="flex items-center gap-6 bg-black/40 border border-white/5 p-6 focus-within:border-cobalt/30 transition-all group">
              <span className="text-cobalt text-xl font-bold animate-pulse group-focus-within:scale-110 transition-transform">$</span>
              <input 
                type="password" 
                value={pw} 
                onChange={e => setPw(e.target.value)} 
                className="bg-transparent border-none p-0 text-white focus:outline-none w-full text-xl tracking-[0.6em] placeholder:opacity-10" 
                placeholder="••••••••" 
                autoFocus 
                disabled={countdown > 0 || loading} 
              />
            </div>
          </div>
          
          <div className="min-h-[20px]">
            {countdown > 0 ? (
              <p className="text-[10px] text-err tracking-widest uppercase font-bold animate-pulse">SYSTEM_LOCKOUT: {mins}:{secs} SEC</p>
            ) : err ? (
              <p className="text-[10px] text-err tracking-widest uppercase font-bold animate-pulse">!! {err}</p>
            ) : (
              <p className="text-[10px] text-text-faint tracking-widest uppercase font-bold opacity-30">Awaiting encrypted bypass...</p>
            )}
          </div>

          <button 
            type="submit" 
            disabled={countdown > 0 || loading} 
            className="w-full text-[11px] font-bold tracking-[0.3em] uppercase py-5 bg-white/5 border border-white/10 text-white hover:bg-cobalt hover:border-cobalt transition-all shadow-lg active:scale-[0.98]"
          >
            {loading ? 'AUTHENTICATING...' : 'INITIALIZE_CORE_BRIDGE \u2192'}
          </button>
        </form>

        <div className="flex justify-between items-center opacity-20">
          <span className="text-[8px] text-text-faint tracking-widest">v4.2.0-STABLE</span>
          <span className="text-[8px] text-text-faint tracking-widest uppercase">Encrypted Session</span>
        </div>
      </div>
    </div>
  );
}
