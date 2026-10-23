import { describe, expect, it } from 'vitest';
import { createGame, startGame, flipBit, step } from '../engine/game';
import type { Enemy, GameState } from '../engine/types';
import { hex8 } from '../modes/hex8';
import {
  EXPLOSION_MS,
  explosionProgress,
  explosionsAfterFlip,
  explosionsAfterStep,
  type Explosion,
} from './explosions';

const fixedRandom = () => 0.5;

function gameWith(enemies: Partial<Enemy>[], destructionDelayMs = 400): GameState {
  const mode = {
    ...hex8,
    config: { ...hex8.config, destructionDelayMs, spawnIntervalMs: Infinity },
  };
  return {
    ...startGame(createGame(mode)),
    msUntilNextSpawn: Infinity,
    enemies: enemies.map((enemy, id) => ({
      id,
      target: Uint8Array.of(0x01),
      label: '01',
      x: 0.3,
      progress: 0,
      speed: 0.1,
      matchedAtMs: null,
      ...enemy,
    })),
  };
}

function afterStep(game: GameState, ms: number, explosions: Explosion[] = []) {
  const next = step(game, ms, fixedRandom);
  return { game: next, explosions: explosionsAfterStep(explosions, game, next, fixedRandom) };
}

function matchFirstEnemy(game: GameState) {
  const next = flipBit(game, { byte: 0, bit: 0 });
  return { game: next, explosions: explosionsAfterFlip([], game, next, fixedRandom) };
}

describe('explosionsAfterStep', () => {
  it('explodes a matched enemy where and when its destruction delay runs out', () => {
    const matched = matchFirstEnemy(gameWith([{ progress: 0.2 }])).game;
    const { explosions } = afterStep(matched, 500);

    expect(explosions).toEqual([
      {
        enemyId: 0,
        label: '01',
        x: 0.3,
        progress: 0.2 + 0.1 * 0.4,
        startedAtMs: 400,
        rotationRad: Math.PI,
      },
    ]);
  });

  it('leaves no explosion before the delay runs out', () => {
    const matched = matchFirstEnemy(gameWith([{}])).game;

    expect(afterStep(matched, 399).explosions).toEqual([]);
  });

  it('leaves no explosion when an enemy reaches the player', () => {
    const unmatched = gameWith([{ progress: 0.99 }]);
    const matched = matchFirstEnemy(gameWith([{ progress: 0.99 }], 1000)).game;

    expect(afterStep(unmatched, 200).explosions).toEqual([]);
    expect(afterStep(matched, 200).explosions).toEqual([]);
  });

  it('burns out after EXPLOSION_MS', () => {
    const matched = matchFirstEnemy(gameWith([{}])).game;
    const exploded = afterStep(matched, 400);
    const burning = afterStep(exploded.game, EXPLOSION_MS - 1, exploded.explosions);
    const burntOut = afterStep(burning.game, 1, burning.explosions);

    expect(burning.explosions).toHaveLength(1);
    expect(burntOut.explosions).toEqual([]);
  });

  it('keeps the same list when nothing changes', () => {
    const game = gameWith([{}]);
    const explosions: Explosion[] = [];

    expect(afterStep(game, 16, explosions).explosions).toBe(explosions);
  });
});

describe('explosionsAfterFlip', () => {
  it('explodes an instantly destroyed enemy where it stands', () => {
    const game = step(gameWith([{ progress: 0.5 }], 0), 100, fixedRandom);

    expect(matchFirstEnemy(game).explosions).toEqual([
      { enemyId: 0, label: '01', x: 0.3, progress: 0.51, startedAtMs: 100, rotationRad: Math.PI },
    ]);
  });

  it('leaves no explosion while a matched enemy waits out its delay', () => {
    expect(matchFirstEnemy(gameWith([{}])).explosions).toEqual([]);
  });
});

describe('explosionProgress', () => {
  const explosion: Explosion = {
    enemyId: 0,
    label: '01',
    x: 0,
    progress: 0,
    startedAtMs: 1000,
    rotationRad: 0,
  };

  it('runs from 0 to 1 over EXPLOSION_MS', () => {
    expect(explosionProgress(explosion, 1000)).toBe(0);
    expect(explosionProgress(explosion, 1000 + EXPLOSION_MS / 2)).toBe(0.5);
    expect(explosionProgress(explosion, 1000 + EXPLOSION_MS * 2)).toBe(1);
  });
});
