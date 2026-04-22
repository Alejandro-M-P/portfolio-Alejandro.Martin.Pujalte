import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface MasonryItem {
  id: string;
  component: React.ReactNode;
}

interface CoreMasonryProps {
  items: MasonryItem[];
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-1.5 mb-6">
      <div className="flex items-center gap-3">
        <div className="w-1 h-3 bg-cobalt" />
        <h2 className="text-[11px] text-white/60 font-black tracking-[0.4em] uppercase">{title}</h2>
      </div>
      <div className="h-px bg-white/5 w-full" />
    </div>
  );
}

export default function CoreMasonry({ items }: CoreMasonryProps) {
  const [showMobileLogs, setShowMobileLogs] = useState(false);

  const findItem = (id: string) => items.find(i => i.id === id)?.component;

  return (
    <div className="w-full min-h-screen bg-black font-sans select-none relative overflow-x-hidden text-white">
      
      {/* BOTÓN FLOTANTE TERMINAL (Solo Móvil) */}
      <button 
        onClick={() => setShowMobileLogs(!showMobileLogs)}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-cobalt text-white rounded-full shadow-[0_0_30px_rgba(0,85,255,0.4)] flex items-center justify-center border border-white/20 active:scale-90 transition-all"
      >
        <span className="text-xl">{showMobileLogs ? '✕' : '📟'}</span>
      </button>

      {/* DRAWER DE LOGS (Solo Móvil) */}
      <div className={`
        lg:hidden fixed inset-x-0 bottom-0 z-40 bg-black/95 border-t border-white/10 transition-transform duration-500 ease-out p-6 pt-10
        ${showMobileLogs ? 'translate-y-0' : 'translate-y-full'}
        h-[70vh] flex flex-col backdrop-blur-xl
      `}>
        <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-3">
          <span className="text-[10px] text-cobalt font-black tracking-[0.4em] uppercase tracking-widest text-center flex-1">System_Live_Telemetry</span>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[11px] opacity-60 text-blue-100/80 leading-relaxed">
          {findItem('logs')}
        </div>
      </div>

      {/* UNIFIED RESPONSIVE GRID - DARK INDUSTRIAL */}
      <div className="max-w-[2400px] mx-auto p-4 sm:p-6 lg:p-10 lg:h-screen lg:max-h-screen flex flex-col lg:flex-row gap-6 md:gap-8 min-h-0">
        
        {/* COLUMNA 1: IDENTIDAD */}
        <div className="w-full lg:w-[clamp(320px,22vw,440px)] flex flex-col gap-6 shrink-0 lg:h-full">
          <motion.div 
            layoutId="identity"
            className="w-full bg-transparent lg:h-full overflow-hidden island-load border border-white/5"
          >
            <div className="lg:h-full lg:overflow-y-auto custom-scrollbar">
              {findItem('identity')}
            </div>
          </motion.div>

          {/* LOGS EN DESKTOP */}
          <motion.div 
            layoutId="logs-desktop"
            className="hidden lg:flex flex-col border border-white/5 bg-carbono-surface/10 overflow-hidden h-48 shrink-0"
          >
            <div className="flex-1 p-4 flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                <span className="text-[9px] text-white/20 font-bold tracking-[0.3em] uppercase">System_Output</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 text-[10px] opacity-30 font-mono">
                {findItem('logs')}
              </div>
            </div>
          </motion.div>
        </div>

        {/* COLUMNA 2: PROYECTOS Y DATA */}
        <div className="flex-1 flex flex-col gap-6 md:gap-8 lg:h-full min-w-0 min-h-0">
          
          {/* PROJECTS GRID */}
          <motion.div 
            layoutId="projects"
            className="flex-1 lg:min-h-0 bg-carbono-surface/5 border border-white/5 p-6 sm:p-10 flex flex-col island-load"
          >
            <SectionHeader title="// DEPLOYED_MODULES" />
            <div className="flex-1 lg:overflow-y-auto custom-scrollbar min-h-[400px] lg:min-h-0">
              {findItem('projects')}
            </div>
          </motion.div>

          {/* TECH & ROADMAP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:h-80 shrink-0">
            
            <motion.div 
              layoutId="tech"
              className="bg-carbono-surface/5 border border-white/5 p-6 sm:p-8 flex flex-col h-full"
            >
              <SectionHeader title="// TECH_ENVIRONMENT" />
              <div className="flex-1 lg:overflow-y-auto custom-scrollbar min-h-[250px] lg:min-h-0">
                {findItem('tech')}
              </div>
            </motion.div>

            <motion.div 
              layoutId="roadmap"
              className="bg-carbono-surface/5 border border-white/5 p-6 sm:p-8 flex flex-col h-full"
            >
              <SectionHeader title="// STRATEGIC_ROADMAP" />
              <div className="flex-1 lg:overflow-y-auto custom-scrollbar min-h-[250px] lg:min-h-0">
                {findItem('roadmap')}
              </div>
            </motion.div>

          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        .island-load { animation: island-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes island-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
