'use client';
// Project chat, used by both the client and freelancer pages. OWNER: Harini.
// Props must stay { projectId }. Refreshes every 5 seconds for now.
import { useEffect, useState } from 'react';
import { listMessages, sendMessage } from '@/lib/api';
import type { Message } from '@/lib/types';
import { useAsync } from '@/lib/useAsync';
import { Button, ErrorMessage } from '@/components/ui';

export default function Chat({ projectId }: { projectId: string }) {
  const { data, error, reload } = useAsync<Message[]>(() => listMessages(projectId), [projectId]);
  const [text, setText] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => void reload(), 5000);
    return () => clearInterval(t);
  }, [reload]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await sendMessage(projectId, text);
      setText('');
      setSendError(null);
      await reload();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Could not send');
    }
  }

  return (
    <div className="chat">
      <ErrorMessage message={error ?? sendError} />
      <div className="log" aria-live="polite">
        {(data ?? []).map((m) => (
          <div key={m.id} className="bubble">
            <strong>{m.senderName}</strong> <span className="muted">{new Date(m.sentAt).toLocaleString()}</span>
            <div>{m.body}</div>
          </div>
        ))}
        {data && data.length === 0 ? <p className="muted">No messages yet.</p> : null}
      </div>
      <form onSubmit={send} className="row">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message" aria-label="Message" style={{ flex: 1 }} />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
}
