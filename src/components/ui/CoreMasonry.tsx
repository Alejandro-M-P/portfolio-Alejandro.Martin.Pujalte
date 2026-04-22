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
    <div className="flex flex-col mb-4 md:mb-6 w-full island-load relative z-10">
      <div className="flex items-center justify-between pb-2">
        <span className="text-[11px] md:text-[13px] font-black text-white tracking-[0.2em] uppercase opacity-80">{title}</span>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 bg-white/10" />
          <div className="w-1.5 h-1.5 bg-white/10" />
        </div>
      </div>
      <div className={`h-0.5 w-full ${color} shadow-[0_0_15px_rgba(0,85,255,0.4)] opacity-70`} />
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 md:px-8 py-6 md:py-10 lg:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] xl:grid-cols-[380px_1fr] gap-6 md:gap-8 min-h-full items-start">
        
        {/* SIDEBAR: Identidad y Logs (Desktop Only) */}
        <div className="flex flex-col gap-6 md:gap-8 lg:sticky lg:top-10 h-fit">
          <motion.div layoutId="identity" layout className="shrink-0">
            {findItem('identity')}
          </motion.div>
          
          <motion.div 
            layoutId="logs" 
            layout 
            className="flex-1 min-h-[500px] hidden lg:block border border-white/5 bg-carbono-surface/50 backdrop-blur-sm overflow-hidden"
          >
            <div className="h-full p-5 flex flex-col">
              <SectionHeader title="// SYSTEM_LOGS" />
              <div className="flex-1 overflow-hidden">
                {findItem('logs')}
              </div>
            </div>
          </motion.div>
        </div>

        {/* MAIN: Grilla Industrial Unificada */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 h-fit">

          {/* SECCIÓN PROYECTOS */}
          <motion.div layoutId="projects" layout className="@container md:col-span-2">
            <section className="border border-white/5 bg-carbono-surface/50 backdrop-blur-sm p-5 md:p-8 lg:p-10 overflow-hidden relative shadow-2xl shadow-black/40">
              <SectionHeader title="// DEPLOYED_MODULES" />
              <div className="mt-4">
                {findItem('projects')}
              </div>
            </section>
          </motion.div>

          {/* SECCIÓN TECH STACK */}
          <motion.div layoutId="tech" layout className="@container flex flex-col">
            <section className="flex-1 border border-white/5 bg-carbono-surface/50 backdrop-blur-sm p-5 md:p-6 lg:p-8 overflow-hidden shadow-xl shadow-black/20">
              <SectionHeader title="// TECH_STACK_CORE" />
              <div className="mt-2">
                {findItem('tech')}
              </div>
            </section>
          </motion.div>

          {/* SECCIÓN ROADMAP */}
          <motion.div layoutId="roadmap" layout className="@container flex flex-col">
            <section className="flex-1 border border-white/5 bg-carbono-surface/50 backdrop-blur-sm p-5 md:p-6 lg:p-8 overflow-hidden shadow-xl shadow-black/20">
              <SectionHeader title="// STRATEGIC_ROADMAP" />
              <div className="mt-2">
                {findItem('roadmap')}
              </div>
            </section>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
