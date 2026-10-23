import { describe, expect, it } from 'vitest';
import type { BitAddress } from '../engine/bytes';
import { createGame, flipBit, startGame } from '../engine/game';
import type { Enemy, GameState } from '../engine/types';
import { hex8 } from '../modes/hex8';
import {
  createRoundRecord,
  priorityEnemy,
  roundRecordAfterFlip,
  type RoundRecord,
} from './roundRecord';

function gameWith(enemies: Partial<Enemy>[], destructionDelayMs = 400): GameState {
  const mode = {
    ...hex8,
    config: { ...hex8.config, destructionDelayMs, spawnIntervalMs: Infinity },
  };
  return {
    ...startGame(createGame(mode)),
    msUntilNextSpawn: Infinity,
    elapsedMs: 5000,
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

function flipBits(game: GameState, bits: number[]) {
  let record: RoundRecord = createRoundRecord();
  let state = game;
  for (const bit of bits) {
    const address: BitAddress = { byte: 0, bit };
    const next = flipBit(state, address);
    record = roundRecordAfterFlip(record, state, address, next);
    state = next;
  }
  return { record, state };
}

describe('priorityEnemy', () => {
  it('picks the enemy that arrives soonest, not the closest', () => {
    const game = gameWith([
      { progress: 0.6, speed: 0.1 },
      { progress: 0.2, speed: 0.4 },
    ]);

    expect(priorityEnemy(game)?.id).toBe(1);
  });

  it('skips matched enemies', () => {
    const game = gameWith([{ progress: 0.9, matchedAtMs: 0 }, { progress: 0.1 }]);

    expect(priorityEnemy(game)?.id).toBe(1);
  });
});

describe('judged flips', () => {
  it('counts a flip away from the priority enemy as a mistake', () => {
    const { record } = flipBits(gameWith([{ target: Uint8Array.of(0x03) }]), [0, 7, 7]);

    expect(record.judgedFlips).toEqual([
      { atMs: 5000, isMistake: false },
      { atMs: 5000, isMistake: true },
      { atMs: 5000, isMistake: false },
    ]);
  });

  it('judges against the priority enemy even when the player is going for another', () => {
    const game = gameWith([
      { target: Uint8Array.of(0x01), progress: 0.9 },
      { target: Uint8Array.of(0x02), progress: 0.1 },
    ]);

    const { record } = flipBits(game, [1]);

    expect(record.judgedFlips).toEqual([{ atMs: 5000, isMistake: true }]);
  });

  it('ignores flips with no unmatched enemy on screen', () => {
    const { record } = flipBits(gameWith([]), [0, 1]);

    expect(record).toEqual(createRoundRecord());
  });

  it('ignores flips the game rejects', () => {
    const over = { ...gameWith([{}]), status: 'over' as const };

    const { record } = flipBits(over, [0]);

    expect(record).toEqual(createRoundRecord());
  });
});

describe('kills', () => {
  it('records matching the priority enemy as in order', () => {
    const { record } = flipBits(gameWith([{ progress: 0.9 }, { progress: 0.1 }]), [0]);

    expect(record.kills).toEqual([{ atMs: 5000, isOutOfOrder: false }]);
  });

  it('records matching another enemy as out of order', () => {
    const game = gameWith([
      { target: Uint8Array.of(0x01), progress: 0.1 },
      { target: Uint8Array.of(0x02), progress: 0.9 },
    ]);

    const { record } = flipBits(game, [0]);

    expect(record.kills).toEqual([{ atMs: 5000, isOutOfOrder: true }]);
  });

  it('counts the right value as in order when the game matches an older twin', () => {
    const game = gameWith([{ progress: 0.1 }, { progress: 0.9 }]);

    const { record, state } = flipBits(game, [0]);

    expect(state.enemies[0]?.matchedAtMs).toBe(5000);
    expect(record.kills).toEqual([{ atMs: 5000, isOutOfOrder: false }]);
  });

  it('records instant kills', () => {
    const { record, state } = flipBits(gameWith([{}], 0), [0]);

    expect(state.enemies).toEqual([]);
    expect(record.kills).toHaveLength(1);
  });
});
