import React from 'react';

interface BoxProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export default function Box({ children, className = '', as: Tag = 'div' }: BoxProps) {
  return (
    <Tag className={`bg-carbono-surface border border-white/20 p-6 ${className}`}>
      {children}
    </Tag>
  );
}
