const KEY = 'flippy-bit:muted';

export function loadMuted(): boolean {
  try {
    return localStorage.getItem(KEY) === 'true';
  } catch {
    return false;
  }
}

export function saveMuted(muted: boolean): void {
  try {
    localStorage.setItem(KEY, String(muted));
  } catch {
    // Storage can be unavailable (private browsing, blocked site data); the game still works.
  }
}
