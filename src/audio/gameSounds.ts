import { isBitSet, type BitAddress } from '../engine/bytes';
import type { GameState } from '../engine/types';
import type { Explosion } from '../ui/explosions';
import type { SoundEffect } from './soundEffects';

export function soundsAfterFlip(
  before: GameState,
  address: BitAddress,
  after: GameState,
  explosionsBefore: Explosion[],
  explosionsAfter: Explosion[],
): SoundEffect[] {
  if (after === before) return [];
  const flip = isBitSet(before.register, address) ? 'bitCleared' : 'bitSet';
  return [flip, ...soundsAfterStep(explosionsBefore, explosionsAfter)];
}

export function soundsAfterStep(
  explosionsBefore: Explosion[],
  explosionsAfter: Explosion[],
): SoundEffect[] {
  return explosionsAfter
    .filter((explosion) => !explosionsBefore.includes(explosion))
    .map(() => 'explosion');
}
