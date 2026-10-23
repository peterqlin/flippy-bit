import { describe, expect, it } from 'vitest';
import { createGame, startGame, flipBit } from '../engine/game';
import type { GameState } from '../engine/types';
import { hex8 } from '../modes/hex8';
import type { Explosion } from '../ui/explosions';
import { soundsAfterFlip, soundsAfterStep } from './gameSounds';

const lowestBit = { byte: 0, bit: 0 };

function flipLowestBit(game: GameState, explosionsAfter: Explosion[] = []) {
  return soundsAfterFlip(game, lowestBit, flipBit(game, lowestBit), [], explosionsAfter);
}

const explosion: Explosion = {
  enemyId: 0,
  label: '01',
  x: 0.5,
  progress: 0.5,
  startedAtMs: 0,
  rotationRad: 0,
};

describe('soundsAfterFlip', () => {
  it('plays the set sound when a bit turns on and the cleared sound when it turns off', () => {
    const game = startGame(createGame(hex8));

    expect(flipLowestBit(game)).toEqual(['bitSet']);
    expect(flipLowestBit(flipBit(game, lowestBit))).toEqual(['bitCleared']);
  });

  it('stays silent when the flip is ignored', () => {
    const over: GameState = { ...createGame(hex8), status: 'over' };

    expect(flipLowestBit(over)).toEqual([]);
  });

  it('adds an explosion for an instant kill', () => {
    expect(flipLowestBit(startGame(createGame(hex8)), [explosion])).toEqual([
      'bitSet',
      'explosion',
    ]);
  });
});

describe('soundsAfterStep', () => {
  it('plays one explosion per explosion that just started', () => {
    const second = { ...explosion, enemyId: 1 };

    expect(soundsAfterStep([explosion], [explosion, second])).toEqual(['explosion']);
    expect(soundsAfterStep([explosion], [])).toEqual([]);
  });
});
