import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import type { BitAddress } from '../engine/bytes';
import { createGame, flipBit, step } from '../engine/game';
import type { GameMode, GameState } from '../engine/types';
import { afterFlip, createCircles, withoutLandedProjectiles, type Circles } from './circles';

/** Caps a single step so returning to a backgrounded tab doesn't teleport enemies onto the player. */
const MAX_FRAME_MS = 100;

interface Snapshot {
  game: GameState;
  circles: Circles;
}

function startingSnapshot(mode: GameMode): Snapshot {
  return { game: createGame(mode), circles: createCircles(mode.registerBytes) };
}

function createGameStore(mode: GameMode) {
  let snapshot = startingSnapshot(mode);
  const listeners = new Set<() => void>();

  function update(next: Snapshot) {
    if (next.game === snapshot.game && next.circles === snapshot.circles) return;
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
      update({ game, circles: withoutLandedProjectiles(snapshot.circles, game) });
    },
    flip(address: BitAddress) {
      const game = flipBit(snapshot.game, address);
      update({ game, circles: afterFlip(snapshot.circles, snapshot.game, address, game) });
    },
    restart: () => update(startingSnapshot(mode)),
  };
}

export function useGame(mode: GameMode) {
  const [store] = useState(() => createGameStore(mode));
  const { game, circles } = useSyncExternalStore(store.subscribe, store.getSnapshot);

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

  return { state: game, circles, flip, restart: store.restart };
}
