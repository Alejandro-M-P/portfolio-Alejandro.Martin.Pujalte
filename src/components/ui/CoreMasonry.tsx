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
    <div className="flex flex-col mb-6 w-full island-load relative z-10">
      <div className="flex items-center justify-between pb-2">
        <span className="text-[13px] font-bold text-white tracking-widest uppercase">{title}</span>
      </div>
      <div className={`h-0.5 w-full ${color} shadow-[0_0_10px_rgba(0,85,255,0.3)]`} />
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4 min-h-full">
      
      {/* SIDEBAR: Identidad y Logs */}
      <div className="flex flex-col gap-4 min-h-0">
        <motion.div layoutId="identity" layout className="shrink-0">
          {findItem('identity')}
        </motion.div>
        
        <motion.div 
          layoutId="logs" 
          layout 
          className="flex-1 min-h-88 hidden lg:block border border-white/10 bg-carbono-surface overflow-hidden"
        >
          <div className="h-full p-4 flex flex-col">
            <SectionHeader title="// SYSTEM_LOGS" />
            <div className="flex-1 overflow-hidden">
              {findItem('logs')}
            </div>
          </div>
        </motion.div>
      </div>

      {/* MAIN: Grilla Industrial Unificada */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-x-4 gap-y-6 min-h-0 h-fit lg:h-full overflow-y-auto lg:overflow-visible">

        {/* SECCIÓN PROYECTOS */}
        <motion.div layoutId="projects" layout className="@container xl:col-span-3">
          <section className="border border-white/10 bg-carbono-surface p-6 md:p-10 overflow-hidden relative">
            <SectionHeader title="// PROJECTS" />
            <div className="mt-8">
              {findItem('projects')}
            </div>
          </section>
        </motion.div>

        {/* SECCIÓN TECH STACK */}
        <motion.div layoutId="tech" layout className="@container xl:col-span-1 flex flex-col">
          <section className="border border-white/10 bg-carbono-surface p-4 overflow-hidden flex-1 h-full">
            <SectionHeader title="// TECH_STACK_RECENT" />
            {findItem('tech')}
          </section>
        </motion.div>

        {/* SECCIÓN ROADMAP */}
        <motion.div layoutId="roadmap" layout className="@container xl:col-span-2 flex flex-col">
          <section className="border border-white/10 bg-carbono-surface p-4 overflow-hidden flex-1 h-full">
            <SectionHeader title="// ROADMAP" />
            {findItem('roadmap')}
          </section>
        </motion.div>
      </div>

    </div>
  );
}
