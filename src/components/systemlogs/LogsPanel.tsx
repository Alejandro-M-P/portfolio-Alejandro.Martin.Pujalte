import React, { useState, useEffect, useRef, useCallback } from 'react';
import LogTerminal from './LogTerminal';
import type { LogEntry } from '../../types';

// ── Command logic ─────────────────────────────────────────────────────────────

const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  white:  '\x1b[97m',
  gray:   '\x1b[90m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  cyan:   '\x1b[36m',
};

const HIDDEN = [
  'hire-me','neofetch','top','ssh recruiter@company.com',
  'ping salary','rm -rf impostor-syndrome',
  'chmod +x career.sh && ./career.sh','git blame recruiter',
  'uname -a','cat /etc/motd',
];

function execute(raw: string, close: () => void): string[] {
  const parts = raw.trim().split(/\s+/);
  const cmd   = parts[0]?.toLowerCase() ?? '';
  const args  = parts.slice(1);

  const o = (s: string) => `${C.gray}${s}${C.reset}`;
  const g = (s: string) => `${C.green}${s}${C.reset}`;
  const e = (s: string) => `${C.red}${s}${C.reset}`;
  const w = (s: string) => `${C.yellow}${s}${C.reset}`;

  switch (cmd) {
    case 'help': return [
      `${C.bold}${C.white}AVAILABLE COMMANDS:${C.reset}`,
      o('  help          — show this message'),
      o('  ls            — list projects'),
      o('  ls -a         — list projects + hidden commands'),
      o('  whoami        — who lives in this bunker'),
      o('  status        — system status'),
      o('  sudo <cmd>    — attempt privilege escalation'),
      o('  clear         — clear terminal'),
      o('  exit          — back to system logs'),
    ];

    case 'ls': {
      let projects: { id: string; stack: string[] }[] = [];
      try { projects = JSON.parse(localStorage.getItem('portfolioProjects') ?? '[]'); } catch {}
      const lines: string[] = [`${C.bold}${C.white}PROJECTS:${C.reset}`];
      if (projects.length === 0) lines.push(o('  (no projects loaded)'));
      else projects.forEach(p => lines.push(o(`  ${p.id.padEnd(24)} [${p.stack.slice(0, 3).join(', ')}]`)));
      if (args.includes('-a')) {
        lines.push('');
        lines.push(w('CLASSIFIED COMMANDS:'));
        HIDDEN.forEach(c => lines.push(w(`  ${c.padEnd(36)} [CLASSIFIED]`)));
      }
      return lines;
    }

    case 'whoami': {
      const age = new Date().getFullYear() - 2007;
      return [
        g('{'),
        g('  "user":           "alejandro.martin.pujalte",'),
        g('  "alias":          "gest",'),
        g('  "role":           "senior_engineer",'),
        g('  "specialization": ["systems", "local-AI", "devtools", "clean-arch"],'),
        g('  "os":             "Bazzite (Atomic Linux)",'),
        g('  "shell":          "fish",'),
        g('  "editor":         "LazyVim",'),
        g(`  "uptime":         "${age}y (and counting)",`),
        g('  "status":         "AVAILABLE_FOR_HIRE",'),
        g('  "github":         "@Alejandro-M-P"'),
        g('}'),
      ];
    }

    case 'status': {
      let settings: { availabilityValue?: number } = {};
      let projects: unknown[] = [];
      try { settings = JSON.parse(localStorage.getItem('portfolioSettings') ?? '{}'); } catch {}
      try { projects = JSON.parse(localStorage.getItem('portfolioProjects') ?? '[]'); } catch {}
      const av = settings.availabilityValue ?? 99.9;
      const load = [
        (Math.random() * 0.6 + 0.1).toFixed(2),
        (Math.random() * 0.5 + 0.1).toFixed(2),
        (Math.random() * 0.4 + 0.1).toFixed(2),
      ].join(' ');
      return [
        o(`BUNKER STATUS — ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`),
        o('────────────────────────────────────────────'),
        g('● bunker.online         UP'),
        g('● github.sync           ACTIVE'),
        g(`● availability          ${av}%`),
        o(`● active_projects       ${projects.length}`),
        o(`● load_avg              ${load}`),
        w('● coffee_level          CRITICAL'),
        o('All systems nominal.'),
      ];
    }

    case 'sudo':
      return [e('alejandro is not in the sudoers file. This incident will be reported.')];
    case 'clear': return ['__CLEAR__'];
    case 'exit': close(); return [];

    case 'wget': {
      const target = args[0] ?? '';
      if (target === 'cv.pdf' || target === 'cv' || target === 'resume.pdf') {
        let cvUrl: string | undefined;
        try { cvUrl = JSON.parse(localStorage.getItem('portfolioSettings') ?? '{}').cvUrl; } catch {}
        if (!cvUrl) return [e('wget: cv.pdf: No such URL configured'), o('Set a CV URL in the admin panel → Settings → CV URL')];
        const a = document.createElement('a');
        a.href = cvUrl; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.click();
        return [
          o(`--${new Date().toISOString().slice(11, 19)}-- ${cvUrl}`),
          o('Resolving...'),
          g('HTTP request sent, awaiting response... 200 OK'),
          g('✓ cv.pdf opened.'),
        ];
      }
      return [e(`wget: ${target}: No such target. Try: wget cv.pdf`)];
    }

    case 'hire-me': return [
      g('Initializing hire sequence...'),
      o('[████████████████████] 100%'),
      g('✓ CV attached'), g('✓ Portfolio verified'),
      g('✓ Salary expectations: negotiable (but not too negotiable)'),
      '', w('→ Ball is in your court now. martinpujaltea@gmail.com'),
    ];

    case 'neofetch': return [
      '', g('    alejandro@bunker'), g('    ─────────────────────────────'),
      o('    OS:     Bazzite 42 (Atomic Linux)'), o('    Kernel: 6.9.0-bazzite'),
      o('    Shell:  fish 3.7'), o('    Editor: LazyVim (Neovim)'),
      o('    WM:     KDE Plasma 6 (Wayland)'), o('    CPU:    Coffee™ i9 (caffeine-powered)'),
      w('    Memory: Sufficient for the task'), o('    Uptime: 26 years, still no manual'), '',
    ];

    case 'top': return [
      o('Tasks: 12 running, 248 overthinking, 0 stopped'),
      w('%Cpu: 42.0 us, 12.0 sy, 3.0 coffee'),
      '', o('PID    %CPU  %MEM  COMMAND'), o('──────────────────────────────────────'),
      w('1337   99.9   0.1  coffee_daemon'), o('2048   45.2   2.3  side_project'),
      e('4096   12.8   8.7  impostor_syndrome  [KILLING...]'),
      o('8192    8.4   1.2  open_source_contribs'),
      e('9999    0.1   0.0  work_life_balance  [ZOMBIE]'),
    ];

    case 'ping': {
      const t = args[0] ?? 'localhost';
      if (t === 'salary') return [
        o('PING salary.negotiable (0.0.0.0): 56 data bytes'),
        g('64 bytes from salary: icmp_seq=0 ttl=64 time=2.4ms'),
        g('64 bytes from salary: icmp_seq=1 ttl=64 time=1.8ms'),
        o('^C'), o('--- salary ping statistics ---'),
        o('2 packets transmitted, 2 received, 0% packet loss'),
        w("(It's alive. Let's talk.)"),
      ];
      return [o(`PING ${t}: 56 data bytes`), o('Request timeout for icmp_seq 0')];
    }

    case 'ssh': return [
      o("The authenticity of host 'company.com' can't be established."),
      w('Are you sure you want to continue? (yes/no): yes'),
      o("Warning: Permanently added 'company.com' to known hosts."),
      g('→ Connection established.'), g('→ Sending CV...'), g('→ Done. Ball is in your court.'),
    ];

    case 'rm':
      if (args.includes('-rf') && args.includes('impostor-syndrome')) return [
        e("rm: cannot remove 'impostor-syndrome': Operation not permitted"),
        e('rm: it keeps coming back'), w("try 'shipping-more-projects' instead"),
      ];
      return [e('rm: refusing to do anything destructive without a good reason')];

    case 'chmod':
      if (raw.includes('career.sh')) return [
        o('Initializing career.sh...'),
        o('[=====>              ] 30% Loading skills...'),
        o('[==========>         ] 60% Applying experience...'),
        o('[================>   ] 85% Adding coffee...'),
        g('[====================] 100% Done.'),
        g('→ Career successfully launched. Watch this space.'),
      ];
      return [e('chmod: operation not supported in this bunker')];

    case 'git':
      if (args[0] === 'blame' && args[1] === 'recruiter') return [
        e("fatal: no such path 'recruiter' in HEAD"),
        w('hint: Did you mean to run this on yourself?'),
      ];
      return [o(`git: '${args.join(' ')}' is not a git command. See 'git --help'.`)];

    case 'uname':
      return [o('Alejandro-Brain 6.9.0-bazzite #1 SMP 2026 alejandro@bunker GNU/Coffee')];

    case 'cat':
      if (args[0] === '/etc/motd') return [
        g("Welcome to Alejandro's Bunker."),
        o('This system is monitored. All commands are logged.'),
        o('Unauthorized access will result in... nothing, really.'),
        w("But I'll know."),
      ];
      return [e(`cat: ${args[0]}: No such file or directory`)];

    case '': return [];

    default: return [
      e(`${cmd}: command not found`),
      o('Try "help" or "ls -a" for available commands.'),
    ];
  }
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PROMPT = `\x1b[36mgest@portfolio:~$\x1b[0m `;
const BOOT = [
  `\x1b[1m\x1b[97mBUNKER TERMINAL v1.0.0 — Alejandro.MP\x1b[0m`,
  `\x1b[90m─────────────────────────────────────────────\x1b[0m`,
  `\x1b[90mType "help" for commands. Type "ls -a" if you're brave.\x1b[0m`,
  '',
];

// ── Types ─────────────────────────────────────────────────────────────────────

type Mode  = 'logs' | 'terminal';
type Phase = 'idle' | 'crt-off' | 'crt-boot';

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  logs: LogEntry[];
  logLimit?: number;
}

