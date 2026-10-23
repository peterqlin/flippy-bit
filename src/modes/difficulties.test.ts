import { describe, expect, it } from 'vitest';
import { withDifficulty } from './difficulties';
import { hex8 } from './hex8';

describe('withDifficulty', () => {
  it('leaves the mode config alone on advanced', () => {
    expect(withDifficulty(hex8, 'advanced').config).toEqual(hex8.config);
  });

  it('halves starting speeds and the ramp on beginner', () => {
    const { config } = withDifficulty(hex8, 'beginner');
    expect(config.spawnIntervalMs).toBe(hex8.config.spawnIntervalMs * 2);
    expect(config.enemyFallMs).toBe(hex8.config.enemyFallMs * 2);
    expect(config.difficultyDoublesAtScore).toBe(hex8.config.difficultyDoublesAtScore * 2);
    expect(config.destructionDelayMs).toBe(hex8.config.destructionDelayMs);
  });
});
