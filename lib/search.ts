// Search by words, not by the exact phrase: "Web Development" finds a web developer. Every word typed
// must match some word of the text; a word matches when one contains the other or they share a
// 5-letter start (develop-ment / develop-er). Used for freelancers (server) and jobs (page).
export const wordsOf = (s: string): string[] => s.toLowerCase().split(/[^a-z0-9+#]+/).filter(Boolean);

export const wordMatches = (token: string, word: string): boolean =>
  word.includes(token) || (word.length >= 3 && token.includes(word)) || (token.length >= 5 && word.length >= 5 && token.slice(0, 5) === word.slice(0, 5));

export function matchesAllWords(query: string, text: string): boolean {
  const tokens = wordsOf(query);
  if (!tokens.length) return true;
  const hay = wordsOf(text);
  return tokens.every((t) => hay.some((w) => wordMatches(t, w)));
}
