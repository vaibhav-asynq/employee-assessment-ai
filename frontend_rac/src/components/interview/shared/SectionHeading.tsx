import React from 'react';

interface SectionHeadingProps {
  title: string;
  children?: React.ReactNode;
  className?: string;
}

export function SectionHeading({ title, children, className = '' }: SectionHeadingProps) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <h3 className="text-xl font-semibold">{title}</h3>
      {children}
    </div>
  );
}
