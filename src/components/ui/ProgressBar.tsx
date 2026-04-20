import React from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  segments?: number; // default 10
  className?: string;
}

export default function ProgressBar({ value, segments = 10, className = '' }: ProgressBarProps) {
  const filled = Math.round((value / 100) * segments);

  return (
    <div className={`flex gap-0.5 ${className}`}>
      {Array.from({ length: segments }, (_, i) => (
        <div
          key={i}
          className={`w-3 h-4 ${i < filled ? 'bg-cobalt' : 'bg-carbono-high border border-white/20'}`}
        />
      ))}
    </div>
  );
}
