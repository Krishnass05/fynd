'use client';
// Small pieces for the sign-up and log-in pages: a text field with its error message, a password field with show/hide,
// the strength meter, and the Google button. OWNER: Krishna.
import { useId, useState } from 'react';
import { passwordStrength } from '@/lib/engine/validate';

export function TextField({ label, error, hint, ...input }: { label: string; error?: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className="afield">
      <label htmlFor={id}>{label}</label>
      <input id={id} {...input} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-e` : hint ? `${id}-h` : undefined} />
      {error ? <p className="afield-error" id={`${id}-e`} role="alert">{error}</p> : hint ? <p className="afield-hint" id={`${id}-h`}>{hint}</p> : null}
    </div>
  );
}

export function PasswordField({ label, error, hint, meter, value, ...input }: { label: string; error?: string; hint?: string; meter?: boolean; value: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const [show, setShow] = useState(false);
  const strength = passwordStrength(value);
  return (
    <div className="afield">
      <label htmlFor={id}>{label}</label>
      <div className="afield-pw">
        <input id={id} {...input} value={value} type={show ? 'text' : 'password'} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-e` : hint ? `${id}-h` : undefined} />
        <button type="button" onClick={() => setShow((s) => !s)} aria-pressed={show} aria-label={show ? 'Hide password' : 'Show password'}>{show ? 'Hide' : 'Show'}</button>
      </div>
      {meter && value ? (
        <div className="afield-meter" aria-live="polite">
          <span className="afield-bars" aria-hidden="true">{[1, 2, 3, 4].map((i) => <i key={i} data-on={i <= strength || undefined} data-level={strength} />)}</span>
          <span>{['', 'Weak', 'Fair', 'Good', 'Strong'][strength]}</span>
        </div>
      ) : null}
      {error ? <p className="afield-error" id={`${id}-e`} role="alert">{error}</p> : hint ? <p className="afield-hint" id={`${id}-h`}>{hint}</p> : null}
    </div>
  );
}

// The Google button. It is a plain link to the server, which sends the person to Google. If Google sign-in is not set up
// (no client id and secret), it is shown disabled and says so.
export function GoogleButton({ enabled, href, children }: { enabled: boolean | null; href: string; children: React.ReactNode }) {
  const mark = <span className="gmark" aria-hidden="true">G</span>;
  if (enabled === false) {
    return (
      <>
        <button type="button" className="btn secondary gbtn" disabled aria-describedby="google-off">{mark}{children}</button>
        <p className="afield-hint" id="google-off">Google sign-in is not switched on yet. It needs a Google client ID and secret in the server settings.</p>
      </>
    );
  }
  return <a className="btn secondary gbtn" href={href}>{mark}{children}</a>;
}

export const GOOGLE_MESSAGES: Record<string, string> = {
  not_configured: 'Google sign-in is not switched on yet.',
  denied: 'Google sign-in was cancelled.',
  state: 'The Google sign-in took too long or was interrupted. Please try again.',
  unverified: 'Google did not confirm a verified email address for that account, so we could not sign you in.',
};
