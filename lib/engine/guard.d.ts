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
