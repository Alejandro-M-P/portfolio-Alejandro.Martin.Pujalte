import React from 'react';
import ProgressBar from '../ui/ProgressBar';

interface AvailabilityBarProps {
  value?: number;
}

export default function AvailabilityBar({ value = 99.9 }: AvailabilityBarProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-text-faint tracking-widest uppercase">System_Ready</span>
        <span className="text-xs text-cobalt tracking-widest font-bold">{value}%</span>
      </div>
      <ProgressBar value={value} segments={10} className="w-full" />
    </div>
  );
}
