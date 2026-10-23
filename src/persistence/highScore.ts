import type { DifficultyId } from '../modes/difficulties';

const keyFor = (modeId: string, difficultyId: DifficultyId) =>
  `flippy-bit:high-score:${modeId}:${difficultyId}`;

export function loadHighScore(modeId: string, difficultyId: DifficultyId): number {
  try {
    return Number(localStorage.getItem(keyFor(modeId, difficultyId))) || 0;
  } catch {
    return 0;
  }
}

export function saveHighScore(modeId: string, difficultyId: DifficultyId, score: number): void {
  try {
    localStorage.setItem(keyFor(modeId, difficultyId), String(score));
  } catch {
    // Storage can be unavailable (private browsing, blocked site data); the game still works.
  }
}
