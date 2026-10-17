// Subscription & Freemium Call Quota state management.
// Tracks:
//  - Free tier: 5 audio-only calls per workspace
//  - Call 6+: Per-seat subscription paywall (₹499/seat/month)
//  - Video unlock upon upgrade
//  - Call audit log for evidence export

const CALL_KEY = 'scopedesk_call_count';
const SUB_KEY = 'scopedesk_is_subscribed';
const CALL_LOG_KEY = 'scopedesk_call_log';

export interface CallLogEntry {
  id: string;
  timestamp: string;
  type: 'audio' | 'video';
  durationSeconds: number;
  callNumber: number;
  wasPaywalled: boolean;
  notes: string;
}

export function getCallCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const v = localStorage.getItem(CALL_KEY);
    return v ? parseInt(v, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function setCallCount(count: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CALL_KEY, String(count));
    window.dispatchEvent(new CustomEvent('scopedesk_subscription_updated'));
  } catch {
    /* ignore */
  }
}

export function isProSubscribed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(SUB_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setProSubscribed(subscribed: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SUB_KEY, subscribed ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('scopedesk_subscription_updated'));
  } catch {
    /* ignore */
  }
}

export function getCallLog(): CallLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CALL_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function logCallEnded(entry: Omit<CallLogEntry, 'id' | 'timestamp'>): CallLogEntry {
  const fullEntry: CallLogEntry = {
    ...entry,
    id: `CALL-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  if (typeof window !== 'undefined') {
    try {
      const logs = getCallLog();
      logs.push(fullEntry);
      localStorage.setItem(CALL_LOG_KEY, JSON.stringify(logs));
    } catch {
      /* ignore */
    }
  }
  return fullEntry;
}

export function simulateCallIncrement(isVideo: boolean = false): { count: number; subscribed: boolean } {
  const current = getCallCount();
  const next = current + 1;
  setCallCount(next);
  const subscribed = isProSubscribed();
  logCallEnded({
    type: isVideo ? 'video' : 'audio',
    durationSeconds: Math.floor(Math.random() * 120) + 45,
    callNumber: next,
    wasPaywalled: next > 5 && !subscribed,
    notes: next <= 5 ? `Free audio call #${next} of 5` : `Pro call #${next} (Subscribed: ${subscribed})`,
  });
  return { count: next, subscribed };
}

export function resetCallQuota(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CALL_KEY);
    localStorage.removeItem(SUB_KEY);
    localStorage.removeItem(CALL_LOG_KEY);
    window.dispatchEvent(new CustomEvent('scopedesk_subscription_updated'));
  } catch {
    /* ignore */
  }
}
