import { defaultDifficultyId, isDifficultyId, type DifficultyId } from '../modes/difficulties';

const KEY = 'flippy-bit:difficulty';

export function loadDifficulty(): DifficultyId {
  try {
    const stored = localStorage.getItem(KEY);
    return isDifficultyId(stored) ? stored : defaultDifficultyId;
  } catch {
    return defaultDifficultyId;
  }
}

export function saveDifficulty(difficultyId: DifficultyId): void {
  try {
    localStorage.setItem(KEY, difficultyId);
  } catch {
    // Storage can be unavailable (private browsing, blocked site data); the game still works.
  }
}
