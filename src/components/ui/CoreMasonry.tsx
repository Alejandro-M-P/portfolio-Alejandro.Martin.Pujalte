import React from 'react';
import { motion } from 'framer-motion';

interface MasonryItem {
  id: string;
  component: React.ReactNode;
}

interface CoreMasonryProps {
  items: MasonryItem[];
}

export default function CoreMasonry({ items }: CoreMasonryProps) {
  const findItem = (id: string) => items.find(i => i.id === id)?.component;

  const SectionHeader = ({ title, color = 'bg-cobalt' }: { title: string; color?: string }) => (
    <div className="flex flex-col mb-4 md:mb-5 w-full island-load relative z-10 shrink-0">
      <div className="flex items-center justify-between pb-2">
        <span className="text-[11px] md:text-[13px] font-black text-white tracking-[0.2em] uppercase opacity-80">{title}</span>
        <div className="flex gap-1 pr-1">
          <div className="w-1.5 h-1.5 bg-white/10" />
          <div className="w-1.5 h-1.5 bg-white/10" />
        </div>
      </div>
      <div className={`h-0.5 w-full ${color} shadow-[0_0_15px_rgba(0,85,255,0.4)] opacity-70`} />
    </div>
  );

  return (
    <div className="w-full lg:h-screen lg:max-h-screen flex flex-col items-center bg-black overflow-x-hidden overflow-y-auto lg:overflow-hidden font-sans">
      <div className="max-w-[1800px] w-full h-full p-4 md:p-6 lg:p-8 xl:p-10 flex flex-col lg:flex-row gap-6 md:gap-8">
        
        {/* SIDEBAR: Identidad + Logs (Dinámico por altura) */}
        <div className="flex flex-col gap-6 w-full lg:w-[380px] h-full shrink-0">
          
          {/* Identidad: Se adapta al espacio vertical */}
          <motion.div 
            layoutId="identity" 
            layout 
            className="shrink-0 lg:max-h-[85vh] overflow-hidden"
          >
            {findItem('identity')}
          </motion.div>
          
          {/* Logs: Solo en pantallas con suficiente altura */}
          <motion.div 
            layoutId="logs" 
            layout 
            className="flex-1 hidden min-h-[450px]:lg:flex flex-col border border-white/5 bg-carbono-surface/30 backdrop-blur-md overflow-hidden"
          >
            <div className="flex-1 p-5 flex flex-col h-full overflow-hidden">
              <SectionHeader title="// SYSTEM_LOGS" />
              <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 text-[12px]">
                {findItem('logs')}
              </div>
            </div>
          </motion.div>
        </div>

        {/* MAIN CONTENT: Grilla Masonry Adaptativa */}
        <div className="flex-1 flex flex-col gap-6 md:gap-8 h-full min-w-0">
          
          {/* PROJECTS: Bloque principal dinámico */}
          <motion.div layoutId="projects" layout className="flex-[1.5] min-h-0">
            <section className="h-full border border-white/5 bg-carbono-surface/30 backdrop-blur-md p-6 md:p-8 overflow-hidden relative shadow-2xl shadow-black/40 flex flex-col">
              <SectionHeader title="// DEPLOYED_MODULES" />
              <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                {findItem('projects')}
              </div>
            </section>
          </motion.div>

          {/* BOTTOM ROW: Tech + Roadmap (Dinámico) */}
          <div className="flex-1 hidden min-h-[600px]:flex flex-col md:flex-row gap-6 md:gap-8 min-h-0">
            
            <motion.div layoutId="tech" layout className="flex-1 min-h-0">
              <section className="h-full border border-white/5 bg-carbono-surface/30 backdrop-blur-md p-5 md:p-6 overflow-hidden flex flex-col shadow-xl shadow-black/20">
                <SectionHeader title="// TECH_STACK_CORE" />
                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                  {findItem('tech')}
                </div>
              </section>
            </motion.div>

            <motion.div layoutId="roadmap" layout className="flex-1 min-h-0">
              <section className="h-full border border-white/5 bg-carbono-surface/30 backdrop-blur-md p-5 md:p-6 overflow-hidden flex flex-col shadow-xl shadow-black/20">
                <SectionHeader title="// STRATEGIC_ROADMAP" />
                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                  {findItem('roadmap')}
                </div>
              </section>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
