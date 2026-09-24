import type { SVGProps } from 'react';

export type ContextApertureProps = Readonly<
  Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> & {
    size?: number;
    monochrome?: boolean;
    title?: string;
  }
>;

/**
 * Context Aperture
 *
 * The signature Hirearchy architectural mark.
 * An open structural frame with an oxide aperture threshold and datum baseline,
 * expressing progressive clarity: context entering an open field rather than
 * being enclosed or judged.
 */
export const ContextAperture = ({
  size = 20,
  monochrome = false,
  title,
  className = '',
  ...props
}: ContextApertureProps) => {
  const inkColor = monochrome ? 'currentColor' : 'var(--brand-ink)';
  const accentColor = monochrome ? 'currentColor' : 'var(--brand-accent)';
  const datumColor = monochrome ? 'currentColor' : 'var(--brand-line)';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`context-aperture ${className}`.trim()}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {/* Primary structural frame: Left spine, bottom baseline datum, partial right boundary */}
      <path
        d="M 3 3.5 V 16.5 H 16.5 V 9.5"
        stroke={inkColor}
        strokeWidth="1.75"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      {/* Signature Context Aperture: Open top threshold */}
      <path
        d="M 3 3.5 H 11"
        stroke={accentColor}
        strokeWidth="2.25"
        strokeLinecap="square"
      />
      {/* Internal structural alignment datum */}
      <line
        x1="3"
        y1="10"
        x2="9.5"
        y2="10"
        stroke={datumColor}
        strokeWidth="1.25"
      />
    </svg>
  );
};

export type BrandLogoVariant = 'primary' | 'wordmark' | 'compact' | 'software';
export type BrandLogoSize = 'sm' | 'md' | 'lg';

export type BrandLogoProps = Readonly<{
  variant?: BrandLogoVariant;
  size?: BrandLogoSize;
  monochrome?: boolean;
  className?: string;
}>;

/**
 * Hirearchy Brand Logo
 *
 * Controlled masterbrand primitives:
 * - primary: Context Aperture mark + Hirearchy wordmark
 * - wordmark: Typographically controlled wordmark alone
 * - compact: Standalone Context Aperture mark for compact/mobile contexts
 * - software: Masterbrand lockup with disciplined 'Software' product descriptor
 */
export const BrandLogo = ({
  variant = 'primary',
  size = 'md',
  monochrome = false,
  className = '',
}: BrandLogoProps) => {
  const apertureSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;

  if (variant === 'compact') {
    return (
      <span
        className={`brand-logo brand-logo--compact brand-logo--${size} ${className}`.trim()}
      >
        <ContextAperture
          size={apertureSize}
          monochrome={monochrome}
          title="Hirearchy"
        />
      </span>
    );
  }

  if (variant === 'wordmark') {
    return (
      <span
        className={`brand-logo brand-logo--wordmark brand-logo--${size} ${className}`.trim()}
      >
        <span className="brand-logo__wordmark">
          Hirearchy
          <span className="brand-logo__dot" aria-hidden="true">
            .
          </span>
        </span>
      </span>
    );
  }

  if (variant === 'software') {
    return (
      <span
        className={`brand-logo brand-logo--software brand-logo--${size} ${className}`.trim()}
      >
        <ContextAperture size={apertureSize} monochrome={monochrome} />
        <span className="brand-logo__text-group">
          <span className="brand-logo__wordmark">Hirearchy</span>
          <span className="brand-logo__descriptor">Software</span>
        </span>
      </span>
    );
  }

  // Default: 'primary' (Context Aperture + Wordmark)
  return (
    <span
      className={`brand-logo brand-logo--primary brand-logo--${size} ${className}`.trim()}
    >
      <ContextAperture size={apertureSize} monochrome={monochrome} />
      <span className="brand-logo__wordmark">
        Hirearchy
        <span className="brand-logo__dot" aria-hidden="true">
          .
        </span>
      </span>
    </span>
  );
};

export type DatumProps = Readonly<{
  orientation?: 'horizontal' | 'vertical';
  variant?: 'standard' | 'accent' | 'subtle';
  className?: string;
}>;

/**
 * Datum Primitive
 *
 * Restrained structural alignment rule or baseline.
 * Connects, anchors, or extends evidence relationships without decorative clutter.
 */
export const Datum = ({
  orientation = 'horizontal',
  variant = 'standard',
  className = '',
}: DatumProps) => (
  <span
    className={`brand-datum brand-datum--${orientation} brand-datum--${variant} ${className}`.trim()}
    aria-hidden="true"
  />
);
