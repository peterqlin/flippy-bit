import { describe, expect, it } from 'vitest';
import { createGame, flipBit, step } from '../engine/game';
import type { Enemy, GameState } from '../engine/types';
import { hex8 } from '../modes/hex8';
import {
  ALIGN_FRACTION,
  RISE_MS,
  playerProjectilesAfterFlip,
  loadedProjectileHeight,
  createPlayerProjectiles,
  firedProjectilePosition,
  withoutLandedPlayerProjectiles,
  type LoadedPlayerProjectile,
  type PlayerProjectiles,
  type FiredPlayerProjectile,
} from './playerProjectiles';

const fixedRandom = () => 0.5;

function gameWith(enemies: Partial<Enemy>[], destructionDelayMs = 400): GameState {
  const mode = {
    ...hex8,
    config: { ...hex8.config, destructionDelayMs, spawnIntervalMs: Infinity },
  };
  return {
    ...createGame(mode),
    msUntilNextSpawn: Infinity,
    enemies: enemies.map((enemy, id) => ({
      id,
      target: Uint8Array.of(0x03),
      label: '03',
      x: 0.5,
      progress: 0,
      speed: 0.1,
      matchedAtMs: null,
      ...enemy,
    })),
  };
}

function flip(game: GameState, playerProjectiles: PlayerProjectiles, bit: number) {
  const address = { byte: 0, bit };
  const next = flipBit(game, address);
  return {
    game: next,
    playerProjectiles: playerProjectilesAfterFlip(playerProjectiles, game, address, next),
  };
}

function advance(game: GameState, ms: number) {
  return step(game, ms, fixedRandom);
}

describe('loadedProjectileHeight', () => {
  const rising: LoadedPlayerProjectile = { raised: true, changedAtMs: 0, heightAtChange: 0 };
  const sinking: LoadedPlayerProjectile = { raised: false, changedAtMs: 0, heightAtChange: 1 };

  it('rises with decreasing speed and stops at full height', () => {
    const firstHalf = loadedProjectileHeight(rising, RISE_MS / 2);
    const secondHalf = loadedProjectileHeight(rising, RISE_MS) - firstHalf;

    expect(firstHalf).toBeGreaterThan(secondHalf);
    expect(loadedProjectileHeight(rising, RISE_MS)).toBe(1);
    expect(loadedProjectileHeight(rising, RISE_MS * 10)).toBe(1);
  });

  it('sinks with increasing speed and stops in the slot', () => {
    const firstHalf = 1 - loadedProjectileHeight(sinking, RISE_MS / 2);
    const secondHalf =
      loadedProjectileHeight(sinking, RISE_MS / 2) - loadedProjectileHeight(sinking, RISE_MS);

    expect(firstHalf).toBeLessThan(secondHalf);
    expect(loadedProjectileHeight(sinking, RISE_MS)).toBe(0);
  });

  it('reverses from the current height when flipped mid-rise', () => {
    let state = { game: gameWith([]), playerProjectiles: createPlayerProjectiles(1) };
    state = flip(state.game, state.playerProjectiles, 4);
    state.game = advance(state.game, RISE_MS / 2);
    const midRise = loadedProjectileHeight(
      state.playerProjectiles.loaded[0]![4]!,
      state.game.elapsedMs,
    );
    state = flip(state.game, state.playerProjectiles, 4);

    expect(
      loadedProjectileHeight(state.playerProjectiles.loaded[0]![4]!, state.game.elapsedMs),
    ).toBeCloseTo(midRise);
  });
});

