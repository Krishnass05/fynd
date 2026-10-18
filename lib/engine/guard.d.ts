export const HIDDEN: string;
export const MIN_DIGITS_WRITTEN: number;
export const MIN_DIGITS_SPOKEN: number;

export interface ScrubResult {
  body: string; // the text with contact details replaced by HIDDEN
  redacted: boolean;
  kinds: string[]; // what was found, for example 'phone number (said in words)'
  asksOffPlatform: boolean; // "call me", "whatsapp", "my number" and similar (flagged, not hidden)
}
export function scrub(text: string): ScrubResult;

export interface SpeechResult {
  block: boolean; // true if the call should end
  reasons: string[];
  safeText: string; // the caption with details hidden, safe to show and save
}
export function inspectSpeech(text: string): SpeechResult;

export interface NumberFragment {
  digits: number; // how many digits the message holds
  spoken: boolean; // true if any were written as words
}
// The whole message is only part of a number ("eight", "98", "zer"), or null.
export function numberFragment(text: string): NumberFragment | null;
// Several number-only messages in a row, oldest first: do they add up to a phone number?
export function splitNumber(pieces: NumberFragment[]): boolean;
