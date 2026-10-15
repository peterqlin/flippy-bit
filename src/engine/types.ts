export type Random = () => number;

export interface GameConfig {
  lives: number;
  destructionDelayMs: number;
  spawnIntervalMs: number;
  /** Fraction of the playfield an enemy travels per second. */
  enemySpeed: number;
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
  matchedAtMs: number | null;
}

export type GameStatus = 'playing' | 'over';

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
