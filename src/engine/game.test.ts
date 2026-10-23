import { describe, expect, it } from 'vitest';
import { hex8 } from '../modes/hex8';
import { createGame, startGame, difficultyMultiplier, flipBit, step } from './game';
import type { Enemy, GameConfig, GameState } from './types';

const NEVER_SPAWN = Number.POSITIVE_INFINITY;
const fixedRandom = () => 0.5;

function gameWith(enemies: Partial<Enemy>[], config: Partial<GameConfig> = {}): GameState {
  const mode = { ...hex8, config: { ...hex8.config, spawnIntervalMs: NEVER_SPAWN, ...config } };
  return {
    ...startGame(createGame(mode)),
    msUntilNextSpawn: NEVER_SPAWN,
    enemies: enemies.map((enemy, id) => ({
      id,
      target: Uint8Array.of(0x01),
      label: '01',
      x: 0.5,
      progress: 0,
      speed: 0.1,
      matchedAtMs: null,
      ...enemy,
    })),
  };
}

function enter(state: GameState, value: number): GameState {
  let next = state;
  for (let bit = 0; bit < 8; bit++) {
    if (value & (1 << bit)) next = flipBit(next, { byte: 0, bit });
  }
  return next;
}

describe('matching', () => {
  it('matches the oldest enemy when several share a label', () => {
    const state = enter(gameWith([{}, {}], { destructionDelayMs: 100 }), 0x01);

    expect(state.enemies.map((enemy) => enemy.matchedAtMs)).toEqual([0, null]);
  });

  it('matches an older enemy even if a newer one is closer', () => {
    const state = enter(
      gameWith(
        [
          { target: Uint8Array.of(0x05), progress: 0.1 },
          { target: Uint8Array.of(0x05), progress: 0.9 },
        ],
        { destructionDelayMs: 100 },
      ),
      0x05,
    );

    expect(state.enemies[0]?.matchedAtMs).toBe(0);
    expect(state.enemies[1]?.matchedAtMs).toBeNull();
  });

  it('skips enemies that are already matched', () => {
    const once = enter(gameWith([{}, {}], { destructionDelayMs: 100 }), 0x01);
    const twice = enter(once, 0x01);

    expect(twice.enemies.map((enemy) => enemy.matchedAtMs)).toEqual([0, 0]);
  });

  it('clears the register on a match', () => {
    const state = enter(gameWith([{ target: Uint8Array.of(0x03) }]), 0x03);

    expect(Array.from(state.register)).toEqual([0]);
  });

  it('keeps the register when nothing matches', () => {
    const state = enter(gameWith([{ target: Uint8Array.of(0x03) }]), 0x02);

    expect(Array.from(state.register)).toEqual([0x02]);
  });
});

describe('destruction', () => {
  it('destroys immediately when the delay is zero', () => {
    const state = enter(gameWith([{}], { destructionDelayMs: 0 }), 0x01);

    expect(state.enemies).toEqual([]);
    expect(state.score).toBe(1);
  });

  it('destroys a matched enemy only after the delay', () => {
    const matched = enter(gameWith([{}], { destructionDelayMs: 500 }), 0x01);

    expect(step(matched, 499, fixedRandom).enemies).toHaveLength(1);
    expect(step(matched, 500, fixedRandom).score).toBe(1);
  });

  it('lets a matched enemy reach the player before its delay ends', () => {
    const matched = enter(
      gameWith([{ progress: 0.99, speed: 0.1 }], { destructionDelayMs: 1000 }),
      0x01,
    );
    const after = step(matched, 200, fixedRandom);

    expect(after.score).toBe(0);
    expect(after.status).toBe('over');
  });
});

describe('lives', () => {
  it('loses a life when an enemy reaches the player', () => {
    const state = step(gameWith([{ progress: 0.99 }], { lives: 3 }), 1000, fixedRandom);

    expect(state.lives).toBe(2);
    expect(state.status).toBe('playing');
    expect(state.enemies).toEqual([]);
  });

  it('ends the game when lives run out', () => {
    const state = step(gameWith([{ progress: 0.99 }], { lives: 1 }), 1000, fixedRandom);

    expect(state.status).toBe('over');
  });

  it('ignores input after the game is over', () => {
    const over = step(gameWith([{ progress: 0.99 }]), 1000, fixedRandom);

    expect(flipBit(over, { byte: 0, bit: 0 })).toBe(over);
  });
});

describe('starting', () => {
  it('holds still and ignores input until started', () => {
    const ready = createGame(hex8);

    expect(step(ready, 1000, fixedRandom)).toBe(ready);
    expect(flipBit(ready, { byte: 0, bit: 0 })).toBe(ready);
  });

  it('starts playing from ready', () => {
    expect(startGame(createGame(hex8)).status).toBe('playing');
  });
});

describe('spawning', () => {
  it('spawns once per interval', () => {
    const state = startGame(
      createGame({ ...hex8, config: { ...hex8.config, spawnIntervalMs: 1000 } }),
    );

    expect(step(state, 0, fixedRandom).enemies).toHaveLength(1);
    expect(step(state, 2500, fixedRandom).enemies).toHaveLength(3);
  });
});

describe('difficulty', () => {
  const config = { ...hex8.config, spawnIntervalMs: 1000, enemyFallMs: 10_000 };
  const atScore = (score: number) => ({ ...startGame(createGame({ ...hex8, config })), score });

  it('doubles at the configured score and ramps linearly', () => {
    const doubling = { ...config, difficultyDoublesAtScore: 60 };

    expect(difficultyMultiplier(doubling, 0)).toBe(1);
    expect(difficultyMultiplier(doubling, 30)).toBe(1.5);
    expect(difficultyMultiplier(doubling, 60)).toBe(2);
  });

  it('spawns faster enemies as the score rises', () => {
    const fresh = step(atScore(0), 0, fixedRandom);
    const doubled = step(atScore(config.difficultyDoublesAtScore), 0, fixedRandom);

    expect(fresh.enemies[0]?.speed).toBeCloseTo(0.1);
    expect(doubled.enemies[0]?.speed).toBeCloseTo(0.2);
  });

  it('spawns more often as the score rises', () => {
    const fresh = step(atScore(0), 2400, fixedRandom);
    const doubled = step(atScore(config.difficultyDoublesAtScore), 2400, fixedRandom);

    expect(fresh.enemies).toHaveLength(3);
    expect(doubled.enemies).toHaveLength(5);
  });
});
