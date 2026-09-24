import type { ReactNode } from 'react';

type AdaptiveFrameProps = Readonly<{
  className?: string;
  children: ReactNode;
  label: string;
}>;

export const AdaptiveFrame = ({
  className = '',
  children,
  label,
}: AdaptiveFrameProps) => (
  <div className={`adaptive-frame ${className}`.trim()} aria-label={label}>
    {children}
  </div>
);

export const Arrow = () => <span aria-hidden="true">↗</span>;

export * from './brand-identity';
