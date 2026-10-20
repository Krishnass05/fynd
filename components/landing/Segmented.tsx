'use client';
// A two-option pill toggle with a sliding indicator. Radio-group pattern: arrow keys move the choice,
// only the chosen option is in the tab order. `tone="glass"` is for the dark hero, `tone="light"` for
// white sections. Used by the hero (Hire / Work) and How it works. OWNER: Krishna.
import { useRef } from 'react';

export interface SegOption<T extends string> { value: T; label: string }

export default function Segmented<T extends string>({ options, value, onChange, label, tone = 'light', className }: {
  options: [SegOption<T>, SegOption<T>];
  value: T;
  onChange: (v: T) => void;
  label: string;
  tone?: 'glass' | 'light';
  className?: string;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const pick = (i: number) => {
    onChange(options[i].value);
    refs.current[i]?.focus();
  };
  return (
    <div
      className={`seg2 seg2--${tone}${className ? ` ${className}` : ''}`}
      role="radiogroup"
      aria-label={label}
      style={{ '--seg-i': index } as React.CSSProperties}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); pick((index + 1) % 2); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); pick((index + 1) % 2); }
      }}
    >
      <span className="seg2-thumb" aria-hidden="true" />
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => { refs.current[i] = el; }}
          type="button"
          role="radio"
          aria-checked={i === index}
          tabIndex={i === index ? 0 : -1}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
