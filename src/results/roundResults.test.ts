import { describe, expect, it } from 'vitest';
import type { RoundRecord } from './roundRecord';
import { summarizeRound } from './roundResults';

const kill = (atMs: number, isOutOfOrder = false) => ({ atMs, isOutOfOrder });
const flip = (atMs: number, isMistake = false) => ({ atMs, isMistake });

describe('summarizeRound', () => {
  it('totals kills, mistakes and out-of-order kills', () => {
    const record: RoundRecord = {
      judgedFlips: [flip(100), flip(200, true), flip(300), flip(400)],
      kills: [kill(400), kill(900, true), kill(1500)],
    };

    const results = summarizeRound(record, 30_000);

    expect(results).toMatchObject({
      kills: 3,
      killsPerMinute: 6,
      judgedFlips: 4,
      mistakes: 1,
      accuracy: 0.75,
      outOfOrderKills: 1,
    });
  });

  it('has no accuracy when no flip was judged', () => {
    expect(summarizeRound({ judgedFlips: [], kills: [] }, 2000).accuracy).toBeNull();
  });

  it('plots one point per second, ending at the moment the run ended', () => {
    const results = summarizeRound({ judgedFlips: [], kills: [] }, 2500);

    expect(results.timeline.map((point) => point.atMs)).toEqual([1000, 2000, 2500]);
  });

  it('averages the kill rate over a trailing window', () => {
    const record: RoundRecord = { judgedFlips: [], kills: [kill(0), kill(500), kill(12_000)] };

    const rates = summarizeRound(record, 15_000).timeline.map((point) => point.killsPerMinute);

    expect(rates[0]).toBe(120);
    expect(rates[9]).toBe(12);
    expect(rates[10]).toBe(0);
    expect(rates[12]).toBe(6);
  });

  it('buckets mistakes into the second they happened in', () => {
    const record: RoundRecord = {
      judgedFlips: [flip(200, true), flip(999, true), flip(1000, true), flip(1500)],
      kills: [],
    };

    const mistakes = summarizeRound(record, 2000).timeline.map((point) => point.mistakes);

    expect(mistakes).toEqual([2, 1]);
  });
});
