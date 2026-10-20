// A phone-style ringtone made in the browser (Web Audio), so there is no sound file to load. OWNER: Krishna.
// startRingtone() plays "ring-ring, pause" in a loop and returns a stop function. Browsers only allow sound after
// the person has clicked or typed on the page once; before that it stays silent and the pop-up still shows.
type Ctx = AudioContext;
let shared: Ctx | null = null;

function context(): Ctx | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!shared) shared = new AC();
  return shared;
}

// One short "ring": two tones together (like a phone), fading in and out.
function ring(ctx: Ctx, at: number) {
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(0.12, at + 0.03);
  gain.gain.setValueAtTime(0.12, at + 0.37);
  gain.gain.linearRampToValueAtTime(0, at + 0.4);
  for (const f of [440, 480]) {
    const o = ctx.createOscillator();
    o.frequency.value = f;
    o.connect(gain);
    o.start(at);
    o.stop(at + 0.42);
  }
}

export function startRingtone(): () => void {
  const ctx = context();
  if (!ctx) return () => undefined;
  void ctx.resume().catch(() => undefined);
  let stopped = false;
  const play = () => {
    if (stopped) return;
    const t = ctx.currentTime + 0.05;
    ring(ctx, t);
    ring(ctx, t + 0.6);
  };
  play();
  const timer = window.setInterval(play, 3000);
  return () => { stopped = true; window.clearInterval(timer); };
}
