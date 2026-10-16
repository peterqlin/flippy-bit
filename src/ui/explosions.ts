import type { Enemy, GameState, Random } from '../engine/types';

export const EXPLOSION_MS = 400;

/** Burst left behind by a destroyed enemy, at the spot in the playfield where it died. */
export interface Explosion {
  enemyId: number;
  label: string;
  x: number;
  progress: number;
  startedAtMs: number;
  rotationRad: number;
}

/** Steps only destroy enemies whose destruction delay has run out. */
export function explosionsAfterStep(
  explosions: Explosion[],
  before: GameState,
  after: GameState,
  random: Random,
): Explosion[] {
  if (after === before) return explosions;
  const { destructionDelayMs } = after.mode.config;
  const started = destroyedEnemies(before, after)
    .filter(
      (enemy) =>
        enemy.matchedAtMs !== null && after.elapsedMs - enemy.matchedAtMs >= destructionDelayMs,
    )
    .map((enemy) => explode(enemy, enemy.matchedAtMs! + destructionDelayMs, before, random));
  const burning = explosions.filter(
    (explosion) => after.elapsedMs - explosion.startedAtMs < EXPLOSION_MS,
  );
  if (started.length === 0 && burning.length === explosions.length) return explosions;
  return [...burning, ...started];
}

/** A flip removes an enemy only when the match kills it instantly. */
export function explosionsAfterFlip(
  explosions: Explosion[],
  before: GameState,
  after: GameState,
  random: Random,
): Explosion[] {
  const started = destroyedEnemies(before, after).map((enemy) =>
    explode(enemy, after.elapsedMs, before, random),
  );
  return started.length === 0 ? explosions : [...explosions, ...started];
}

/** 0 when the explosion starts, 1 once it has burnt out. */
export function explosionProgress(explosion: Explosion, nowMs: number): number {
  return Math.min(1, Math.max(0, (nowMs - explosion.startedAtMs) / EXPLOSION_MS));
}

function destroyedEnemies(before: GameState, after: GameState): Enemy[] {
  return before.enemies.filter((enemy) => !after.enemies.some(({ id }) => id === enemy.id));
}

function explode(enemy: Enemy, diedAtMs: number, before: GameState, random: Random): Explosion {
  const progressAtDeath = enemy.progress + (enemy.speed * (diedAtMs - before.elapsedMs)) / 1000;
  return {
    enemyId: enemy.id,
    label: enemy.label,
    x: enemy.x,
    progress: Math.min(progressAtDeath, 1),
    startedAtMs: diedAtMs,
    rotationRad: random() * 2 * Math.PI,
  };
}
