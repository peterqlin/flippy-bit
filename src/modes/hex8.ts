import { bytesEqual, toHex } from '../engine/bytes';
import type { GameMode } from '../engine/types';

export const hex8: GameMode = {
  id: 'hex8',
  name: '8-bit hex',
  registerBytes: 1,
  config: {
    lives: 1,
    destructionDelayMs: 400,
    spawnIntervalMs: 2000,
    enemyFallMs: 8000,
    difficultyDoublesAtScore: 60,
  },
  randomTarget: (random) => Uint8Array.of(1 + Math.floor(random() * 255)),
  formatLabel: toHex,
  matches: bytesEqual,
};
