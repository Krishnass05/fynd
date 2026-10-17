'use client';
// The big hero search with autocomplete. Suggestions come from local sample data (domains, topics and
// sample services) through `suggest`, kept separate so it can later call an API. Keyboard: arrows move
// through suggestions, Enter picks one (or searches the text), Escape closes. OWNER: Krishna.
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { matchesAllWords, wordsOf } from '@/lib/search';
import { Search } from '@/components/ui/icons';
import { SUGGESTIONS, type Destination, type Suggestion } from './data';

export function suggest(query: string, limit = 7): Suggestion[] {
  if (!query.trim()) return [];
  const q = query.trim().toLowerCase();
  const hits = SUGGESTIONS.filter((s) => matchesAllWords(query, s.label));
  // Labels that start with the text first, then categories, then the rest.
  const rank = (s: Suggestion) => (s.label.toLowerCase().startsWith(q) ? 0 : 2) + (s.kind === 'Category' ? 0 : 1);
  return hits.sort((a, b) => rank(a) - rank(b) || a.label.localeCompare(b.label)).slice(0, limit);
}

// Wrap the typed words in <mark> inside a suggestion label.
function Highlight({ text, query }: { text: string; query: string }) {
  const tokens = wordsOf(query).filter((t) => t.length > 0);
  if (!tokens.length) return <>{text}</>;
  const re = new RegExp(`(${tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  return <>{text.split(re).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>))}</>;
}

export default function HeroSearch({ placeholder, action, query, setQuery, onSearch }: {
  placeholder: string;
  action: string;
  query: string;
  setQuery: (q: string) => void;
  onSearch: (to: Destination) => void;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const box = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const items = useMemo(() => suggest(query), [query]);
  const showList = open && items.length > 0;

  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);
  useEffect(() => setActive(-1), [query]);

  const choose = (s: Suggestion) => { setQuery(s.label); setOpen(false); onSearch(s.to); };
  const submit = () => {
    if (showList && active >= 0) return choose(items[active]);
    setOpen(false);
    onSearch({ q: query });
  };

  return (
    <form ref={box} className="hsearch" role="search" onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <Search size={22} />
      <input
        ref={input}
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && items.length) { e.preventDefault(); setOpen(true); setActive((a) => (a + 1) % items.length); }
          if (e.key === 'ArrowUp' && items.length) { e.preventDefault(); setOpen(true); setActive((a) => (a <= 0 ? items.length - 1 : a - 1)); }
          if (e.key === 'Escape') { setOpen(false); setActive(-1); }
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        spellCheck={false}
      />
      {query ? (
        <button type="button" className="hsearch-clear" aria-label="Clear search" onClick={() => { setQuery(''); setOpen(false); input.current?.focus(); }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
      ) : null}
      <button type="submit" className="btn hsearch-go">{action}</button>
      {showList ? (
        <ul className="hsearch-list" id={listId} role="listbox" aria-label="Suggestions">
          {items.map((s, i) => (
            <li
              key={s.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => { e.preventDefault(); choose(s); }}
            >
              <Search size={16} />
              <span className="hsearch-label"><Highlight text={s.label} query={query} /></span>
              <span className="hsearch-kind">{s.kind}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}
