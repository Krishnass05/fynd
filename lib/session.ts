// Demo "login": remembers which demo user is acting. OWNER: Krishna.
// Real sign-in (Supabase Auth) can replace this later without touching pages.
const KEY = 'scopedesk_user';

export function getUserId(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setUserId(id: string): void {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* storage blocked: the page still works for this visit */
  }
}

export function clearUser(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
