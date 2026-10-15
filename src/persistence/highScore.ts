const keyFor = (modeId: string) => `flippy-bit:high-score:${modeId}`;

export function loadHighScore(modeId: string): number {
  try {
    return Number(localStorage.getItem(keyFor(modeId))) || 0;
  } catch {
    return 0;
  }
}

export function saveHighScore(modeId: string, score: number): void {
  try {
    localStorage.setItem(keyFor(modeId), String(score));
  } catch {
    // Storage can be unavailable (private browsing, blocked site data); the game still works.
  }
}