describe('playerProjectilesAfterFlip on a match', () => {
  it('launches one projectile per set bit, timed to hit when the enemy dies', () => {
    let state = { game: gameWith([{}]), playerProjectiles: createPlayerProjectiles(1) };
    state = flip(state.game, state.playerProjectiles, 0);
    state.game = advance(state.game, 50);
    state = flip(state.game, state.playerProjectiles, 1);

    expect(state.playerProjectiles.fired.map((p) => p.address.bit).sort()).toEqual([0, 1]);
    for (const projectile of state.playerProjectiles.fired) {
      expect(projectile.matchedAtMs).toBe(50);
      expect(projectile.hitAtMs).toBe(50 + 400);
    }
  });

  it('starts each fired projectile from the height it was loaded at when the match happened', () => {
    let state = { game: gameWith([{}]), playerProjectiles: createPlayerProjectiles(1) };
    state = flip(state.game, state.playerProjectiles, 0);
    state.game = advance(state.game, RISE_MS);
    state = flip(state.game, state.playerProjectiles, 1);
    const startHeights = Object.fromEntries(
      state.playerProjectiles.fired.map((p) => [p.address.bit, p.startHeight]),
    );

    expect(startHeights).toEqual({ 0: 1, 1: 0 });
  });

  it('empties the matched slots instead of sinking them', () => {
    let state = { game: gameWith([{}]), playerProjectiles: createPlayerProjectiles(1) };
    state = flip(state.game, state.playerProjectiles, 0);
    state = flip(state.game, state.playerProjectiles, 1);

    for (const projectile of state.playerProjectiles.loaded[0]!) {
      expect(loadedProjectileHeight(projectile, state.game.elapsedMs)).toBe(0);
    }
  });

  it('launches nothing when the delay is zero', () => {
    let state = { game: gameWith([{}], 0), playerProjectiles: createPlayerProjectiles(1) };
    state = flip(state.game, state.playerProjectiles, 0);
    state = flip(state.game, state.playerProjectiles, 1);

    expect(state.game.score).toBe(1);
    expect(state.playerProjectiles.fired).toEqual([]);
  });

  it('drops projectiles once their enemy is gone', () => {
    let state = { game: gameWith([{}]), playerProjectiles: createPlayerProjectiles(1) };
    state = flip(state.game, state.playerProjectiles, 0);
    state = flip(state.game, state.playerProjectiles, 1);
    const afterDeath = advance(state.game, 400);

    expect(afterDeath.enemies).toEqual([]);
    expect(withoutLandedPlayerProjectiles(state.playerProjectiles, afterDeath).fired).toEqual([]);
  });
});

describe('firedProjectilePosition', () => {
  const projectile: FiredPlayerProjectile = {
    enemyId: 0,
    address: { byte: 0, bit: 0 },
    startHeight: 0.5,
    matchedAtMs: 1000,
    hitAtMs: 1400,
  };
  const start = { x: 10, y: 500 };
  const aligned = { x: 200, y: 480 };
  const target = { x: 200, y: 100 };
  const at = (ms: number) => firedProjectilePosition(projectile, ms, start, aligned, target);
  const alignedAtMs = 1000 + 400 * ALIGN_FRACTION;

  it('starts where the loaded projectile was at the match', () => {
    expect(at(1000)).toEqual(start);
  });

  it('arrives under the enemy exactly when the align phase ends', () => {
    expect(at(alignedAtMs)).toEqual(aligned);
  });

  it('decelerates while aligning', () => {
    const firstHalf = at(1000 + 80).x - start.x;
    const secondHalf = aligned.x - at(1000 + 80).x;

    expect(firstHalf).toBeGreaterThan(secondHalf);
  });

  it('accelerates upwards from a standstill', () => {
    const flightMs = 1400 - alignedAtMs;
    const firstHalf = aligned.y - at(alignedAtMs + flightMs / 2).y;
    const secondHalf = at(alignedAtMs + flightMs / 2).y - target.y;

    expect(at(alignedAtMs + 1).x).toBe(target.x);
    expect(secondHalf).toBeCloseTo(firstHalf * 3);
  });

  it('hits the target exactly at the hit time', () => {
    expect(at(1400)).toEqual(target);
  });
});
