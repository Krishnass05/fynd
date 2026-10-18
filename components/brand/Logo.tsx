// The Crewmate logo: an orange "C" with a dot. OWNER: Krishna. The same drawing is app/icon.svg (the favicon).
// Decorative next to the word "Crewmate"; give it a title only when it stands alone.
export const LOGO_ORANGE = '#F37021';

export function LogoMark({ size = 28, title }: { size?: number; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title} focusable="false" style={{ display: 'block', flex: 'none' }}>
      {title ? <title>{title}</title> : null}
      <path d="M 63.9 33.3 A 26 26 0 1 0 63.9 66.7" fill="none" stroke={LOGO_ORANGE} strokeWidth="17" strokeLinecap="round" />
      <circle cx="78" cy="50" r="10" fill={LOGO_ORANGE} />
    </svg>
  );
}
