import React from 'react';

interface CheckboxProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  label: string;
}

export default function Checkbox({ checked, onChange, label }: CheckboxProps) {
  return (
    <button
      className="flex items-center gap-3 text-left w-full group hover:text-white transition-colors duration-100"
      onClick={() => onChange?.(!checked)}
    >
      <div
        className={`w-4 h-4 flex-shrink-0 border ${
          checked ? 'bg-cobalt border-cobalt' : 'bg-transparent border-white/40 group-hover:border-white/70'
        } flex items-center justify-center transition-colors duration-100`}
      >
        {checked && (
          <span className="text-white text-xs leading-none">✓</span>
        )}
      </div>
      <span className={`text-xs tracking-wide leading-relaxed ${checked ? 'line-through text-text-faint' : 'text-text-muted'}`}>
        {label}
      </span>
    </button>
  );
}
