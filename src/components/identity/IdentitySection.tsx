import React, { useState, useEffect } from 'react';
import AvailabilityBar from './AvailabilityBar';
import ContactButton from './ContactButton';
import Pill from '../ui/Pill';

interface IdentityProps {
  name: string;
  handle: string;
  bio: string;
  quote: string;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY';
  availabilityValue?: number;
  cvUrl?: string;
  linkedinUrl?: string;
  links?: { label: string; href: string }[];
}

export default function IdentitySection({ name, handle, bio, quote, status, availabilityValue, cvUrl, linkedinUrl, links = [] }: IdentityProps) {
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
      if (action === 'tree-radar' || action === 'deep-scan') {
        setIsGlowing(true);
        setTimeout(() => setIsGlowing(false), 1500);
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
      <div className="flex flex-col @container">
        {/* Header con foto y nombre - Forzamos vertical en la sidebar (<450px) */}
        <div className="relative w-full bg-carbono-mid @[450px]:flex @[450px]:h-32 border-b border-white/5">
          <div className="relative w-full h-72 @[450px]:w-32 @[450px]:h-full shrink-0">
            {!imgError ? (
              <img
                src="/profile.jpg"
                alt={name}
                className="w-full h-full object-cover object-center"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[13px] text-text-faint tracking-widest">NO_SIGNAL</div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-carbono-surface/80 via-transparent to-transparent @[450px]:hidden" />
          </div>
          
          {/* Nombre y status - Aparecen sobre la foto en vertical, al lado en horizontal */}
          <div className="absolute bottom-4 left-5 @[450px]:static @[450px]:p-5 @[450px]:flex-1 @[450px]:flex @[450px]:flex-col @[450px]:justify-center">
            <Pill variant="cobalt" className="text-[10px] mb-2 w-fit shadow-lg shadow-cobalt/20">{status}</Pill>
            <div className="flex flex-col gap-0.5">
              <h1 className="text-xl @[450px]:text-lg font-bold tracking-tight text-white leading-tight drop-shadow-md">
                {name.replace('\n', ' ')}
              </h1>
              <span className="text-[11px] text-white/50 @[450px]:text-text-faint tracking-widest uppercase drop-shadow-sm">
                {handle}
              </span>
            </div>
          </div>
        </div>

        {/* Bio y Acciones */}
        <div className="p-5 flex flex-col gap-5">
          <p className="text-[14px] text-text-muted leading-relaxed font-medium">{bio}</p>

          <div className="space-y-4">
            <AvailabilityBar value={availabilityValue} />
            
            <div className="flex flex-col gap-2.5">
              <ContactButton />

              {cvUrl && (
                <button
                  onClick={() => forceDownload(cvUrl, 'Alejandro-CV.pdf')}
                  className="block w-full bg-cobalt text-white text-center text-[11px] font-bold tracking-widest uppercase px-4 py-3 hover:bg-cobalt/80 transition-all duration-150 active:scale-[0.98] shadow-lg shadow-cobalt/20 cursor-pointer"
                >
                  ↓ DOWNLOAD_CV
                </button>
              )}

              {linkedinUrl && (
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full border border-white/40 text-white text-center text-[11px] font-bold tracking-widest uppercase px-4 py-3 hover:bg-white hover:text-black transition-all duration-150 active:scale-[0.98]"
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
                  className="block w-full border border-white/20 text-white/70 text-center text-[11px] font-bold tracking-widest uppercase px-4 py-3 hover:bg-white hover:text-black transition-all duration-150 active:scale-[0.98]"
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
