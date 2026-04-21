import React, { useState, useEffect, useRef, useCallback } from 'react';
import LogTerminal from './LogTerminal';
import type { LogEntry, Project, SiteSettings } from '../../types';

// ── Command logic ─────────────────────────────────────────────────────────────

const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  white:  '\x1b[97m',
  gray:   '\x1b[90m',
  green:  '\x1b[32m',
  brightGreen: '\x1b[92m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  cyan:   '\x1b[36m',
  blue:   '\x1b[34m',
  magenta: '\x1b[35m',
};

const COMMANDS = [
  'help', 'ls', 'open', 'status', 'wget cv', 'scan', 'whoami', 'matrix', 'rm', 'ssh', 'clear', 'exit'
];

const HIDDEN = [
  'hire-me','neofetch','top','ssh','stars','coffee','matrix','rm -rf /', 'rm', 'openc'
];

function execute(raw: string, close: () => void): string[] {
  const parts = raw.trim().split(/\s+/);
  const cmd   = parts[0]?.toLowerCase() ?? '';
  const args  = parts.slice(1);

  const o = (s: string) => `${C.gray}${s}${C.reset}`;
  const g = (s: string) => `${C.brightGreen}${s}${C.reset}`;
  const e = (s: string) => `${C.red}${s}${C.reset}`;
  const w = (s: string) => `${C.yellow}${s}${C.reset}`;
  const b = (s: string) => `${C.blue}${s}${C.reset}`;

  const loadData = () => {
    let projects: Project[] = [];
    let settings: SiteSettings = { availabilityValue: 100 };
    try {
      projects = JSON.parse(localStorage.getItem('portfolioProjects') ?? '[]');
      settings = JSON.parse(localStorage.getItem('portfolioSettings') ?? '{}');
    } catch {}
    return { projects, settings };
  };

  const { projects, settings } = loadData();
  const bar = "▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄";

  switch (cmd) {
    case 'help': return [
      `${C.bold}${C.white}// AVAILABLE_PROTOCOLS${C.reset}`,
      o('─────────────────────────────────────────────'),
      `${g('ls'.padEnd(10))} ${o('— list active system modules')}`,
      `${g('open'.padEnd(10))} ${o('— access specific module detail')}`,
      `${g('status'.padEnd(10))} ${o('— check bunker integrity status')}`,
      `${g('wget cv'.padEnd(10))} ${o('— download system operator resume')}`,
      `${g('scan'.padEnd(10))} ${o('— network security & module scan')}`,
      `${g('whoami'.padEnd(10))} ${o('— display operator profile data')}`,
      `${g('clear'.padEnd(10))} ${o('— reset terminal interface')}`,
      `${g('exit'.padEnd(10))} ${o('— close console and return to logs')}`,
      o('─────────────────────────────────────────────'),
      w('// HINT: Use "ls -a" for classified protocols.')
    ];

    case 'ls': {
      const lines: string[] = [`${C.bold}${C.white}ACTIVE_MODULES:${C.reset}`];
      if (projects.length === 0) lines.push(o('  (no modules detected)'));
      else projects.forEach(p => {
        const stars = Number(p.specs?.stars ?? 0);
        const isGold = !!(p.isHighlighted || p.isFavorite || stars >= 5);
        const color = isGold ? '\x1b[33m' : C.brightGreen;
        lines.push(`${color}  [ONLINE]  ${p.id.padEnd(20)} [${p.stack.slice(0, 2).join(', ')}]${C.reset}`);
      });
      if (args.includes('-a')) {
        lines.push('', w('CLASSIFIED_PROTOCOLS:'));
        HIDDEN.forEach(c => lines.push(w(`  ${c.padEnd(20)} [ENCRYPTED]`)));
      }
      return lines;
    }

    case 'openc': {
      const target = args[0]?.toLowerCase() || '';
      if (!target) return [e('Usage: openc <module-id>')];
      const proj = projects.find(p => p.id.toLowerCase().includes(target) || p.name.toLowerCase().includes(target));
      if (proj) {
        const el = document.querySelector(`[data-project-id="${proj.id}"]`);
        if (el) { (el as HTMLElement).style.opacity = '1'; (el as HTMLElement).style.transform = 'scale(1)'; (el as HTMLElement).style.filter = 'none'; }
        setTimeout(() => { window.dispatchEvent(new CustomEvent('portfolioOpenProject', { detail: { project: proj } })); close(); }, 1200);
        return [b(`[REGENERATING] ${proj.name}`), g(`${bar.slice(0, 40)} 100%`), g(`✓ Module remounted.`)];
      }
      return [e(`Error: Module ${target} not found.`)];
    }

    case 'rm': {
      const target = args[0]?.toLowerCase() || '';
      if (args.includes('-rf') && (args.includes('/') || args.includes('/*'))) {
        window.dispatchEvent(new CustomEvent('portfolioSystemPurge'));
        return [e(`[FATAL] rm -rf /`), e(bar), w(`SYSTEM_WIPED. Reload to reboot.`)];
      }
      if (target) {
        const proj = projects.find(p => p.id.toLowerCase().includes(target) || p.name.toLowerCase().includes(target));
        if (proj) {
          const el = document.querySelector(`[data-project-id="${proj.id}"]`);
          if (el) { (el as HTMLElement).style.opacity = '0'; (el as HTMLElement).style.transform = 'scale(0.8)'; (el as HTMLElement).style.filter = 'blur(10px)'; }
          return [e(`[DELETING] ${proj.name}`), e(`${bar.slice(0, 40)} 100%`), w(`Module unmounted.`)];
        }
      }
      return [e('Usage: rm <module-id> or rm -rf /')];
    }

    case 'status': return [b(`[SYSTEM_CHECK] Verifying...`), g(`✓ UPTIME: ${settings.availabilityValue || 100}%`), g(`✓ MODULES: ${projects.length}`), o(`All systems nominal.`)];
    case 'wget': {
      if (args[0]?.includes('cv')) {
        const cvUrl = settings.cvUrl || '/cv.pdf';
        const a = document.createElement('a'); a.href = cvUrl; a.download = 'Alejandro-CV.pdf';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        return [o(`Connecting...`), b(`[STREAM] ${bar.slice(0, 25)}`), g(`✓ Done.`)];
      }
      return [e(`wget: Not found.`)];
    }
    case 'hire-me': return [g('Initializing hire sequence...'), o(bar.slice(0, 30)), g('✓ CV attached'), w('→ Contact: martinpujaltea@gmail.com')];
    case 'neofetch': return ['', g('    admin@bunker'), g('    ─────────────────────────────'), o('    OS:     Bazzite (Atomic Linux)'), o('    Shell:  fish'), o('    Editor: LazyVim'), w('    Status: Available for hire'), ''];
    case 'top': return [o('Tasks: 12 running, 248 overthinking'), w('%Cpu: 42.0 coffee-powered'), '', o('PID    COMMAND'), o('──────────────────────────'), w('1337   coffee_daemon'), o('2048   side_projects'), e('4096   impostor_syndrome')];
    case 'stars': {
      let total = 0; projects.forEach(p => total += parseInt(String(p.specs?.stars || '0')));
      return [g(`[STATS] Total GitHub Stars: ${total}`)];
    }
    case 'coffee': return [o('☕ COFFEE STATUS:'), g('  Level: CRITICAL'), o('Brewing more...')];
    case 'ssh': return [o(`Connecting...`), w(`RSA: AlejandroMP/BunkerBridge`), g(`→ Access granted.`)];
    case 'whoami': return [g(`{`), g(`  "user": "alejandro.martin.pujalte",`), g(`  "status": "${settings.status || 'ONLINE'}"`), g(`}`)];
    case 'matrix': { document.body.classList.add('hdr-glitch'); setTimeout(() => document.body.classList.remove('hdr-glitch'), 2000); close(); return [w('Entering matrix...')]; }
    case 'scan': return [g(`[RUNNING] SCAN...`), o(bar.slice(0, 30)), g(`✓ Status: OPTIMIZED`)];
    case 'clear': return ['__CLEAR__'];
    case 'exit': close(); return [];
    case 'restore': { window.dispatchEvent(new CustomEvent('portfolioSystemRestore')); return [g(`[SUCCESS] System restored.`)]; }
    case 'sudo': 
      if (raw.includes('rm -rf')) return execute(raw.replace('sudo', '').trim(), close);
      return [e(`sudo: user 'admin' already has maximum privileges.`)];
    case '': return [];
    default: return [e(`${cmd}: command not found`)];
  }
}

