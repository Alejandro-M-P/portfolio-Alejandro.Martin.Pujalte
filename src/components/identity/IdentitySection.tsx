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
      className={`industrial-panel flex flex-col relative z-10 island-load overflow-hidden shadow-2xl transition-all duration-500 ${isGlowing ? 'ring-2 ring-cobalt shadow-[0_0_25px_rgba(0,85,255,0.4)]' : ''}`}
    >
      <div className="flex flex-col @container h-full">
        {/* Header Adaptativo: Más grande y vertical en 2K, horizontal compacto en 1080p */}
        <div className="relative w-full bg-carbono-mid flex flex-row min-h-[450px]:lg:flex-col min-h-[450px]:lg:h-auto h-24 sm:h-28 border-b border-white/5 transition-all duration-500 ease-in-out">
          <div className="relative w-24 sm:w-28 min-h-[450px]:lg:w-full min-h-[450px]:lg:h-[320px] h-full shrink-0 overflow-hidden">
            {!imgError ? (
              <img
                src="/profile.jpg"
                alt={name}
                className="w-full h-full object-cover object-top lg:object-center transition-transform duration-700 hover:scale-105"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[13px] text-text-faint tracking-widest uppercase">NO_SIGNAL</div>
            )}
            {/* Gradiente solo visible en modo vertical (pantallas grandes) */}
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent hidden min-h-[450px]:lg:block" />
          </div>
          
          {/* Nombre y status: Posicionamiento dinámico */}
          <div className="p-3 sm:p-4 flex-1 flex flex-col justify-center min-h-[450px]:lg:absolute min-h-[450px]:lg:bottom-0 min-h-[450px]:lg:left-0 min-h-[450px]:lg:w-full min-h-[450px]:lg:p-6 lg:bg-linear-to-t lg:from-black/90 lg:to-transparent">
            <Pill variant="cobalt" className="text-[9px] sm:text-[10px] mb-1 sm:mb-2 w-fit shadow-lg shadow-cobalt/20">{status}</Pill>
            <div className="flex flex-col gap-0.5">
              <h1 className="text-[13px] sm:text-[14px] min-h-[450px]:lg:text-[20px] font-bold tracking-tight text-white leading-tight drop-shadow-xl">
                {name.replace('\n', ' ')}
                {birthDate && calculateAge(birthDate) !== null && (
                  <span className="text-[11px] sm:text-[12px] font-normal text-white/60 ml-2 opacity-80">({calculateAge(birthDate)})</span>
                )}
              </h1>
              <span className="text-[9px] sm:text-[10px] min-h-[450px]:lg:text-[11px] text-white/40 tracking-[0.2em] uppercase drop-shadow-sm font-black">
                {handle}
              </span>
            </div>
          </div>
        </div>

        {/* Bio y Acciones */}
        <div className="p-4 flex flex-col gap-4">
          <p className="text-[13px] text-text-muted leading-relaxed font-medium">{bio}</p>

          <div className="space-y-3">
            <AvailabilityBar value={availabilityValue} />
            
            <div className="flex flex-col gap-2">
              <ContactButton href={contactEmail ? `mailto:${contactEmail}` : undefined} />

              {cvUrl && (
                <>
                  <button
                    onClick={() => forceDownload(cvUrl, 'Alejandro-CV.pdf')}
                    className="block w-full bg-cobalt text-white text-center text-[11px] font-bold tracking-widest uppercase px-4 py-2.5 hover:bg-cobalt/80 transition-all duration-150 active:scale-[0.98] shadow-lg shadow-cobalt/20 cursor-pointer"
                  >
                    ↓ DOWNLOAD_CV
                  </button>
                  <p className="text-[10px] text-text-faint tracking-widest text-center opacity-50">
                    // work history & experience → CV
                  </p>
                </>
              )}

              {linkedinUrl && (
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full border border-white/40 text-white text-center text-[11px] font-bold tracking-widest uppercase px-4 py-2.5 hover:bg-white hover:text-black transition-all duration-150 active:scale-[0.98]"
                >
                  LINKEDIN // CONNECT →
                </a>
              )}

              {links.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full border border-white/20 text-white/70 text-center text-[11px] font-bold tracking-widest uppercase px-4 py-2.5 hover:bg-white hover:text-black transition-all duration-150 active:scale-[0.98]"
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
