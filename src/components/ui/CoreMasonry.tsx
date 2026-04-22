import React, { useMemo } from 'react';
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

  // USO DE PRETEXT: Calculamos el "peso" del contenido para distribuir el espacio vertical
  const sidebarWeight = useMemo(() => {
    if (!identityData?.bio) return 1.5;
    
    // Medimos la bío para saber cuánto espacio real necesita
    const preparedBio = prepare(identityData.bio, "14px Inter");
    const bioSize = layout(preparedBio, 350, 20); // Ancho sidebar aprox, lineHeight 20
    
    // Si la bío es muy larga, damos más peso al sidebar para evitar el corte en 1080p
    // En 2K (h > 1200), le damos peso extra para que la foto sea "grande"
    const baseWeight = bioSize.height > 100 ? 1.8 : 1.5;
    return baseWeight;
  }, [identityData?.bio]);

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
      {/* EL MASONRY REAL: Dos columnas que se reparten el Viewport horizontal y verticalmente */}
      <div className="max-w-[1920px] w-full h-full p-4 md:p-6 lg:p-10 flex flex-col lg:flex-row gap-6 md:gap-8 min-h-0">
        
        {/* COLUMNA 1: SIDEBAR (IDENTIDAD + LOGS) */}
        <div 
          className="flex flex-col gap-6 w-full lg:w-[clamp(350px,25vw,500px)] h-full shrink-0 min-h-0"
          style={{ flexGrow: sidebarWeight }}
        >
          {/* Identidad: flex-[2] para que en 2K la foto sea ENORME */}
          <motion.div 
            layoutId="identity" 
            layout 
            className="flex-[2] min-h-0 border border-white/5 bg-carbono-surface/20 backdrop-blur-md overflow-hidden shadow-2xl"
          >
             <div className="h-full overflow-y-auto custom-scrollbar">
                {findItem('identity')}
             </div>
          </motion.div>
          
          {/* Logs: Solo escritorio, se estira lo que queda */}
          <motion.div 
            layoutId="logs" 
            layout 
            className="flex-1 hidden min-h-[400px]:lg:flex flex-col border border-white/5 bg-carbono-surface/20 backdrop-blur-md overflow-hidden"
          >
            <div className="flex-1 p-5 flex flex-col h-full overflow-hidden">
              <SectionHeader title="// CORE_PROCESS_OUTPUT" />
              <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 text-[11px]">
                {findItem('logs')}
              </div>
            </div>
          </motion.div>
        </div>

        {/* COLUMNA 2: EL CUERPO (PROYECTOS + TECH + ROADMAP) */}
        <div className="flex-[3] flex flex-col gap-6 md:gap-8 h-full min-w-0">
          
          {/* PROJECTS: Bloque dinámico de mayor importancia */}
          <motion.div layoutId="projects" layout className="flex-[2] min-h-0">
            <section className="h-full border border-white/5 bg-carbono-surface/20 backdrop-blur-md p-6 md:p-10 overflow-hidden relative shadow-2xl shadow-black/60 flex flex-col">
              <SectionHeader title="// DEPLOYED_MODULES_ACTIVE" />
              <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 mt-4">
                {findItem('projects')}
              </div>
            </section>
          </motion.div>

          {/* FILA INFERIOR: Se reparte el 50% del alto restante */}
          <div className="flex-1 hidden min-h-[550px]:flex flex-col md:flex-row gap-6 md:gap-8 min-h-0">
            
            <motion.div layoutId="tech" layout className="flex-1 min-h-0">
              <section className="h-full border border-white/5 bg-carbono-surface/20 backdrop-blur-md p-6 lg:p-8 overflow-hidden flex flex-col shadow-xl shadow-black/30">
                <SectionHeader title="// TECH_ENVIRONMENT" />
                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                  {findItem('tech')}
                </div>
              </section>
            </motion.div>

            <motion.div layoutId="roadmap" layout className="flex-1 min-h-0">
              <section className="h-full border border-white/5 bg-carbono-surface/20 backdrop-blur-md p-6 lg:p-8 overflow-hidden flex flex-col shadow-xl shadow-black/30">
                <SectionHeader title="// FUTURE_INTEGRATIONS" />
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
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 85, 255, 0.4); }
      `}</style>
    </div>
  );
}