const COMMAND_LIST = ['help', 'ls', 'open', 'status', 'wget', 'scan', 'whoami', 'matrix', 'purge', 'rm', 'clear', 'exit', 'ssh', 'stars', 'top', 'neofetch', 'hire-me', 'coffee'];

export default function LogsPanel({ logs, logLimit = 10 }: { logs: LogEntry[], logLimit?: number }) {
  const [mode, setMode] = useState<'logs' | 'terminal'>(() => {
    if (typeof window !== 'undefined') return (sessionStorage.getItem('terminal_mode') as 'logs' | 'terminal') || 'logs';
    return 'logs';
  });
  const [phase, setPhase] = useState<'idle' | 'crt-off' | 'crt-boot'>('idle');
  const xtermContainer = useRef<HTMLDivElement>(null);
  const termRef = useRef<any>(null);
  const inputBuf = useRef('');
  const history = useRef<string[]>([]);
  const historyIdx = useRef(-1);
  const modeRef = useRef<'logs' | 'terminal'>(mode);
  
  useEffect(() => { modeRef.current = mode; sessionStorage.setItem('terminal_mode', mode); }, [mode]);

  const enterTerminal = useCallback(() => { if (modeRef.current === 'terminal') return; setPhase('crt-off'); setTimeout(() => { setMode('terminal'); setPhase('crt-boot'); setTimeout(() => setPhase('idle'), 600); }, 350); }, []);
  const exitTerminal = useCallback(() => { if (modeRef.current === 'logs') return; setPhase('crt-off'); setTimeout(() => { setMode('logs'); setPhase('crt-boot'); setTimeout(() => setPhase('idle'), 500); }, 350); }, []);

  useEffect(() => {
    const handlePurge = async () => {
      const sections = document.querySelectorAll('section, main, aside:not(:has(.terminal-scanlines))');
      const filtered = Array.from(sections).filter(s => !s.contains(xtermContainer.current));
      for (const s of filtered.reverse()) {
        (s as HTMLElement).style.transition = 'all 1s ease'; (s as HTMLElement).style.opacity = '0'; (s as HTMLElement).style.filter = 'blur(20px)';
        await new Promise(r => setTimeout(r, 600));
      }
      if (termRef.current) {
        await new Promise(r => setTimeout(r, 2000));
        const cmd = 'restore --force';
        for (const char of cmd) { termRef.current.write(char); await new Promise(r => setTimeout(r, 80)); }
        termRef.current.write('\r\n');
        setTimeout(() => { execute('restore --force', exitTerminal).forEach(l => termRef.current.writeln(l)); termRef.current.write(`\x1b[36madmin@portfolio:$\x1b[0m `); }, 500);
      }
    };
    const handleRestore = () => {
      document.querySelectorAll('section, main, aside').forEach((s: any) => { s.style.opacity = '1'; s.style.filter = 'none'; s.style.transform = 'none'; });
      document.body.classList.add('hdr-glitch');
      setTimeout(() => document.body.classList.remove('hdr-glitch'), 1000);
    };
    window.addEventListener('portfolioSystemPurge', handlePurge);
    window.addEventListener('portfolioSystemRestore', handleRestore);
    return () => { window.removeEventListener('portfolioSystemPurge', handlePurge); window.removeEventListener('portfolioSystemRestore', handleRestore); };
  }, []);

  useEffect(() => {
    const onKeyUp = (e: KeyboardEvent) => { if (e.key === 'Escape' && modeRef.current === 'terminal') exitTerminal(); };
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('openTerminal', enterTerminal);
    return () => { window.removeEventListener('keyup', onKeyUp); window.removeEventListener('openTerminal', enterTerminal); };
  }, [enterTerminal, exitTerminal]);

  useEffect(() => {
    if (mode !== 'terminal') return;
    let disposed = false;
    (async () => {
      await import('@xterm/xterm/css/xterm.css');
      const { Terminal } = await import('@xterm/xterm');
      const { FitAddon } = await import('@xterm/addon-fit');
      if (disposed || !xtermContainer.current) return;
      const term = new Terminal({ cursorBlink: true, cursorStyle: 'underline', fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, theme: { background: '#000000', foreground: '#cccccc', cursor: '#ffffff', red: '#ff4444', green: '#00ff41', yellow: '#ffb000', blue: '#0055ff' } });
      const fit = new FitAddon(); term.loadAddon(fit); term.open(xtermContainer.current); termRef.current = term;
      term.writeln(`\x1b[1m\x1b[97mBUNKER TERMINAL v3.0.0 — ADMIN_CONSOLE\x1b[0m`);
      term.writeln(`\x1b[90m─────────────────────────────────────────────\x1b[0m`);
      term.write(`\x1b[36madmin@portfolio:$\x1b[0m `);
      setTimeout(() => { if (!disposed) { fit.fit(); term.focus(); } }, 650);
      const ro = new ResizeObserver(() => { if (!disposed) fit.fit(); });
      ro.observe(xtermContainer.current!);
      term.onKey(async ({ key, domEvent: ev }) => {
        if (ev.key === 'Enter') {
          term.writeln(''); const raw = inputBuf.current; inputBuf.current = '';
          if (raw.trim()) history.current = [raw, ...history.current].slice(0, 50);
          const out = execute(raw, exitTerminal);
          if (out[0] === '__CLEAR__') { 
            for(let i=0; i<5; i++) { term.writeln('\x1b[2K'); await new Promise(r => setTimeout(r, 20)); }
            term.clear(); term.writeln(`\x1b[1m\x1b[97mBUNKER TERMINAL v3.0.0 — ADMIN_CONSOLE\x1b[0m`); term.writeln(`\x1b[90m─────────────────────────────────────────────\x1b[0m`);
          } else {
            for (const line of out) { for (let i = 0; i < line.length; i++) { term.write(line[i]); await new Promise(r => setTimeout(r, 2)); } term.writeln(''); await new Promise(r => setTimeout(r, 10)); }
          }
          term.write(`\x1b[36madmin@portfolio:$\x1b[0m `);
        } else if (ev.key === 'Backspace') {
          if (inputBuf.current.length > 0) { inputBuf.current = inputBuf.current.slice(0, -1); term.write('\b \b'); }
        } else if (ev.key === 'ArrowUp') {
          ev.preventDefault();
          if (history.current.length > 0) {
            const nextIdx = Math.min(historyIdx.current + 1, history.current.length - 1);
            historyIdx.current = nextIdx;
            term.write('\b \b'.repeat(inputBuf.current.length));
            inputBuf.current = history.current[nextIdx];
            term.write(inputBuf.current);
          }
        } else if (ev.key === 'ArrowDown') {
          ev.preventDefault();
          const nextIdx = Math.max(historyIdx.current - 1, -1);
          historyIdx.current = nextIdx;
          term.write('\b \b'.repeat(inputBuf.current.length));
          inputBuf.current = nextIdx === -1 ? '' : history.current[nextIdx];
          term.write(inputBuf.current);
        } else if (ev.key === 'Tab') {
          ev.preventDefault();
          const cur = inputBuf.current.toLowerCase().trim();
          if (!cur) return;
          const matches = COMMAND_LIST.filter(c => c.startsWith(cur));
          if (matches.length === 1) {
            term.write('\b \b'.repeat(inputBuf.current.length));
            inputBuf.current = matches[0] + ' ';
            term.write(inputBuf.current);
          }
        } else if (key.length === 1) {
          inputBuf.current += key; term.write(key);
        }
      });
      return () => ro.disconnect();
    })();
    return () => { disposed = true; termRef.current?.dispose(); termRef.current = null; };
  }, [mode, exitTerminal]);

  return (
    <div className="border border-white/10 bg-carbono-surface w-full flex flex-col h-full overflow-hidden island-load">
      <div className={`border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-carbono shrink-0 group ${mode === 'logs' ? 'cursor-pointer hover:bg-carbono/20' : ''}`} onClick={mode === 'logs' ? enterTerminal : undefined}>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-faint tracking-widest uppercase">{mode === 'logs' ? 'SYSTEM LOGS' : 'BUNKER TERMINAL'}</span>
          {mode === 'logs' && (
            <span className="text-[9px] text-white/40 tracking-widest uppercase opacity-40 group-hover:opacity-100 transition-opacity">
              [ {'>'}_ ENTER_TERMINAL ]
            </span>
          )}
        </div>
        <div className="flex gap-1.5 ml-auto"><div className="w-2 h-2 bg-err/60" /><div className="w-2 h-2 bg-warn/60" /><div className="w-2 h-2 bg-cobalt/60" /></div>
        {mode === 'logs' ? <span className="text-[10px] text-cobalt tracking-widest">● LIVE</span> : <button onClick={exitTerminal} className="text-[10px] text-text-faint hover:text-err tracking-widest transition-colors">✕ EXIT</button>}
      </div>
      <div className={`flex-1 min-h-0 flex flex-col overflow-hidden ${phase === 'crt-off' ? 'crt-off' : ''} ${phase === 'crt-boot' ? 'crt-boot' : ''}`}>
        {mode === 'logs' ? <LogTerminal logs={logs} logLimit={logLimit} hideHeader /> : <div ref={xtermContainer} className="flex-1 min-h-0 terminal-scanlines" style={{ background: '#000000' }} />}
      </div>
    </div>
  );
}
