'use client';
// Voice and video calls between the client and the freelancer, inside the project. Media goes browser to
// browser (WebRTC); our server only passes the signalling and checks the captions. While a call is on, each
// person's browser turns their speech into text (the browser's speech recognition) and sends every line to the
// server, where the contact guard checks it: if a phone number, email, link or handle is said, even in words,
// the call is ended for both people. Calls need Chrome or Edge (speech recognition), otherwise they do not start.
// A public STUN server is used to find a route; strict networks may need a TURN server. OWNER: Krishna.
import { useCallback, useEffect, useRef, useState } from 'react';
import { pollCallSignals, sendCallSignal, sendCaption, startCall } from '@/lib/api';
import type { CallMode, CallSignal } from '@/lib/types';
import { Badge, Button, ErrorMessage } from '@/components/ui';

const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

interface Recognizer {
  continuous: boolean; interimResults: boolean; lang: string;
  start(): void; stop(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
}
const recognizerClass = (): (new () => Recognizer) | null => {
  const w = window as unknown as { SpeechRecognition?: new () => Recognizer; webkitSpeechRecognition?: new () => Recognizer };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

type Phase = 'idle' | 'calling' | 'incoming' | 'connecting' | 'live';
interface Line { id: number; who: 'you' | 'them'; text: string }

export default function Call({ projectId, peerName }: { projectId: string; peerName: string }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [mode, setMode] = useState<CallMode>('voice');
  const [lines, setLines] = useState<Line[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ended, setEnded] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);

  const phaseRef = useRef<Phase>('idle');
  const pc = useRef<RTCPeerConnection | null>(null);
  const local = useRef<MediaStream | null>(null);
  const remoteEl = useRef<HTMLVideoElement>(null);
  const localEl = useRef<HTMLVideoElement>(null);
  const recog = useRef<Recognizer | null>(null);
  const seq = useRef(0);
  const lineId = useRef(0);
  const pendingIce = useRef<RTCIceCandidateInit[]>([]);
  const modeRef = useRef<CallMode>('voice');

  const setPhaseBoth = (p: Phase) => { phaseRef.current = p; setPhase(p); };
  const addLine = (who: Line['who'], text: string): number => {
    const id = (lineId.current += 1);
    setLines((l) => [...l.slice(-39), { id, who, text }]);
    return id;
  };

  const cleanup = useCallback(() => {
    if (recog.current) { recog.current.onend = null; try { recog.current.stop(); } catch { /* already stopped */ } recog.current = null; }
    pc.current?.close(); pc.current = null;
    local.current?.getTracks().forEach((t) => t.stop()); local.current = null;
    pendingIce.current = [];
    if (remoteEl.current) remoteEl.current.srcObject = null;
    if (localEl.current) localEl.current.srcObject = null;
    setMuted(false);
  }, []);

  const finish = useCallback((message: string | null) => {
    cleanup();
    setPhaseBoth('idle');
    setEnded(message);
  }, [cleanup]);

  const hangUp = useCallback(async (reason: string, message: string | null) => {
    if (phaseRef.current !== 'idle') void sendCallSignal(projectId, { type: 'hangup', payload: JSON.stringify({ reason }) }).catch(() => undefined);
    finish(message);
  }, [projectId, finish]);

  // Turns this person's speech into lines, and sends each line to the guard.
  const startListening = useCallback(() => {
    const R = recognizerClass();
    if (!R) return;
    const r = new R();
    r.continuous = true; r.interimResults = false; r.lang = 'en-IN';
    r.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        if (!e.results[i].isFinal) continue;
        const text = e.results[i][0].transcript.trim();
        if (!text) continue;
        const mine = addLine('you', text);
        sendCaption(projectId, text)
          .then((res) => {
            // a blocked line is not kept on screen either
            if (res.blocked) setLines((l) => l.map((x) => (x.id === mine ? { ...x, text: '[hidden by the guard]' } : x)));
            if (res.blocked) finish(`The call was ended because personal contact details were said (${res.reasons.join(', ')}). They were not saved. Please keep the conversation and payments on the platform.`);
          })
          .catch((err) => setError(err instanceof Error ? err.message : 'Could not check the call'));
      }
    };
    r.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') void hangUp('monitoring', 'The call ended because live monitoring was blocked. Allow the microphone and speech recognition to call.');
    };
    r.onend = () => { if (phaseRef.current === 'live' || phaseRef.current === 'connecting') { try { r.start(); } catch { /* restarting */ } } };
    recog.current = r;
    try { r.start(); } catch { /* already started */ }
  }, [projectId, finish, hangUp]);

  const makePeer = useCallback((stream: MediaStream) => {
    const p = new RTCPeerConnection(ICE);
    stream.getTracks().forEach((t) => p.addTrack(t, stream));
    p.onicecandidate = (e) => { if (e.candidate) void sendCallSignal(projectId, { type: 'ice', payload: JSON.stringify(e.candidate) }).catch(() => undefined); };
    p.ontrack = (e) => { if (remoteEl.current) { remoteEl.current.srcObject = e.streams[0]; void remoteEl.current.play().catch(() => undefined); } };
    p.onconnectionstatechange = () => {
      if (p.connectionState === 'connected') { setPhaseBoth('live'); startListening(); }
      if (p.connectionState === 'failed' || p.connectionState === 'disconnected') finish('The call was disconnected.');
    };
    pc.current = p;
    return p;
  }, [projectId, startListening, finish]);

  const getMedia = useCallback(async (m: CallMode): Promise<MediaStream | null> => {
    if (!recognizerClass()) { setError('Live monitoring needs speech recognition, which works in Chrome and Edge. Calls are not available in this browser.'); return null; }
    if (!navigator.mediaDevices?.getUserMedia) { setError('This browser cannot use the microphone here.'); return null; }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: m === 'video' });
      local.current = s;
      if (localEl.current && m === 'video') { localEl.current.srcObject = s; void localEl.current.play().catch(() => undefined); }
      return s;
    } catch {
      setError(m === 'video' ? 'Allow the camera and microphone to make a video call.' : 'Allow the microphone to make a voice call.');
      return null;
    }
  }, []);

  async function call(m: CallMode) {
    setError(null); setEnded(null); setLines([]);
    setMode(m); modeRef.current = m;
    const stream = await getMedia(m);
    if (!stream) return;
    setPhaseBoth('calling');
    try { await startCall(projectId, m); } catch (err) { setError(err instanceof Error ? err.message : 'Could not start the call'); finish(null); }
  }

  async function accept() {
    setError(null); setEnded(null); setLines([]);
    const stream = await getMedia(modeRef.current);
    if (!stream) { void sendCallSignal(projectId, { type: 'reject' }).catch(() => undefined); setPhaseBoth('idle'); return; }
    setPhaseBoth('connecting');
    const p = makePeer(stream);
    const offer = await p.createOffer();
    await p.setLocalDescription(offer);
    void sendCallSignal(projectId, { type: 'offer', payload: JSON.stringify(offer) });
  }

  function decline() {
    void sendCallSignal(projectId, { type: 'reject' }).catch(() => undefined);
    setPhaseBoth('idle');
  }

  const handle = useCallback(async (s: CallSignal) => {
    const payload = s.payload ? safeParse(s.payload) : null;
    if (s.type === 'caption') { addLine('them', s.payload); return; }
    if (s.type === 'ring') {
      if (phaseRef.current !== 'idle') return;
      modeRef.current = payload?.mode === 'video' ? 'video' : 'voice';
      setMode(modeRef.current); setEnded(null); setPhaseBoth('incoming');
      return;
    }
    if (s.type === 'reject') { if (phaseRef.current === 'calling') finish(`${peerName} declined the call.`); return; }
    if (s.type === 'hangup') {
      if (phaseRef.current === 'idle') return;
      if (payload?.reason === 'guard') finish(`The call was ended because personal contact details were said (${(payload.reasons ?? []).join(', ')}). They were not saved. Please keep the conversation and payments on the platform.`);
      else finish(payload?.reason === 'monitoring' ? `${peerName}'s live monitoring was blocked, so the call ended.` : `${peerName} ended the call.`);
      return;
    }
    if (s.type === 'offer' && phaseRef.current === 'calling' && local.current) {
      setPhaseBoth('connecting');
      const p = makePeer(local.current);
      await p.setRemoteDescription(payload);
      pendingIce.current.splice(0).forEach((c) => void p.addIceCandidate(c).catch(() => undefined));
      const answer = await p.createAnswer();
      await p.setLocalDescription(answer);
      void sendCallSignal(projectId, { type: 'answer', payload: JSON.stringify(answer) });
      return;
    }
    if (s.type === 'answer' && pc.current) {
      await pc.current.setRemoteDescription(payload);
      pendingIce.current.splice(0).forEach((c) => void pc.current?.addIceCandidate(c).catch(() => undefined));
      return;
    }
    if (s.type === 'ice' && payload) {
      if (pc.current?.remoteDescription) void pc.current.addIceCandidate(payload).catch(() => undefined);
      else pendingIce.current.push(payload);
    }
  }, [projectId, peerName, makePeer, finish]);

  // Listen for the other person ringing, signalling and captions while this page is open.
  useEffect(() => {
    let stop = false;
    async function tick() {
      try {
        const list = await pollCallSignals(projectId, seq.current);
        for (const s of list) { seq.current = Math.max(seq.current, s.seq); if (!stop) await handle(s); }
      } catch { /* try again on the next tick */ }
    }
    void pollCallSignals(projectId, 0).then((l) => { seq.current = l.length ? Math.max(...l.map((s) => s.seq)) : 0; }).catch(() => undefined);
    const t = window.setInterval(() => void tick(), 1200);
    return () => { stop = true; window.clearInterval(t); };
  }, [projectId, handle]);
  useEffect(() => () => cleanup(), [cleanup]);

  const toggleMute = () => { local.current?.getAudioTracks().forEach((t) => { t.enabled = muted; }); setMuted((m) => !m); };
  const busy = phase !== 'idle';

  return (
    <div className="callbox">
      <div className="callbox-head">
        <strong>Call {peerName}</strong>
        <Badge tone={phase === 'live' ? 'good' : 'neutral'}>{{ idle: 'Not in a call', calling: 'Ringing...', incoming: 'Incoming call', connecting: 'Connecting...', live: `Live ${mode} call` }[phase]}</Badge>
      </div>
      <p className="muted callbox-note">
        Calls happen on the platform and are watched live: your speech is turned into text and checked, and the call ends if a phone number,
        email address, link or social handle is said, even in words. This is a rule-based guard. It works in Chrome and Edge.
      </p>
      <ErrorMessage message={error} />
      {ended ? <p className="callbox-ended" role="status">{ended}</p> : null}

      {phase === 'incoming' ? (
        <div className="callbox-actions">
          <p style={{ margin: 0 }}><strong>{peerName}</strong> is calling ({mode} call).</p>
          <Button type="button" onClick={() => void accept()}>Answer</Button>
          <Button type="button" variant="secondary" onClick={decline}>Decline</Button>
        </div>
      ) : null}

      {phase === 'idle' ? (
        <div className="callbox-actions">
          <Button type="button" onClick={() => void call('voice')}>Voice call</Button>
          <Button type="button" variant="secondary" onClick={() => void call('video')}>Video call</Button>
        </div>
      ) : null}

      {busy && phase !== 'incoming' ? (
        <>
          <div className={`callbox-stage${mode === 'video' ? ' callbox-stage--video' : ''}`}>
            <video ref={remoteEl} className="callbox-remote" autoPlay playsInline />
            <video ref={localEl} className="callbox-local" autoPlay playsInline muted />
            {mode === 'voice' ? <p className="callbox-voice">Voice call with {peerName}</p> : null}
          </div>
          <div className="callbox-actions">
            <Button type="button" variant="secondary" onClick={toggleMute} aria-pressed={muted}>{muted ? 'Unmute' : 'Mute'}</Button>
            <Button type="button" variant="danger" onClick={() => void hangUp('ended', 'You ended the call.')}>End call</Button>
          </div>
        </>
      ) : null}

      {lines.length ? (
        <ul className="callbox-captions" aria-live="polite" aria-label="Live captions">
          {lines.map((l) => <li key={l.id} data-who={l.who}><strong>{l.who === 'you' ? 'You' : peerName}:</strong> {l.text}</li>)}
        </ul>
      ) : null}
    </div>
  );
}

function safeParse(s: string): any { // eslint-disable-line @typescript-eslint/no-explicit-any
  try { return JSON.parse(s); } catch { return null; }
}
