import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: React.ReactNode;
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-cobalt text-white hover:bg-cobalt-dark',
  secondary: 'border border-white/40 text-white hover:border-cobalt hover:text-cobalt',
  ghost: 'text-text-muted hover:text-white',
};

export default function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-none uppercase tracking-widest text-sm font-bold transition-colors duration-100 py-3 px-6 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
