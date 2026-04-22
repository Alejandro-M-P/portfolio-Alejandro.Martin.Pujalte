import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { prepare, layout } from '@chenglou/pretext';

interface MasonryItem {
  id: string;
  component: React.ReactNode;
}

interface CoreMasonryProps {
  items: MasonryItem[];
  identityData?: any;
  logs?: any[];
}

export default function CoreMasonry(props: CoreMasonryProps) {
  const { items, identityData, logs = [] } = props;
  const findItem = (id: string) => items.find(i => i.id === id)?.component;
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const sidebarWeight = useMemo(() => {
    if (!mounted || !identityData?.bio) return 1.5;
    try {
      const preparedBio = prepare(identityData.bio, "14px Inter");
      const bioSize = layout(preparedBio, 400, 20);
      return bioSize.height > 100 ? 1.9 : 1.7;
    } catch (e) {
      return 1.6;
    }
  }, [mounted, identityData?.bio]);

  const SectionHeader = ({ title, color = 'bg-cobalt' }: { title: string; color?: string }) => (
    <div className="flex flex-col mb-3 md:mb-4 w-full shrink-0">
      <div className="flex items-center justify-between pb-2">
        <span className="text-[9px] md:text-[11px] font-black text-white/40 tracking-[0.3em] uppercase">{title}</span>
      </div>
      <div className={`h-0.5 w-full ${color} opacity-30`} />
    </div>
  );

  return (
    <div className="w-full h-screen max-h-screen flex flex-col items-center bg-black overflow-hidden font-sans select-none">
      <div className="max-w-[2400px] w-full h-full p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 md:gap-8 min-h-0">
        
        {/* SIDEBAR: IDENTIDAD (GIGANTE) + LOGS (MINIMIZADO) */}
        <div 
          className="flex flex-col gap-6 w-full lg:w-[clamp(400px,30vw,600px)] h-full shrink-0 min-h-0"
          style={{ flexGrow: sidebarWeight }}
        >
          {/* IDENTIDAD: Se lleva casi todo el alto (flex-grow) */}
          <motion.div 
            layoutId="identity" 
            layout 
            className="flex-[4] min-h-0 border border-white/5 bg-carbono-surface/20 backdrop-blur-md overflow-hidden shadow-2xl"
          >
             <div className="h-full overflow-y-auto custom-scrollbar">
                {findItem('identity')}
             </div>
          </motion.div>
          
          {/* LOGS: Altura fija pequeña para que no moleste */}
          <motion.div 
            layoutId="logs" 
            layout 
            className="h-[180px] lg:h-[220px] flex-none hidden lg:flex flex-col border border-white/5 bg-carbono-surface/10 backdrop-blur-sm overflow-hidden"
          >
            <div className="flex-1 p-4 flex flex-col h-full overflow-hidden">
              <SectionHeader title="// PROCESS_LOG" />
              <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 text-[10px] opacity-40 hover:opacity-100 transition-opacity">
                {findItem('logs')}
              </div>
            </div>
          </motion.div>
        </div>

        {/* CUERPO: PROYECTOS + RESTO */}
        <div className="flex-[4] flex flex-col gap-6 md:gap-8 h-full min-w-0">
          
          <motion.div layoutId="projects" layout className="flex-[2.5] min-h-0">
            <section className="h-full border border-white/5 bg-carbono-surface/20 backdrop-blur-md p-6 md:p-8 overflow-hidden relative shadow-2xl flex flex-col">
              <SectionHeader title="// MODULE_STORAGE" />
              <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 mt-2">
                {findItem('projects')}
              </div>
            </section>
          </motion.div>

          <div className="flex-1 hidden min-h-[450px]:flex flex-col md:flex-row gap-6 md:gap-8 min-h-0">
            <motion.div layoutId="tech" layout className="flex-1 min-h-0">
              <section className="h-full border border-white/5 bg-carbono-surface/20 backdrop-blur-md p-5 overflow-hidden flex flex-col shadow-xl">
                <SectionHeader title="// TECH_STACK" />
                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                  {findItem('tech')}
                </div>
              </section>
            </motion.div>

            <motion.div layoutId="roadmap" layout className="flex-1 min-h-0">
              <section className="h-full border border-white/5 bg-carbono-surface/20 backdrop-blur-md p-5 overflow-hidden flex flex-col shadow-xl">
                <SectionHeader title="// ROADMAP" />
                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                  {findItem('roadmap')}
                </div>
              </section>
            </motion.div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); }
      `}</style>
    </div>
  );
}
