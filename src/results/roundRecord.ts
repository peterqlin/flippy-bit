import { isBitSet, withBitFlipped, type BitAddress } from '../engine/bytes';
import type { Enemy, GameState } from '../engine/types';

/** A flip made while an unmatched enemy was on screen, judged against the priority enemy. */
export interface JudgedFlip {
  atMs: number;
  isMistake: boolean;
}

export interface Kill {
  atMs: number;
  /** The player matched some other enemy while the priority enemy was still unmatched. */
  isOutOfOrder: boolean;
}

/** What the player did during one run, timed by the game clock. */
export interface RoundRecord {
  judgedFlips: JudgedFlip[];
  kills: Kill[];
}

export function createRoundRecord(): RoundRecord {
  return { judgedFlips: [], kills: [] };
}

/** The unmatched enemy that will reach the player soonest. */
export function priorityEnemy(state: GameState): Enemy | undefined {
  let soonest: Enemy | undefined;
  for (const enemy of state.enemies) {
    if (enemy.matchedAtMs !== null) continue;
    if (!soonest || secondsToArrival(enemy) < secondsToArrival(soonest)) soonest = enemy;
  }
  return soonest;
}

export function roundRecordAfterFlip(
  record: RoundRecord,
  before: GameState,
  address: BitAddress,
  after: GameState,
): RoundRecord {
  if (after === before) return record;
  const priority = priorityEnemy(before);
  if (!priority) return record;

  const flipped = withBitFlipped(before.register, address);
  const judgedFlip = {
    atMs: before.elapsedMs,
    isMistake: isBitSet(flipped, address) !== isBitSet(priority.target, address),
  };
  const matched = newlyMatchedEnemy(before, after);
  const kills = matched
    ? [
        ...record.kills,
        { atMs: before.elapsedMs, isOutOfOrder: !before.mode.matches(flipped, priority.target) },
      ]
    : record.kills;
  return { judgedFlips: [...record.judgedFlips, judgedFlip], kills };
}

function secondsToArrival(enemy: Enemy): number {
  return (1 - enemy.progress) / enemy.speed;
}

/** With no destruction delay the matched enemy is already gone from `after`. */
function newlyMatchedEnemy(before: GameState, after: GameState): Enemy | undefined {
  return before.enemies.find((enemy) => {
    if (enemy.matchedAtMs !== null) return false;
    const later = after.enemies.find(({ id }) => id === enemy.id);
    return !later || later.matchedAtMs !== null;
  });
}
