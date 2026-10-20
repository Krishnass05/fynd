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

const ROLE_KEY = 'scopedesk_role';

// The side an account with both roles is acting as. Accounts with one role do not need it.
export function getRole(): string | null {
  try {
    return localStorage.getItem(ROLE_KEY);
  } catch {
    return null;
  }
}

export function setRole(role: string): void {
  try {
    localStorage.setItem(ROLE_KEY, role);
  } catch {
    /* storage blocked */
  }
}

export function clearUser(): void {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(ROLE_KEY);
  } catch {
    /* ignore */
  }
}
