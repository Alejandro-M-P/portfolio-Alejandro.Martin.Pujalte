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
  
  // PROTECCIÓN SSR: Evita que pretext intente usar el canvas en el servidor
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // CÁLCULO DE PROPORCIONES REACTIVAS
  const sidebarWeight = useMemo(() => {
    if (!mounted || !identityData?.bio) return 1.5;
    
    try {
      const preparedBio = prepare(identityData.bio, "14px Inter");
      const bioSize = layout(preparedBio, 350, 20);
      
      // En 2K/4K queremos que la identidad pese más (foto grande) 
      // y la terminal pese menos
      const baseWeight = bioSize.height > 100 ? 1.8 : 1.6;
      return baseWeight;
    } catch (e) {
      return 1.5;
    }
  }, [mounted, identityData?.bio]);

  const SectionHeader = ({ title, color = 'bg-cobalt' }: { title: string; color?: string }) => (
    <div className="flex flex-col mb-4 md:mb-5 w-full island-load relative z-10 shrink-0">
      <div className="flex items-center justify-between pb-2">
        <span className="text-[10px] md:text-[12px] font-black text-white tracking-[0.25em] uppercase opacity-60">{title}</span>
        <div className="flex gap-1 pr-1">
          <div className="w-1.5 h-1.5 bg-white/5" />
          <div className="w-1.5 h-1.5 bg-white/5" />
        </div>
      </div>
      <div className={`h-0.5 w-full ${color} shadow-[0_0_20px_rgba(0,85,255,0.4)] opacity-50`} />
    </div>
  );

  return (
    <div className="w-full h-screen max-h-screen flex flex-col items-center bg-black overflow-hidden font-sans select-none">
      <div className="max-w-[2000px] w-full h-full p-4 md:p-6 lg:p-10 flex flex-col lg:flex-row gap-6 md:gap-8 min-h-0">
        
        {/* COLUMNA 1: SIDEBAR (IDENTIDAD + LOGS) */}
        <div 
          className="flex flex-col gap-6 w-full lg:w-[clamp(380px,28vw,520px)] h-full shrink-0 min-h-0"
          style={{ flexGrow: sidebarWeight }}
        >
          {/* IDENTIDAD: flex-[2.5] para que en 2K sea GIGANTE */}
          <motion.div 
            layoutId="identity" 
            layout 
            className="flex-[2.5] min-h-0 border border-white/5 bg-carbono-surface/20 backdrop-blur-md overflow-hidden shadow-2xl"
          >
             <div className="h-full overflow-y-auto custom-scrollbar">
                {findItem('identity')}
             </div>
          </motion.div>
          
          {/* LOGS: Ahora más pequeña en pantallas grandes con max-h */}
          <motion.div 
            layoutId="logs" 
            layout 
            className="flex-1 hidden lg:flex flex-col max-h-[350px] border border-white/5 bg-carbono-surface/20 backdrop-blur-md overflow-hidden"
          >
            <div className="flex-1 p-5 flex flex-col h-full overflow-hidden">
              <SectionHeader title="// SYSTEM_OUTPUT_MINIMIZED" />
              <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 text-[10px] opacity-70">
                {findItem('logs')}
              </div>
            </div>
          </motion.div>
        </div>

        {/* COLUMNA 2: CUERPO PRINCIPAL */}
        <div className="flex-[3.5] flex flex-col gap-6 md:gap-8 h-full min-w-0">
          
          {/* PROJECTS: Estiramiento máximo */}
          <motion.div layoutId="projects" layout className="flex-[2.2] min-h-0">
            <section className="h-full border border-white/5 bg-carbono-surface/20 backdrop-blur-md p-6 md:p-10 overflow-hidden relative shadow-2xl shadow-black/60 flex flex-col">
              <SectionHeader title="// MODULE_DEPLOYMENTS" />
              <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 mt-4">
                {findItem('projects')}
              </div>
            </section>
          </motion.div>

          {/* FILA INFERIOR: Tech + Roadmap */}
          <div className="flex-1 hidden min-h-[500px]:flex flex-col md:flex-row gap-6 md:gap-8 min-h-0">
            
            <motion.div layoutId="tech" layout className="flex-1 min-h-0">
              <section className="h-full border border-white/5 bg-carbono-surface/20 backdrop-blur-md p-6 overflow-hidden flex flex-col shadow-xl shadow-black/30">
                <SectionHeader title="// ENVIRONMENT_TECH" />
                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                  {findItem('tech')}
                </div>
              </section>
            </motion.div>

            <motion.div layoutId="roadmap" layout className="flex-1 min-h-0">
              <section className="h-full border border-white/5 bg-carbono-surface/20 backdrop-blur-md p-6 overflow-hidden flex flex-col shadow-xl shadow-black/30">
                <SectionHeader title="// FUTURE_ROADMAP" />
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
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.01); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.08); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 85, 255, 0.3); }
      `}</style>
    </div>
  );
}
