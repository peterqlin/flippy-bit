import type { RoundRecord } from './roundRecord';

/** Kill rate on the chart is averaged over this trailing window, so single kills don't spike it. */
export const KILL_RATE_WINDOW_MS = 10_000;
const MS_PER_MINUTE = 60_000;
const MS_PER_SECOND = 1000;

export interface TimelinePoint {
  atMs: number;
  killsPerMinute: number;
  /** Mistakes made in the second ending at `atMs`. */
  mistakes: number;
}

export interface RoundResults {
  durationMs: number;
  kills: number;
  killsPerMinute: number;
  judgedFlips: number;
  mistakes: number;
  /** Share of judged flips that weren't mistakes; null when no flip was judged. */
  accuracy: number | null;
  outOfOrderKills: number;
  /** One point per second of the run, the last one at the moment it ended. */
  timeline: TimelinePoint[];
}

export function summarizeRound(record: RoundRecord, durationMs: number): RoundResults {
  const mistakes = record.judgedFlips.filter((flip) => flip.isMistake).length;
  const judgedFlips = record.judgedFlips.length;
  return {
    durationMs,
    kills: record.kills.length,
    killsPerMinute: durationMs > 0 ? (record.kills.length * MS_PER_MINUTE) / durationMs : 0,
    judgedFlips,
    mistakes,
    accuracy: judgedFlips > 0 ? (judgedFlips - mistakes) / judgedFlips : null,
    outOfOrderKills: record.kills.filter((kill) => kill.isOutOfOrder).length,
    timeline: timeline(record, durationMs),
  };
}

function timeline(record: RoundRecord, durationMs: number): TimelinePoint[] {
  const seconds = Math.ceil(durationMs / MS_PER_SECOND);
  return Array.from({ length: seconds }, (_, index) => {
    const atMs = Math.min((index + 1) * MS_PER_SECOND, durationMs);
    const windowStartMs = Math.max(0, atMs - KILL_RATE_WINDOW_MS);
    const killsInWindow = record.kills.filter(
      (kill) => kill.atMs >= windowStartMs && kill.atMs < atMs,
    ).length;
    const secondStartMs = index * MS_PER_SECOND;
    return {
      atMs,
      killsPerMinute: (killsInWindow * MS_PER_MINUTE) / (atMs - windowStartMs),
      mistakes: record.judgedFlips.filter(
        (flip) => flip.isMistake && flip.atMs >= secondStartMs && flip.atMs < atMs,
      ).length,
    };
  });
}
