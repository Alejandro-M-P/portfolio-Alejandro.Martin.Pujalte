import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Project } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type OutputLine =
  | { type: 'output' | 'error' | 'success' | 'warn'; content: string }
  | { type: 'input'; content: string };

// ─── Data helpers ─────────────────────────────────────────────────────────────

function getProjects(): Project[] {
  try {
    const s = localStorage.getItem('portfolioProjects');
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

// ─── ANSI color codes ─────────────────────────────────────────────────────────

const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  white:   '\x1b[97m',
  gray:    '\x1b[90m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  red:     '\x1b[31m',
  cyan:    '\x1b[36m',
  blue:    '\x1b[34m',
};

const HIDDEN_COMMANDS = [
  'hire-me', 'neofetch', 'top',
  'ssh recruiter@company.com', 'ping salary',
  'rm -rf impostor-syndrome', 'chmod +x career.sh && ./career.sh',
  'git blame recruiter', 'uname -a', 'cat /etc/motd',
];

// ─── Command executor (returns ANSI strings) ──────────────────────────────────

function executeCommand(raw: string, close: () => void): string[] {
  const parts = raw.trim().split(/\s+/);
  const cmd   = parts[0]?.toLowerCase() ?? '';
  const args  = parts.slice(1);

  const out = (s: string) => `${C.gray}${s}${C.reset}`;
  const ok  = (s: string) => `${C.green}${s}${C.reset}`;
  const err = (s: string) => `${C.red}${s}${C.reset}`;
  const wrn = (s: string) => `${C.yellow}${s}${C.reset}`;

  switch (cmd) {
    case 'help':
      return [
        `${C.bold}${C.white}AVAILABLE COMMANDS:${C.reset}`,
        out('  help          — show this message'),
        out('  ls            — list projects'),
        out('  ls -a         — list projects + hidden commands'),
        out('  whoami        — who lives in this bunker'),
        out('  status        — system status'),
        out('  sudo <cmd>    — attempt privilege escalation'),
        out('  clear         — clear terminal'),
        out('  exit          — close terminal'),
      ];

    case 'ls': {
      const projects = getProjects();
      const lines: string[] = [`${C.bold}${C.white}PROJECTS:${C.reset}`];
      if (projects.length === 0) {
        lines.push(out('  (no projects loaded)'));
      } else {
        projects.forEach(p => {
          lines.push(out(`  ${p.id.padEnd(24)} [${p.stack.slice(0, 3).join(', ')}]`));
        });
      }
      if (args.includes('-a')) {
        lines.push('');
        lines.push(wrn('CLASSIFIED COMMANDS:'));
        HIDDEN_COMMANDS.forEach(c => lines.push(wrn(`  ${c.padEnd(36)} [CLASSIFIED]`)));
      }
      return lines;
    }

    case 'whoami': {
      const ageYears = new Date().getFullYear() - new Date('2007-12-17').getFullYear();
      return [
        ok('{'),
        ok('  "user":           "alejandro.martin.pujalte",'),
        ok('  "alias":          "gest",'),
        ok('  "role":           "senior_engineer",'),
        ok('  "specialization": ["systems", "local-AI", "devtools", "clean-arch"],'),
        ok('  "os":             "Bazzite  (Atomic Linux)",'),
        ok('  "shell":          "fish",'),
        ok('  "editor":         "LazyVim",'),
        ok('  "container_tool": "Distrobox + Podman",'),
        ok(`  "uptime":         "${ageYears}y (and counting)",`),
        ok('  "status":         "AVAILABLE_FOR_HIRE",'),
        ok('  "github":         "@Alejandro-M-P"'),
        ok('}'),
      ];
    }

    case 'status': {
      const projects = getProjects();
      const s = localStorage.getItem('portfolioSettings');
      const availability = s ? JSON.parse(s).availabilityValue ?? 99.9 : 99.9;
      const load = [
        (Math.random() * 0.6 + 0.1).toFixed(2),
        (Math.random() * 0.5 + 0.1).toFixed(2),
        (Math.random() * 0.4 + 0.1).toFixed(2),
      ].join(' ');
      const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
      return [
        out(`BUNKER STATUS — ${ts}`),
        out('────────────────────────────────────────────'),
        ok('● bunker.online         UP'),
        ok('● github.sync           ACTIVE'),
        ok(`● availability          ${availability}%`),
        out(`● active_projects       ${projects.length}`),
        out(`● load_avg              ${load}`),
        wrn('● coffee_level          CRITICAL'),
        out('────────────────────────────────────────────'),
        out('All systems nominal.'),
      ];
    }

    case 'sudo':
      return [err('alejandro is not in the sudoers file. This incident will be reported.')];

    case 'clear':
      return ['__CLEAR__'];

    case 'exit':
      close();
      return [];

    // ── Hidden ──────────────────────────────────────────────────────────────

    case 'hire-me':
      return [
        ok('Initializing hire sequence...'),
        out('[████████████████████] 100%'),
        ok('✓ CV attached'),
        ok('✓ Portfolio verified'),
        ok('✓ Salary expectations: negotiable (but not too negotiable)'),
        '',
        wrn('→ Ball is in your court now. martinpujaltea@gmail.com'),
      ];

    case 'neofetch':
      return [
        '',
        ok('    alejandro@bunker'),
        ok('    ─────────────────────────────'),
        out('    OS:     Bazzite 42 (Atomic Linux)'),
        out('    Kernel: 6.9.0-bazzite'),
        out('    Shell:  fish 3.7'),
        out('    Editor: LazyVim (Neovim)'),
        out('    WM:     KDE Plasma 6 (Wayland)'),
        out('    CPU:    Coffee™ i9 (caffeine-powered)'),
        wrn('    Memory: Sufficient for the task'),
        out('    Uptime: 26 years, still no manual'),
        '',
      ];

    case 'top':
      return [
        out('Tasks: 12 running, 248 overthinking, 0 stopped'),
        wrn('%Cpu: 42.0 us, 12.0 sy, 3.0 coffee'),
        '',
        out('PID    %CPU  %MEM  COMMAND'),
        out('──────────────────────────────────────'),
        wrn('1337   99.9   0.1  coffee_daemon'),
        out('2048   45.2   2.3  side_project'),
        err('4096   12.8   8.7  impostor_syndrome  [KILLING...]'),
        out('8192    8.4   1.2  open_source_contribs'),
        err('9999    0.1   0.0  work_life_balance  [ZOMBIE]'),
      ];

    case 'ping': {
      const target = args[0] ?? 'localhost';
      if (target === 'salary') {
        return [
          out('PING salary.negotiable (0.0.0.0): 56 data bytes'),
          ok('64 bytes from salary: icmp_seq=0 ttl=64 time=2.4ms'),
          ok('64 bytes from salary: icmp_seq=1 ttl=64 time=1.8ms'),
          out('^C'),
          out('--- salary ping statistics ---'),
          out('2 packets transmitted, 2 received, 0% packet loss'),
          wrn("(It's alive. Let's talk.)"),
        ];
      }
      return [
        out(`PING ${target}: 56 data bytes`),
        out('Request timeout for icmp_seq 0'),
      ];
    }

    case 'ssh':
      return [
        out("The authenticity of host 'company.com' can't be established."),
        wrn('Are you sure you want to continue? (yes/no): yes'),
        out("Warning: Permanently added 'company.com' to known hosts."),
        ok('→ Connection established.'),
        ok('→ Sending CV...'),
        ok('→ Done. Ball is in your court.'),
      ];

    case 'rm':
      if (args.includes('-rf') && args.includes('impostor-syndrome')) {
        return [
          err("rm: cannot remove 'impostor-syndrome': Operation not permitted"),
          err('rm: it keeps coming back'),
          wrn("try 'shipping-more-projects' instead"),
        ];
      }
      return [err('rm: refusing to do anything destructive without a good reason')];

    case 'chmod':
      if (raw.includes('career.sh')) {
        return [
          out('Initializing career.sh...'),
          out('[=====>              ] 30% Loading skills...'),
          out('[==========>         ] 60% Applying experience...'),
          out('[================>   ] 85% Adding coffee...'),
          ok('[====================] 100% Done.'),
          ok('→ Career successfully launched. Watch this space.'),
        ];
      }
      return [err('chmod: operation not supported in this bunker')];

    case 'git':
      if (args[0] === 'blame' && args[1] === 'recruiter') {
        return [
          err("fatal: no such path 'recruiter' in HEAD"),
          wrn('hint: Did you mean to run this on yourself?'),
        ];
      }
      return [out(`git: '${args.join(' ')}' is not a git command. See 'git --help'.`)];

    case 'uname':
      return [out('Alejandro-Brain 6.9.0-bazzite #1 SMP Wed Apr 20 2026 alejandro@bunker GNU/Coffee')];

    case 'cat':
      if (args[0] === '/etc/motd') {
        return [
          ok("Welcome to Alejandro's Bunker."),
          out('This system is monitored. All commands are logged.'),
          out('Unauthorized access will result in... nothing, really.'),
          wrn("But I'll know."),
        ];
      }
      return [err(`cat: ${args[0]}: No such file or directory`)];

    case '':
      return [];

    default:
      return [
        err(`${cmd}: command not found`),
        out('Try "help" or "ls -a" for available commands.'),
      ];
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

const PROMPT = `\x1b[36mgest@portfolio:~$\x1b[0m `;

const BOOT_LINES = [
  '\x1b[97m\x1b[1mBUNKER TERMINAL v1.0.0 — Alejandro.MP\x1b[0m',
  '\x1b[90m─────────────────────────────────────────────\x1b[0m',
  '\x1b[90mType "help" for commands. Type "ls -a" if you\'re brave.\x1b[0m',
  '',
];

export default function TerminalOverlay() {
  const [isOpen, setIsOpen]   = useState(false);
  const containerRef           = useRef<HTMLDivElement>(null);
  const termRef                = useRef<import('@xterm/xterm').Terminal | null>(null);
  const fitRef                 = useRef<import('@xterm/addon-fit').FitAddon | null>(null);
  const inputBuf               = useRef('');
  const history                = useRef<string[]>([]);
  const historyIdx             = useRef(-1);
  const closeRef               = useRef<() => void>(() => {});

  const close = useCallback(() => setIsOpen(false), []);
  closeRef.current = close;

  // ── Global keyboard shortcut ──────────────────────────────────────────────
  useEffect(() => {
    let ctrlDown = 0;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') ctrlDown = Date.now();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if ((e.key === 'Control' || e.key === 'Meta') && Date.now() - ctrlDown < 200) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    const onOpen = () => setIsOpen(true);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('openTerminal', onOpen);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('openTerminal', onOpen);
    };
  }, []);

  // ── Mount / unmount xterm ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    let disposed = false;

    (async () => {
      await import('@xterm/xterm/css/xterm.css');
      const { Terminal }  = await import('@xterm/xterm');
      const { FitAddon }  = await import('@xterm/addon-fit');

      if (disposed || !containerRef.current) return;

      const term = new Terminal({
        cursorBlink: true,
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        fontSize: 12,
        lineHeight: 1.4,
        theme: {
          background:   '#0a0a0a',
          foreground:   '#e5e5e5',
          cursor:       '#3b82f6',
          cursorAccent: '#0a0a0a',
          black:        '#1a1a1a',
          brightBlack:  '#555555',
        },
        scrollback: 500,
        allowProposedApi: true,
      });

      const fit = new FitAddon();
      term.loadAddon(fit);
      term.open(containerRef.current);
      fit.fit();

      termRef.current = term;
      fitRef.current  = fit;

      // Print boot lines
      BOOT_LINES.forEach(l => term.writeln(l));
      term.write(PROMPT);

      // Handle resize
      const ro = new ResizeObserver(() => fit.fit());
      if (containerRef.current) ro.observe(containerRef.current);

      // ── Input handling ────────────────────────────────────────────────────
      term.onKey(({ key, domEvent }) => {
        const ev = domEvent;

        // Ctrl+C — interrupt
        if (ev.ctrlKey && ev.key === 'c') {
          term.writeln('^C');
          inputBuf.current = '';
          historyIdx.current = -1;
          term.write(PROMPT);
          return;
        }

        // Ctrl+L — clear
        if (ev.ctrlKey && ev.key === 'l') {
          term.clear();
          BOOT_LINES.forEach(l => term.writeln(l));
          term.write(PROMPT);
          return;
        }

        switch (ev.key) {
          case 'Enter': {
            term.writeln('');
            const raw = inputBuf.current;
            if (raw.trim()) {
              history.current = [raw, ...history.current].slice(0, 50);
            }
            historyIdx.current = -1;
            inputBuf.current   = '';

            // Echo the command (already shown via char echo below)
            const output = executeCommand(raw, () => closeRef.current());

            if (output.length === 1 && output[0] === '__CLEAR__') {
              term.clear();
              BOOT_LINES.forEach(l => term.writeln(l));
            } else {
              output.forEach(l => term.writeln(l));
            }
            term.write(PROMPT);
            break;
          }

          case 'Backspace': {
            if (inputBuf.current.length > 0) {
              inputBuf.current = inputBuf.current.slice(0, -1);
              term.write('\b \b');
            }
            break;
          }

          case 'ArrowUp': {
            ev.preventDefault();
            const nextIdx = Math.min(historyIdx.current + 1, history.current.length - 1);
            if (history.current[nextIdx] !== undefined) {
              // Clear current input on screen
              term.write('\b \b'.repeat(inputBuf.current.length));
              historyIdx.current = nextIdx;
              inputBuf.current   = history.current[nextIdx];
              term.write(inputBuf.current);
            }
            break;
          }

          case 'ArrowDown': {
            ev.preventDefault();
            const nextIdx = Math.max(historyIdx.current - 1, -1);
            term.write('\b \b'.repeat(inputBuf.current.length));
            historyIdx.current = nextIdx;
            inputBuf.current   = nextIdx === -1 ? '' : (history.current[nextIdx] ?? '');
            term.write(inputBuf.current);
            break;
          }

          default: {
            // Printable character
            if (key.length === 1 && !ev.ctrlKey && !ev.altKey && !ev.metaKey) {
              inputBuf.current += key;
              term.write(key);
            }
            break;
          }
        }
      });

      term.focus();
    })();

    return () => {
      disposed = true;
      if (termRef.current) {
        termRef.current.dispose();
        termRef.current = null;
        fitRef.current  = null;
      }
      inputBuf.current   = '';
      historyIdx.current = -1;
    };
  }, [isOpen]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:p-8"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) close(); }}
    >
      <div
        className="terminal-open border border-white/20 w-full max-w-3xl flex flex-col"
        style={{ height: 'min(540px, 80vh)', boxShadow: '0 0 60px rgba(0,0,0,0.8)', background: '#0a0a0a' }}
      >
        {/* Header */}
        <div className="border-b border-white/10 px-4 py-2.5 flex items-center justify-between shrink-0" style={{ background: '#111111' }}>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-text-faint tracking-widest">BUNKER_TERMINAL</span>
            <span className="text-[10px] text-text-faint/40">v1.0.0</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-text-faint/40 tracking-widest">ESC to close</span>
            <button onClick={close} className="text-[10px] text-text-faint hover:text-err shrink-0 transition-colors">✕</button>
          </div>
        </div>

        {/* xterm container */}
        <div ref={containerRef} className="flex-1 min-h-0 p-2" />
      </div>
    </div>
  );
}
