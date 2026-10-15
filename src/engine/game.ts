import { isZero, withBitFlipped, type BitAddress } from './bytes';
import type { Enemy, GameMode, GameState, Random } from './types';

const SPAWN_MARGIN = 0.1;

export function createGame(mode: GameMode): GameState {
  return {
    mode,
    status: 'playing',
    register: new Uint8Array(mode.registerBytes),
    enemies: [],
    elapsedMs: 0,
    msUntilNextSpawn: 0,
    nextEnemyId: 0,
    lives: mode.config.lives,
    score: 0,
  };
}

export function flipBit(state: GameState, address: BitAddress): GameState {
  if (state.status === 'over') return state;
  const flipped = { ...state, register: withBitFlipped(state.register, address) };
  return destroyDueEnemies(matchOldestEnemy(flipped));
}

export function step(state: GameState, dtMs: number, random: Random): GameState {
  if (state.status === 'over') return state;
  const distance = (state.mode.config.enemySpeed * dtMs) / 1000;
  const advanced: GameState = {
    ...state,
    elapsedMs: state.elapsedMs + dtMs,
    enemies: state.enemies.map((enemy) => ({ ...enemy, progress: enemy.progress + distance })),
  };
  return spawnEnemies(handleArrivals(destroyDueEnemies(advanced)), dtMs, random);
}

function matchOldestEnemy(state: GameState): GameState {
  if (isZero(state.register)) return state;
  const match = state.enemies.find(
    (enemy) => enemy.matchedAtMs === null && state.mode.matches(state.register, enemy.target),
  );
  if (!match) return state;
  return {
    ...state,
    register: new Uint8Array(state.register.length),
    enemies: state.enemies.map((enemy) =>
      enemy === match ? { ...enemy, matchedAtMs: state.elapsedMs } : enemy,
    ),
  };
}

function destroyDueEnemies(state: GameState): GameState {
  const isDue = (enemy: Enemy) =>
    enemy.matchedAtMs !== null &&
    state.elapsedMs - enemy.matchedAtMs >= state.mode.config.destructionDelayMs;
  const survivors = state.enemies.filter((enemy) => !isDue(enemy));
  const destroyedCount = state.enemies.length - survivors.length;
  if (destroyedCount === 0) return state;
  return { ...state, enemies: survivors, score: state.score + destroyedCount };
}

function handleArrivals(state: GameState): GameState {
  const remaining = state.enemies.filter((enemy) => enemy.progress < 1);
  const arrivedCount = state.enemies.length - remaining.length;
  if (arrivedCount === 0) return state;
  const lives = Math.max(0, state.lives - arrivedCount);
  return { ...state, enemies: remaining, lives, status: lives === 0 ? 'over' : 'playing' };
}

function spawnEnemies(state: GameState, dtMs: number, random: Random): GameState {
  if (state.status === 'over') return state;
  let next = { ...state, msUntilNextSpawn: state.msUntilNextSpawn - dtMs };
  while (next.msUntilNextSpawn <= 0) {
    next = {
      ...next,
      enemies: [...next.enemies, createEnemy(next, random)],
      nextEnemyId: next.nextEnemyId + 1,
      msUntilNextSpawn: next.msUntilNextSpawn + next.mode.config.spawnIntervalMs,
    };
  }
  return next;
}

function createEnemy(state: GameState, random: Random): Enemy {
  const target = state.mode.randomTarget(random);
  return {
    id: state.nextEnemyId,
    target,
    label: state.mode.formatLabel(target),
    x: SPAWN_MARGIN + random() * (1 - 2 * SPAWN_MARGIN),
    progress: 0,
    matchedAtMs: null,
  };
}
