// src/components/interview/shared/SectionHeading.tsx
interface SectionHeadingProps {
  title: string;
  children?: React.ReactNode;
  className?: string;
}

export function SectionHeading({ title, children, className = '' }: SectionHeadingProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <h3 className={className}>{title}</h3>
      {children}
    </div>
  );
}