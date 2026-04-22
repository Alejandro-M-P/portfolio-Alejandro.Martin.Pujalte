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
        {/* Header Adaptativo: Horizontal en pantallas bajas, Vertical en pantallas altas */}
        <div className="relative w-full bg-carbono-mid flex flex-row min-[1200px]:min-h-[450px]:flex-col min-[1200px]:min-h-[450px]:h-auto h-28 border-b border-white/5 transition-all duration-500">
          <div className="relative w-28 min-[1200px]:min-h-[450px]:w-full min-[1200px]:min-h-[450px]:h-64 h-full shrink-0 overflow-hidden">
            {!imgError ? (
              <img
                src="/profile.jpg"
                alt={name}
                className="w-full h-full object-cover object-center"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[13px] text-text-faint tracking-widest uppercase">NO_SIGNAL</div>
            )}
            {/* Gradiente solo visible en modo vertical */}
            <div className="absolute inset-0 bg-linear-to-t from-carbono-surface/90 via-transparent to-transparent hidden min-[1200px]:min-h-[450px]:block" />
          </div>
          
          {/* Nombre y status */}
          <div className="p-4 flex-1 flex flex-col justify-center min-[1200px]:min-h-[450px]:absolute min-[1200px]:min-h-[450px]:bottom-0 min-[1200px]:min-h-[450px]:left-0 min-[1200px]:min-h-[450px]:w-full min-[1200px]:min-h-[450px]:p-5 min-[1200px]:min-h-[450px]:bg-linear-to-t min-[1200px]:min-h-[450px]:from-black/80 min-[1200px]:min-h-[450px]:to-transparent">
            <Pill variant="cobalt" className="text-[10px] mb-1.5 w-fit shadow-lg shadow-cobalt/20">{status}</Pill>
            <div className="flex flex-col gap-0.5">
              <h1 className="text-[14px] min-[1200px]:min-h-[450px]:text-[18px] font-bold tracking-tight text-white leading-tight drop-shadow-md">
                {name.replace('\n', ' ')}
                {birthDate && calculateAge(birthDate) !== null && (
                  <span className="text-[12px] font-normal text-white/70 ml-2 opacity-80">({calculateAge(birthDate)})</span>
                )}
              </h1>
              <span className="text-[10px] min-[1200px]:min-h-[450px]:text-[11px] text-text-faint tracking-[0.15em] uppercase drop-shadow-sm">
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
