'use client';
// Project workspace chat. OWNER: Harini.
// Used by both client and freelancer project pages.
// Props: projectId (required) and role (optional: 'client' | 'freelancer').
import { useEffect, useRef, useState } from 'react';
import { getMe, listMessages, sendMessage } from '@/lib/api';
import { getUserId } from '@/lib/session';
import type { Message, Role, User } from '@/lib/types';
import { useAsync } from '@/lib/useAsync';
import { Badge, Button, ErrorMessage, Spinner } from '@/components/ui';
import styles from './chat.module.css';

export interface ChatProps {
  projectId: string;
  role?: Role;
}

function formatTimestamp(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Today at ${timeStr}`;
    const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `${dateStr}, ${timeStr}`;
  } catch {
    return isoString;
  }
}

export default function Chat({ projectId, role }: ChatProps) {
  const { data: messages, error: listError, reload, loading } = useAsync<Message[]>(
    () => listMessages(projectId),
    [projectId]
  );
  const { data: currentUser } = useAsync<User>(getMe, []);
  const activeUserId = currentUser?.id ?? getUserId();

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef<number>(0);

  // Refresh every 3.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      void reload();
    }, 3500);
    return () => clearInterval(timer);
  }, [reload]);

  // Scroll to bottom when message count increases
  useEffect(() => {
    const currentCount = messages?.length ?? 0;
    if (currentCount > prevCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevCountRef.current = currentCount;
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setSendError(null);
    try {
      await sendMessage(projectId, trimmed);
      setText('');
      await reload();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Could not send message. Please try again.');
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend(e);
    }
  }

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <div className={styles.chatTitle}>
          <span className={styles.liveIndicator} title="Auto-refreshing live workspace chat" />
          <span>Project Messages</span>
          {role ? (
            <Badge tone="neutral">
              Viewing as {role === 'client' ? 'Client' : 'Freelancer'}
            </Badge>
          ) : null}
        </div>
        <span className="muted">Refreshes every 3s</span>
      </div>

      <ErrorMessage message={listError ?? sendError} />

      <div className={styles.chatLog} aria-live="polite" aria-label="Project chat history">
        {loading && !messages ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Spinner />
          </div>
        ) : null}

        {messages && messages.length === 0 ? (
          <div className={styles.emptyNotice}>
            <p style={{ margin: '0 0 6px', fontWeight: 600 }}>No messages yet</p>
            <p className="muted" style={{ margin: 0 }}>
              Use this workspace chat to clarify requirements, discuss scope adjustments, or coordinate next steps.
            </p>
          </div>
        ) : null}

        {(messages ?? []).map((m) => {
          const isMe = activeUserId ? m.senderId === activeUserId : false;
          return (
            <div
              key={m.id}
              className={`${styles.messageRow} ${isMe ? styles.messageRowMe : styles.messageRowOther}`}
            >
              <div className={styles.messageMeta}>
                <span className={styles.senderName}>{isMe ? 'You' : m.senderName}</span>
                <span>•</span>
                <span>{formatTimestamp(m.sentAt)}</span>
              </div>
              <div className={`${styles.messageBubble} ${isMe ? styles.bubbleMe : styles.bubbleOther}`}>
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className={styles.messageForm}>
        <div className={styles.inputWrapper}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
            aria-label="Write a message"
            className={styles.textInput}
            rows={1}
            disabled={sending}
          />
        </div>
        <Button type="submit" disabled={sending || !text.trim()} className={styles.sendButton}>
          {sending ? 'Sending...' : 'Send'}
        </Button>
      </form>
    </div>
  );
}
