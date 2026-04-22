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
      return bioSize.height > 100 ? 1.8 : 1.6;
    } catch (e) {
      return 1.6;
    }
  }, [mounted, identityData?.bio]);

  const SectionHeader = ({ title, color = 'bg-cobalt' }: { title: string; color?: string }) => (
    <div className="flex flex-col mb-3 md:mb-4 w-full shrink-0">
      <div className="flex items-center justify-between pb-2">
        <span className="text-[10px] md:text-[12px] font-black text-white/50 tracking-[0.25em] uppercase">{title}</span>
      </div>
      <div className={`h-0.5 w-full ${color} opacity-40 shadow-[0_0_10px_rgba(0,85,255,0.2)]`} />
    </div>
  );

  return (
    <div className="w-full h-screen max-h-screen flex flex-col items-center bg-black overflow-hidden font-sans select-none">
      <div className="max-w-[2200px] w-full h-full p-4 md:p-6 lg:p-10 flex flex-col lg:flex-row gap-6 md:gap-8 min-h-0">
        
        {/* SIDEBAR: REPARTO 50/50 (IDENTIDAD / TERMINAL) */}
        <div 
          className="flex flex-col gap-6 w-full lg:w-[clamp(400px,28vw,550px)] h-full shrink-0 min-h-0"
          style={{ flexGrow: sidebarWeight }}
        >
          {/* IDENTIDAD: Mitad Superior */}
          <motion.div 
            layoutId="identity" 
            layout 
            className="flex-1 min-h-0 border border-white/5 bg-carbono-surface/20 backdrop-blur-md overflow-hidden shadow-2xl"
          >
             <div className="h-full overflow-y-auto custom-scrollbar">
                {findItem('identity')}
             </div>
          </motion.div>
          
          {/* LOGS: Mitad Inferior */}
          <motion.div 
            layoutId="logs" 
            layout 
            className="flex-1 hidden lg:flex flex-col border border-white/5 bg-carbono-surface/20 backdrop-blur-md overflow-hidden"
          >
            <div className="flex-1 p-5 flex flex-col h-full overflow-hidden">
              <SectionHeader title="// CORE_SYSTEM_OUTPUT" />
              <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 text-[11px] opacity-60">
                {findItem('logs')}
              </div>
            </div>
          </motion.div>
        </div>

        {/* CUERPO PRINCIPAL: PROYECTOS + TECH/ROADMAP */}
        <div className="flex-[3] flex flex-col gap-6 md:gap-8 h-full min-w-0">
          
          {/* PROJECTS: Bloque superior dominante */}
          <motion.div layoutId="projects" layout className="flex-[1.6] min-h-0">
            <section className="h-full border border-white/5 bg-carbono-surface/20 backdrop-blur-md p-6 md:p-10 overflow-hidden relative shadow-2xl flex flex-col">
              <SectionHeader title="// DEPLOYED_MODULES" />
              <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 mt-4">
                {findItem('projects')}
              </div>
            </section>
          </motion.div>

          {/* TECH + ROADMAP: Bloque inferior repartido */}
          <div className="flex-1 hidden min-h-[500px]:flex flex-col md:flex-row gap-6 md:gap-8 min-h-0">
            
            <motion.div layoutId="tech" layout className="flex-1 min-h-0">
              <section className="h-full border border-white/5 bg-carbono-surface/20 backdrop-blur-md p-6 lg:p-8 overflow-hidden flex flex-col shadow-xl">
                <SectionHeader title="// TECH_ENVIRONMENT" />
                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                  {findItem('tech')}
                </div>
              </section>
            </motion.div>

            <motion.div layoutId="roadmap" layout className="flex-1 min-h-0">
              <section className="h-full border border-white/5 bg-carbono-surface/20 backdrop-blur-md p-6 lg:p-8 overflow-hidden flex flex-col shadow-xl">
                <SectionHeader title="// STRATEGIC_ROADMAP" />
                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                  {findItem('roadmap')}
                </div>
              </section>
            </motion.div>

          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
