import { BITS_PER_BYTE, isBitSet, withBitFlipped, type BitAddress } from '../engine/bytes';
import type { GameState } from '../engine/types';

export const RISE_MS = 150;
/** Share of the destruction delay spent converging under the enemy; the rest is the upward flight. */
export const ALIGN_FRACTION = 0.4;

export interface Point {
  x: number;
  y: number;
}

/** The circle above one bit. Height runs from 0 (inside the slot) to 1 (fully risen). */
export interface BitCircle {
  on: boolean;
  changedAtMs: number;
  heightAtChange: number;
}

/** A risen circle that was consumed by a match and is now flying at its enemy. */
export interface Projectile {
  enemyId: number;
  address: BitAddress;
  startHeight: number;
  matchedAtMs: number;
  hitAtMs: number;
}

export interface Circles {
  bits: BitCircle[][];
  projectiles: Projectile[];
}

const AT_REST: BitCircle = { on: false, changedAtMs: 0, heightAtChange: 0 };

export function createCircles(registerBytes: number): Circles {
  return {
    bits: Array.from({ length: registerBytes }, () => Array(BITS_PER_BYTE).fill(AT_REST)),
    projectiles: [],
  };
}

/** Rising decelerates to a stop; sinking accelerates from a stop into the slot. */
export function circleHeight(circle: BitCircle, nowMs: number): number {
  const t = progressBetween(circle.changedAtMs, circle.changedAtMs + RISE_MS, nowMs);
  const from = circle.heightAtChange;
  return circle.on ? from + (1 - from) * (1 - (1 - t) ** 2) : from * (1 - t ** 2);
}

export function afterFlip(
  circles: Circles,
  before: GameState,
  address: BitAddress,
  after: GameState,
): Circles {
  if (after === before) return circles;
  const now = after.elapsedMs;
  const bits = circles.bits.map((row) => row.slice());
  const flipped = bits[address.byte]![address.bit]!;
  bits[address.byte]![address.bit] = {
    on: !flipped.on,
    changedAtMs: now,
    heightAtChange: circleHeight(flipped, now),
  };

  const flippedRegister = withBitFlipped(before.register, address);
  const wasMatch = after.register.some((value, byte) => value !== flippedRegister[byte]);
  if (!wasMatch) return { ...circles, bits };

  const matchedEnemy = after.enemies.find(
    (enemy) =>
      enemy.matchedAtMs === now &&
      before.enemies.find((previous) => previous.id === enemy.id)?.matchedAtMs === null,
  );
  const launched: Projectile[] = [];
  bits.forEach((row, byte) =>
    row.forEach((circle, bit) => {
      if (!isBitSet(flippedRegister, { byte, bit })) return;
      if (matchedEnemy) {
        launched.push({
          enemyId: matchedEnemy.id,
          address: { byte, bit },
          startHeight: circleHeight(circle, now),
          matchedAtMs: now,
          hitAtMs: now + after.mode.config.destructionDelayMs,
        });
      }
      row[bit] = { on: false, changedAtMs: now, heightAtChange: 0 };
    }),
  );
  return { bits, projectiles: [...circles.projectiles, ...launched] };
}

export function withoutLandedProjectiles(circles: Circles, state: GameState): Circles {
  const projectiles = circles.projectiles.filter((projectile) =>
    state.enemies.some((enemy) => enemy.id === projectile.enemyId),
  );
  return projectiles.length === circles.projectiles.length ? circles : { ...circles, projectiles };
}

/**
 * Converges from `start` to `aligned` (decelerating, all projectiles of a match arriving together),
 * then flies straight to `target` from a standstill with constant acceleration, landing at `hitAtMs`.
 */
export function projectilePosition(
  projectile: Projectile,
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
