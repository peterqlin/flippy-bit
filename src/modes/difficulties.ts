import type { GameMode } from '../engine/types';

export const difficulties = [
  { id: 'beginner', name: 'Beginner', speedScale: 0.5 },
  { id: 'advanced', name: 'Advanced', speedScale: 1 },
] as const;

export type Difficulty = (typeof difficulties)[number];
export type DifficultyId = Difficulty['id'];

export const defaultDifficultyId: DifficultyId = 'beginner';

export function isDifficultyId(value: unknown): value is DifficultyId {
  return difficulties.some(({ id }) => id === value);
}

export function difficultyById(id: DifficultyId): Difficulty {
  return difficulties.find((difficulty) => difficulty.id === id)!;
}

/** Scales starting speeds and the ramp alike, so a run plays like the mode's own run slowed down. */
export function withDifficulty(mode: GameMode, id: DifficultyId): GameMode {
  const { speedScale } = difficultyById(id);
  const { config } = mode;
  return {
    ...mode,
    config: {
      ...config,
      spawnIntervalMs: config.spawnIntervalMs / speedScale,
      enemyFallMs: config.enemyFallMs / speedScale,
      difficultyDoublesAtScore: config.difficultyDoublesAtScore / speedScale,
    },
  };
}
