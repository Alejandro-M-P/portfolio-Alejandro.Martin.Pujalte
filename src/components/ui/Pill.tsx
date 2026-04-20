import React from 'react';

interface PillProps {
  children: React.ReactNode;
  variant?: 'default' | 'cobalt' | 'outline';
  className?: string;
}

const variantClasses: Record<NonNullable<PillProps['variant']>, string> = {
  default: 'bg-carbono-high text-white',
  cobalt: 'bg-cobalt text-white',
  outline: 'border border-white/40 text-white/70',
};

export default function Pill({ children, variant = 'default', className = '' }: PillProps) {
  return (
    <span
      className={`text-xs uppercase tracking-widest px-2 py-0.5 ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
