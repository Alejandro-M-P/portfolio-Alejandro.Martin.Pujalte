import React from 'react';
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

export default function IdentitySection({ name, handle, bio, quote, status, availabilityValue = 99.9, cvUrl, linkedinUrl, links = [] }: IdentityProps) {
  const [imgError, setImgError] = React.useState(false);

  return (
    <section className="border border-white/10 bg-carbono-surface flex flex-col relative z-10">

      <div className="relative w-full overflow-hidden bg-carbono-mid" style={{ aspectRatio: '4/3', maxHeight: 'clamp(140px, 22vh, 220px)' }}>
        {!imgError ? (
          <img
            src="/profile.jpg"
            alt={name}
            className="w-full h-full object-cover object-center"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-text-faint tracking-widest">NO_SIGNAL</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-carbono-surface via-transparent to-transparent" />
        <div className="absolute top-3 left-3">
          <Pill variant="cobalt" className="text-[10px]">{status}</Pill>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-base font-bold tracking-tight text-white leading-snug whitespace-pre-line">{name}</h1>
          <span className="text-[10px] text-text-faint tracking-widest">{handle}</span>
        </div>

        <p className="text-xs text-text-muted leading-relaxed">{bio}</p>

        <blockquote className="text-xs text-text-faint border-l-2 border-cobalt pl-3 leading-relaxed">{quote}</blockquote>

        <AvailabilityBar value={availabilityValue} />

        <div className="flex flex-col gap-2">
          <ContactButton />

          {cvUrl && (
            <a
              href={cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full border border-cobalt/40 text-cobalt text-center text-xs font-bold tracking-widest uppercase px-4 py-2.5 hover:bg-cobalt hover:text-white transition-colors duration-100"
            >
              ↓ VIEW CV
            </a>
          )}

          {linkedinUrl && (
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full border border-white/15 text-white/50 text-center text-xs font-bold tracking-widest uppercase px-4 py-2.5 hover:border-cobalt hover:text-cobalt transition-colors duration-100"
            >
              LINKEDIN →
            </a>
          )}

          {links.map(link => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full border border-white/15 text-white/50 text-center text-xs font-bold tracking-widest uppercase px-4 py-2.5 hover:border-cobalt hover:text-cobalt transition-colors duration-100"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
