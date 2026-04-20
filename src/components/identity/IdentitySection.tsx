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
  links?: { label: string; href: string }[];
}

export default function IdentitySection({ name, handle, bio, quote, status: statusProp, availabilityValue = 99.9, links = [] }: IdentityProps) {
  const [imgError, setImgError] = React.useState(false);
  const [liveAvailability, setLiveAvailability] = React.useState(availabilityValue);
  const [liveStatus, setLiveStatus] = React.useState(statusProp);

  React.useEffect(() => {
    function applySettings() {
      try {
        const s = localStorage.getItem('portfolioSettings');
        if (!s) return;
        const parsed = JSON.parse(s);
        if (parsed.availabilityValue !== undefined) setLiveAvailability(parsed.availabilityValue);
        if (parsed.status) setLiveStatus(parsed.status);
      } catch {}
    }
    applySettings();
    window.addEventListener('storage', applySettings);
    window.addEventListener('portfolioSettingsChanged', applySettings);
    return () => {
      window.removeEventListener('storage', applySettings);
      window.removeEventListener('portfolioSettingsChanged', applySettings);
    };
  }, []);

  return (
    <section className="border border-white/10 bg-carbono-surface flex flex-col relative z-10">

      {/* Foto — ocupa todo el ancho, aspect portrait */}
      <div className="relative w-full overflow-hidden bg-carbono-mid" style={{ aspectRatio: '4/3' }}>
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
        {/* Gradient overlay bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-carbono-surface via-transparent to-transparent" />
        {/* Status badge sobre la foto */}
        <div className="absolute top-3 left-3">
          <Pill variant="cobalt" className="text-[10px]">{liveStatus}</Pill>
        </div>
      </div>

      {/* Info + bio */}
      <div className="p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-base font-bold tracking-tight text-white leading-snug whitespace-pre-line">
            {name}
          </h1>
          <span className="text-[10px] text-text-faint tracking-widest">{handle}</span>
        </div>

        <p className="text-xs text-text-muted leading-relaxed">{bio}</p>

        <blockquote className="text-xs text-text-faint border-l-2 border-cobalt pl-3 leading-relaxed">
          {quote}
        </blockquote>

        <AvailabilityBar value={liveAvailability} />

        <div className="flex flex-col gap-2">
          <ContactButton />
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
