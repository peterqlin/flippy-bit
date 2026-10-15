import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import type { BitAddress } from '../engine/bytes';
import { createGame, flipBit, step } from '../engine/game';
import type { GameMode, GameState } from '../engine/types';

/** Caps a single step so returning to a backgrounded tab doesn't teleport enemies onto the player. */
const MAX_FRAME_MS = 100;

function createGameStore(mode: GameMode) {
  let state = createGame(mode);
  const listeners = new Set<() => void>();

  function update(next: GameState) {
    if (next === state) return;
    state = next;
    listeners.forEach((listener) => listener());
  }

  return {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    tick: (dtMs: number) => update(step(state, dtMs, Math.random)),
    flip: (address: BitAddress) => update(flipBit(state, address)),
    restart: () => update(createGame(mode)),
  };
}

export function useGame(mode: GameMode) {
  const [store] = useState(() => createGameStore(mode));
  const state = useSyncExternalStore(store.subscribe, store.getState);

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

  return { state, flip, restart: store.restart };
}
