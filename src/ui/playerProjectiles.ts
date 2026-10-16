import { BITS_PER_BYTE, isBitSet, withBitFlipped, type BitAddress } from '../engine/bytes';
import type { GameState } from '../engine/types';

export const RISE_MS = 150;
/** Share of the destruction delay spent converging under the enemy; the rest is the upward flight. */
export const ALIGN_FRACTION = 0.7;

export interface Point {
  x: number;
  y: number;
}

/**
 * A player projectile sitting over a bit. It rises out of the bit's slot while the bit is set and
 * sinks back when it's cleared. Height runs from 0 (inside the slot) to 1 (fully risen).
 */
export interface LoadedPlayerProjectile {
  raised: boolean;
  changedAtMs: number;
  heightAtChange: number;
}

/** A loaded projectile that was launched by a match and is flying at the matched enemy. */
export interface FiredPlayerProjectile {
  enemyId: number;
  address: BitAddress;
  startHeight: number;
  matchedAtMs: number;
  hitAtMs: number;
}

export interface PlayerProjectiles {
  /** Indexed by `[byte][bit]`, one per register bit. */
  loaded: LoadedPlayerProjectile[][];
  fired: FiredPlayerProjectile[];
}

const IN_SLOT: LoadedPlayerProjectile = { raised: false, changedAtMs: 0, heightAtChange: 0 };

export function createPlayerProjectiles(registerBytes: number): PlayerProjectiles {
  return {
    loaded: Array.from({ length: registerBytes }, () => Array(BITS_PER_BYTE).fill(IN_SLOT)),
    fired: [],
  };
}

/** Rising decelerates to a stop; sinking accelerates from a stop into the slot. */
export function loadedProjectileHeight(loaded: LoadedPlayerProjectile, nowMs: number): number {
  const t = progressBetween(loaded.changedAtMs, loaded.changedAtMs + RISE_MS, nowMs);
  const from = loaded.heightAtChange;
  return loaded.raised ? from + (1 - from) * (1 - (1 - t) ** 2) : from * (1 - t ** 2);
}

export function playerProjectilesAfterFlip(
  projectiles: PlayerProjectiles,
  before: GameState,
  address: BitAddress,
  after: GameState,
): PlayerProjectiles {
  if (after === before) return projectiles;
  const now = after.elapsedMs;
  const loaded = projectiles.loaded.map((row) => row.slice());
  const flipped = loaded[address.byte]![address.bit]!;
  loaded[address.byte]![address.bit] = {
    raised: !flipped.raised,
    changedAtMs: now,
    heightAtChange: loadedProjectileHeight(flipped, now),
  };

  const flippedRegister = withBitFlipped(before.register, address);
  const wasMatch = after.register.some((value, byte) => value !== flippedRegister[byte]);
  if (!wasMatch) return { ...projectiles, loaded };

  const matchedEnemy = after.enemies.find(
    (enemy) =>
      enemy.matchedAtMs === now &&
      before.enemies.find((previous) => previous.id === enemy.id)?.matchedAtMs === null,
  );
  const launched: FiredPlayerProjectile[] = [];
  loaded.forEach((row, byte) =>
    row.forEach((projectile, bit) => {
      if (!isBitSet(flippedRegister, { byte, bit })) return;
      if (matchedEnemy) {
        launched.push({
          enemyId: matchedEnemy.id,
          address: { byte, bit },
          startHeight: loadedProjectileHeight(projectile, now),
          matchedAtMs: now,
          hitAtMs: now + after.mode.config.destructionDelayMs,
        });
      }
      row[bit] = { raised: false, changedAtMs: now, heightAtChange: 0 };
    }),
  );
  return { loaded, fired: [...projectiles.fired, ...launched] };
}

export function withoutLandedPlayerProjectiles(
  projectiles: PlayerProjectiles,
  state: GameState,
): PlayerProjectiles {
  const fired = projectiles.fired.filter((projectile) =>
    state.enemies.some((enemy) => enemy.id === projectile.enemyId),
  );
  return fired.length === projectiles.fired.length ? projectiles : { ...projectiles, fired };
}

/**
 * Converges from `start` to `aligned` (decelerating, all projectiles of a match arriving together),
 * then flies straight to `target` from a standstill with constant acceleration, landing at `hitAtMs`.
 */
export function firedProjectilePosition(
  projectile: FiredPlayerProjectile,
  nowMs: number,
  start: Point,
  aligned: Point,
  target: Point,
): Point {
  const alignedAtMs =
    projectile.matchedAtMs + (projectile.hitAtMs - projectile.matchedAtMs) * ALIGN_FRACTION;
  if (nowMs < alignedAtMs) {
    const t = progressBetween(projectile.matchedAtMs, alignedAtMs, nowMs);
    return lerp(start, aligned, 1 - (1 - t) ** 2);
  }
  const t = progressBetween(alignedAtMs, projectile.hitAtMs, nowMs);
  return lerp(aligned, target, t ** 2);
}

function progressBetween(fromMs: number, toMs: number, nowMs: number): number {
  if (toMs <= fromMs) return 1;
  return Math.min(1, Math.max(0, (nowMs - fromMs) / (toMs - fromMs)));
}

function lerp(from: Point, to: Point, t: number): Point {
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
}
