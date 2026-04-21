import React, { useState, useEffect } from 'react';
import type { Ambition } from '../../types';
import Checkbox from './Checkbox';

interface RoadmapProps {
  ambitions: Ambition[];
}

const STORAGE_KEY = 'portfolio_ambitions_v2';
const SESSION_KEY = 'admin_session';

const sectionMeta: Record<Ambition['section'], { label: string; timeframe: string }> = {
  short: { label: 'PHASE_01: IMMEDIATE', timeframe: '0-3 MONTHS' },
  mid:   { label: 'PHASE_02: STRATEGIC', timeframe: '3-12 MONTHS' },
  long:  { label: 'PHASE_03: VISION',    timeframe: '1+ YEAR' },
};

export default function Roadmap({ ambitions: initial }: RoadmapProps) {
  const [items, setItems] = useState<Ambition[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [adding, setAdding] = useState<Ambition['section'] | null>(null);
  const [newText, setNewText] = useState('');

  const STORAGE_KEY_V2 = 'portfolio_ambitions_v2';
  const SESSION_KEY_V2 = 'admin_session';

  useEffect(() => {
    setIsAdmin(sessionStorage.getItem(SESSION_KEY) === 'true');

    // Load ambitions from localStorage first (admin panel saves here)
    const loadAmbitions = () => {
      const stored = localStorage.getItem('portfolioAmbitions');
      if (stored) {
        try {
          setItems(JSON.parse(stored));
        } catch (e) {
          console.warn('Failed to parse portfolioAmbitions from localStorage', e);
          // Fallback to fetch
          fetchAmbitionsFromJson();
        }
        return;
      }
      // If nothing in localStorage, fetch from JSON
      fetchAmbitionsFromJson();
    };

    const fetchAmbitionsFromJson = () => {
      fetch('/data/ambitions.json')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            setItems(data);
            // Also save to localStorage for consistency
            try {
              localStorage.setItem('portfolioAmbitions', JSON.stringify(data));
            } catch (e) {
              console.warn('Failed to save ambitions to localStorage', e);
            }
          } else {
            setItems(initial);
          }
        })
        .catch(() => {
          setItems(initial);
        });
    };

    // Initial load
    loadAmbitions();

    // Load checkbox state from localStorage (per-visitor)
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setChecked(JSON.parse(saved));
    } catch {}

    // Listen for data updates from admin panel
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'portfolioAmbitions' || e.key === STORAGE_KEY) {
        // Reload ambitions if the main data changed
        if (e.key === 'portfolioAmbitions') {
          loadAmbitions();
        }
        // Reload checkbox state if the checkbox storage changed
        if (e.key === STORAGE_KEY) {
          try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) setChecked(JSON.parse(saved));
          } catch {}
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggle = (id: string, val: boolean) => {
    const next = { ...checked, [id]: val };
    setChecked(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const addGoal = (section: Ambition['section']) => {
    if (!newText.trim()) return;
    setItems(prev => [...prev, { id: `${section}-${Date.now()}`, section, text: newText.trim(), completed: false }]);
    setNewText('');
    setAdding(null);
  };

  const removeGoal = (id: string) => setItems(prev => prev.filter(a => a.id !== id));

  return (
    <div className="border border-white/10 bg-carbono-surface p-4 island-load h-full overflow-y-auto">
      <div className="flex flex-col gap-6">
        {(['short', 'mid', 'long'] as const).map(section => {
          const sectionItems = items.filter(a => a.section === section);
          const { label, timeframe } = sectionMeta[section];
          return (
            <div key={section} className="border border-white/10 bg-carbono p-4 flex flex-col gap-3">
              <div className="flex justify-between items-end border-b border-white/10 pb-2">
                <p className="text-[14px] text-cobalt tracking-widest font-bold">{label}</p>
                <p className="text-[11px] text-text-faint tracking-widest italic">{timeframe}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                {sectionItems.length === 0 && (
                  <p className="text-[14px] text-text-faint tracking-widest">NO_GOALS_REGISTERED</p>
                )}
                {sectionItems.map(a => (
                  <div key={a.id} className="flex items-start gap-1 group">
                    <div className="flex-1">
                      <Checkbox
                        label={a.text}
                        checked={checked[a.id] ?? a.completed}
                        onChange={val => toggle(a.id, val)}
                      />
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => removeGoal(a.id)}
                        className="text-[14px] text-err/50 hover:text-err transition-colors flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100"
                      >×</button>
                    )}
                  </div>
                ))}
              </div>

              {isAdmin && (
                adding === section ? (
                  <div className="flex flex-col gap-1 mt-1">
                    <input
                      autoFocus
                      value={newText}
                      onChange={e => setNewText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') addGoal(section);
                        if (e.key === 'Escape') { setAdding(null); setNewText(''); }
                      }}
                      placeholder="New goal..."
                      className="bg-carbono-surface border border-white/20 px-2 py-1 text-[14px] text-white font-mono w-full focus:outline-none focus:border-cobalt"
                    />
                    <div className="flex gap-1">
                      <button onClick={() => addGoal(section)} className="flex-1 bg-cobalt text-white text-[14px] tracking-widest py-1 hover:bg-cobalt-light transition-colors">ADD</button>
                      <button onClick={() => { setAdding(null); setNewText(''); }} className="text-[14px] text-text-faint px-2 hover:text-white">CANCEL</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAdding(section); setNewText(''); }}
                    className="text-[14px] text-text-faint hover:text-cobalt tracking-widest uppercase transition-colors mt-1 text-left"
                  >
                    + ADD_GOAL
                  </button>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
