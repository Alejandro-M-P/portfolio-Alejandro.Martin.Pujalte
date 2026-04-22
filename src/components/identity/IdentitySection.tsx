import React, { useState, useEffect } from 'react';
import AvailabilityBar from './AvailabilityBar';
import ContactButton from './ContactButton';
import Pill from '../ui/Pill';

interface IdentityProps {
  name: string;
  handle: string;
  bio: string;
  quote?: string;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY';
  availabilityValue?: number;
  cvUrl?: string;
  linkedinUrl?: string;
  contactEmail?: string;
  birthDate?: string;
  links?: { label: string; href: string }[];
}

function calculateAge(birthDate: string): number | null {
  try {
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  } catch {
    return null;
  }
}

export default function IdentitySection({ name, handle, bio, quote, status, availabilityValue, cvUrl, linkedinUrl, contactEmail, birthDate, links = [] }: IdentityProps) {
  const [imgError, setImgError] = React.useState(false);
  const [isGlowing, setIsGlowing] = useState(false);

  useEffect(() => {
    const onConsoleAction = (e: any) => {
      const { action, path, file } = e.detail;
      if (action === 'cd-nav' && path.includes('about')) {
        setIsGlowing(true);
        setTimeout(() => setIsGlowing(false), 2000);
      }
      if (action === 'cat-read' && (file === 'identity.json' || file === 'skills.md')) {
        setIsGlowing(true);
        setTimeout(() => setIsGlowing(false), 1500);
      }
      if (action === 'tree-radar' || action === 'deep-scan' || action === 'whoami') {
        setIsGlowing(true);
        setTimeout(() => setIsGlowing(false), 2000);
      }
    };

    window.addEventListener('portfolioConsoleAction', onConsoleAction);
    return () => window.removeEventListener('portfolioConsoleAction', onConsoleAction);
  }, []);

  const forceDownload = (url: string, filename: string) => {
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
      })
      .catch(err => {
        console.error("Download failed", err);
        window.open(url, '_blank');
      });
  };

  return (
    <section 
      data-section="identity" 
      className={`flex flex-col relative z-10 island-load transition-all duration-500 ${isGlowing ? 'ring-1 ring-cobalt/40 shadow-[0_0_20px_rgba(0,85,255,0.2)]' : ''}`}
    >
      <div className="flex flex-col h-full bg-transparent">
        
        {/* CABEZAL: FOTO CENTRADA CON TEXTO SUPERPUESTO RESALTADO (ADAPTABLE) */}
        <div className="relative w-full h-48 sm:h-64 lg:h-80 overflow-hidden transition-all duration-700 ease-in-out border-b border-white/10 bg-carbono-mid">
          {!imgError ? (
            <img
              src="/profile.jpg"
              alt={name}
              className="w-full h-full object-cover object-center transition-transform duration-1000 hover:scale-110"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[11px] text-text-faint tracking-widest uppercase">NO_SIGNAL</div>
          )}
          
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent pointer-events-none" />
          
          <div className="absolute bottom-0 left-0 w-full p-6 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <Pill variant="cobalt" className="text-[9px] font-black shadow-[0_0_15px_rgba(0,85,255,0.4)] bg-cobalt text-white">{status}</Pill>
            </div>
            
            <h1 className="text-[26px] sm:text-[32px] font-black tracking-tighter text-white leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              {name.replace('\n', ' ')}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[12px] text-cobalt tracking-[0.3em] uppercase font-black">
                {handle}
              </span>
              {birthDate && calculateAge(birthDate) !== null && (
                <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-1.5 py-0.5 rounded-sm">
                   <span className="text-[10px] font-black text-white tracking-widest">{calculateAge(birthDate)}y</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BIO Y ACCIONES COMPACTAS */}
        <div className="p-6 flex flex-col gap-5">
          <p className="text-[13px] text-text-muted leading-relaxed font-medium italic opacity-80 pl-3 border-l border-cobalt/30">
            {bio}
          </p>

          <div className="space-y-4">
            <AvailabilityBar value={availabilityValue} />
            
            <div className="flex flex-col gap-2">
              <ContactButton href={contactEmail ? `mailto:${contactEmail}` : undefined} />

              {cvUrl && (
                <button
                  onClick={() => forceDownload(cvUrl, 'Alejandro-CV.pdf')}
                  className="w-full bg-cobalt text-white text-[10px] font-black tracking-[0.2em] uppercase px-4 py-3 hover:bg-blue-500 transition-all duration-150 active:scale-[0.98] shadow-lg border border-white/10"
                >
                  ↓ DOWNLOAD CV (EN)
                </button>
              )}

              {linkedinUrl && (
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-white/5 border border-white/10 text-white/70 text-center text-[10px] font-black tracking-[0.2em] uppercase px-4 py-3 hover:bg-[#0077B5] hover:text-white transition-all duration-150 active:scale-[0.98]"
                >
                  LINKEDIN
                </a>
              )}

              {links.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full border border-white/10 bg-white/[0.02] text-white/40 text-center text-[10px] font-black tracking-[0.2em] uppercase px-4 py-3 hover:bg-white/10 hover:text-white transition-all duration-150 active:scale-[0.98]"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
