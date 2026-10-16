import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import type { BitAddress } from '../engine/bytes';
import { createGame, flipBit, step } from '../engine/game';
import type { GameMode, GameState } from '../engine/types';
import { explosionsAfterFlip, explosionsAfterStep, type Explosion } from './explosions';
import {
  playerProjectilesAfterFlip,
  createPlayerProjectiles,
  withoutLandedPlayerProjectiles,
  type PlayerProjectiles,
} from './playerProjectiles';

/** Caps a single step so returning to a backgrounded tab doesn't teleport enemies onto the player. */
const MAX_FRAME_MS = 100;

interface Snapshot {
  game: GameState;
  playerProjectiles: PlayerProjectiles;
  explosions: Explosion[];
}

function startingSnapshot(mode: GameMode): Snapshot {
  return {
    game: createGame(mode),
    playerProjectiles: createPlayerProjectiles(mode.registerBytes),
    explosions: [],
  };
}

function createGameStore(mode: GameMode) {
  let snapshot = startingSnapshot(mode);
  const listeners = new Set<() => void>();

  function update(next: Snapshot) {
    if (
      next.game === snapshot.game &&
      next.playerProjectiles === snapshot.playerProjectiles &&
      next.explosions === snapshot.explosions
    )
      return;
    snapshot = next;
    listeners.forEach((listener) => listener());
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    tick(dtMs: number) {
      const game = step(snapshot.game, dtMs, Math.random);
      update({
        game,
        playerProjectiles: withoutLandedPlayerProjectiles(snapshot.playerProjectiles, game),
        explosions: explosionsAfterStep(snapshot.explosions, snapshot.game, game, Math.random),
      });
    },
    flip(address: BitAddress) {
      const game = flipBit(snapshot.game, address);
      update({
        game,
        playerProjectiles: playerProjectilesAfterFlip(
          snapshot.playerProjectiles,
          snapshot.game,
          address,
          game,
        ),
        explosions: explosionsAfterFlip(snapshot.explosions, snapshot.game, game, Math.random),
      });
    },
    restart: () => update(startingSnapshot(mode)),
  };
}

export function useGame(mode: GameMode) {
  const [store] = useState(() => createGameStore(mode));
  const { game, playerProjectiles, explosions } = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
  );

  useEffect(() => {
    let frame = 0;
    let previous = performance.now();
    function loop(now: number) {
      store.tick(Math.min(now - previous, MAX_FRAME_MS));
      previous = now;
      frame = requestAnimationFrame(loop);
    }
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [store]);

  const flip = useCallback((address: BitAddress) => store.flip(address), [store]);

  return { state: game, playerProjectiles, explosions, flip, restart: store.restart };
}
