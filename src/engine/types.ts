export type Random = () => number;

export interface GameConfig {
  lives: number;
  destructionDelayMs: number;
  /** Starting time between spawns. */
  spawnIntervalMs: number;
  /** Starting time for an enemy to fall the full height of the playfield. */
  enemyFallMs: number;
  /** Score at which spawning and falling are twice as fast as at the start; the ramp is linear. */
  difficultyDoublesAtScore: number;
}

export interface GameMode {
  id: string;
  name: string;
  registerBytes: number;
  config: GameConfig;
  randomTarget(random: Random): Uint8Array;
  formatLabel(target: Uint8Array): string;
  matches(register: Uint8Array, target: Uint8Array): boolean;
}

export interface Enemy {
  id: number;
  target: Uint8Array;
  label: string;
  /** Horizontal position, 0 (left edge) to 1 (right edge). */
  x: number;
  /** Distance travelled, 0 (spawn) to 1 (reached the player). */
  progress: number;
  /** Fraction of the playfield travelled per second, fixed at spawn. */
  speed: number;
  matchedAtMs: number | null;
}

export type GameStatus = 'ready' | 'playing' | 'over';

export interface GameState {
  mode: GameMode;
  status: GameStatus;
  register: Uint8Array;
  enemies: Enemy[];
  elapsedMs: number;
  msUntilNextSpawn: number;
  nextEnemyId: number;
  lives: number;
  score: number;
}