export default function LogsPanel({ logs, logLimit = 10 }: Props) {
  const [mode,  setMode]  = useState<Mode>('logs');
  const [phase, setPhase] = useState<Phase>('idle');
  const xtermContainer    = useRef<HTMLDivElement>(null);
  const termRef           = useRef<import('@xterm/xterm').Terminal | null>(null);
  const fitRef            = useRef<import('@xterm/addon-fit').FitAddon | null>(null);
  const inputBuf          = useRef('');
  const history           = useRef<string[]>([]);
  const historyIdx        = useRef(-1);
  const modeRef           = useRef<Mode>('logs');

  modeRef.current = mode;

  // ── Mode transitions ────────────────────────────────────────────────────────

  const enterTerminal = useCallback(() => {
    if (modeRef.current === 'terminal') return;
    setPhase('crt-off');
    setTimeout(() => {
      setMode('terminal');
      setPhase('crt-boot');
      setTimeout(() => setPhase('idle'), 600);
    }, 350);
  }, []);

  const exitTerminal = useCallback(() => {
    if (modeRef.current === 'logs') return;
    setPhase('crt-off');
    setTimeout(() => {
      setMode('logs');
      setPhase('crt-boot');
      setTimeout(() => setPhase('idle'), 500);
    }, 350);
  }, []);

  // ── Global keyboard shortcut ────────────────────────────────────────────────

  useEffect(() => {
    let ctrlDown = 0;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') ctrlDown = Date.now();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if ((e.key === 'Control' || e.key === 'Meta') && Date.now() - ctrlDown < 200) {
        e.preventDefault();
        modeRef.current === 'logs' ? enterTerminal() : exitTerminal();
      }
      if (e.key === 'Escape' && modeRef.current === 'terminal') exitTerminal();
    };
    const onOpen = () => enterTerminal();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);
    window.addEventListener('openTerminal', onOpen);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup',   onKeyUp);
      window.removeEventListener('openTerminal', onOpen);
    };
  }, [enterTerminal, exitTerminal]);

  // ── Mount xterm when in terminal mode ──────────────────────────────────────

  useEffect(() => {
    if (mode !== 'terminal') return;
    let disposed = false;

    (async () => {
      await import('@xterm/xterm/css/xterm.css');
      const { Terminal } = await import('@xterm/xterm');
      const { FitAddon } = await import('@xterm/addon-fit');
      if (disposed || !xtermContainer.current) return;

      const term = new Terminal({
        cursorBlink: true,
        fontFamily: '"JetBrains Mono","IBM Plex Mono",monospace',
        fontSize: 12,
        lineHeight: 1.45,
        theme: {
          background:   '#0d0d0d',
          foreground:   '#e5e5e5',
          cursor:       '#0055ff',
          cursorAccent: '#0d0d0d',
          selectionBackground: 'rgba(0,85,255,0.3)',
        },
        scrollback: 500,
      });

      const fit = new FitAddon();
      term.loadAddon(fit);
      term.open(xtermContainer.current);
      termRef.current = term;
      fitRef.current  = fit;

      BOOT.forEach(l => term.writeln(l));
      term.write(PROMPT);

      // Wait for CRT boot animation (~600ms) before fitting, so the
      // container has its real dimensions when xterm calculates columns/rows
      setTimeout(() => {
        if (!disposed) { fit.fit(); term.focus(); }
      }, 650);

      const ro = new ResizeObserver(() => { if (!disposed) fit.fit(); });
      ro.observe(xtermContainer.current!);

      term.onKey(({ key, domEvent: ev }) => {
        if (ev.ctrlKey && ev.key === 'c') {
          term.writeln('^C');
          inputBuf.current = '';
          historyIdx.current = -1;
          term.write(PROMPT);
          return;
        }
        if (ev.ctrlKey && ev.key === 'l') {
          term.clear();
          BOOT.forEach(l => term.writeln(l));
          term.write(PROMPT);
          return;
        }

        switch (ev.key) {
          case 'Enter': {
            term.writeln('');
            const raw = inputBuf.current;
            if (raw.trim()) history.current = [raw, ...history.current].slice(0, 50);
            historyIdx.current = -1;
            inputBuf.current   = '';
            const out = execute(raw, exitTerminal);
            if (out.length === 1 && out[0] === '__CLEAR__') {
              term.clear(); BOOT.forEach(l => term.writeln(l));
            } else {
              out.forEach(l => term.writeln(l));
            }
            term.write(PROMPT);
            break;
          }
          case 'Backspace':
            if (inputBuf.current.length > 0) {
              inputBuf.current = inputBuf.current.slice(0, -1);
              term.write('\b \b');
            }
            break;
          case 'ArrowUp': {
            ev.preventDefault();
            const idx = Math.min(historyIdx.current + 1, history.current.length - 1);
            if (history.current[idx] !== undefined) {
              term.write('\b \b'.repeat(inputBuf.current.length));
              historyIdx.current = idx;
              inputBuf.current   = history.current[idx];
              term.write(inputBuf.current);
            }
            break;
          }
          case 'ArrowDown': {
            ev.preventDefault();
            const idx = Math.max(historyIdx.current - 1, -1);
            term.write('\b \b'.repeat(inputBuf.current.length));
            historyIdx.current = idx;
            inputBuf.current   = idx === -1 ? '' : (history.current[idx] ?? '');
            term.write(inputBuf.current);
            break;
          }
          default:
            if (key.length === 1 && !ev.ctrlKey && !ev.altKey && !ev.metaKey) {
              inputBuf.current += key;
              term.write(key);
            }
        }
      });

      return () => ro.disconnect();
    })();

    return () => {
      disposed = true;
      termRef.current?.dispose();
      termRef.current = null;
      fitRef.current  = null;
      inputBuf.current   = '';
      historyIdx.current = -1;
    };
  }, [mode, exitTerminal]);

  // ── Render ─────────────────────────────────────────────────────────────────

  const bodyClass = [
    'flex-1 min-h-0 flex flex-col overflow-hidden',
    phase === 'crt-off'  ? 'crt-off'  : '',
    phase === 'crt-boot' ? 'crt-boot' : '',
  ].join(' ');

  return (
    <div className="border border-white/10 bg-carbono-surface w-full flex flex-col h-full overflow-hidden">

      {/* Header — changes with mode */}
      <div
        className={[
          'border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-carbono shrink-0 transition-colors duration-200 group',
          mode === 'logs' ? 'cursor-pointer hover:bg-carbono/20' : '',
        ].join(' ')}
        onClick={mode === 'logs' ? enterTerminal : undefined}
      >
        <div className={`flex items-center gap-3 ${phase !== 'idle' ? 'hdr-glitch' : ''}`}>
          <span className="text-xs text-text-faint tracking-widest uppercase">
            {mode === 'logs' ? 'SYSTEM LOGS' : 'BUNKER TERMINAL'}
          </span>
          {mode === 'logs' && (
            <span className="text-[9px] border border-white/15 px-2 py-0.5 text-white/30 tracking-widest uppercase group-hover:text-cobalt/60 transition-colors">
              &gt;_ open terminal
            </span>
          )}
        </div>

        <div className="flex gap-1.5 ml-auto">
          <div className="w-2 h-2 bg-err/60" />
          <div className="w-2 h-2 bg-warn/60" />
          <div className="w-2 h-2 bg-cobalt/60" />
        </div>

        {mode === 'logs' ? (
          <span className="text-[10px] text-cobalt tracking-widest">● LIVE</span>
        ) : (
          <button
            onClick={e => { e.stopPropagation(); exitTerminal(); }}
            className="text-[10px] text-text-faint hover:text-err tracking-widest transition-colors"
          >
            ✕ EXIT
          </button>
        )}
      </div>

      {/* Body — animated */}
      <div className={bodyClass}>
        {mode === 'logs' ? (
          <LogTerminal logs={logs} logLimit={logLimit} hideHeader />
        ) : (
          <div
            ref={xtermContainer}
            className="flex-1 min-h-0 terminal-scanlines"
            style={{ background: '#0d0d0d' }}
          />
        )}
      </div>
    </div>
  );
}
