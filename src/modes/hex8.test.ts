import { describe, expect, it } from 'vitest';
import { hex8 } from './hex8';

describe('hex8', () => {
  it('never generates a zero target', () => {
    expect(Array.from(hex8.randomTarget(() => 0))).toEqual([0x01]);
    expect(Array.from(hex8.randomTarget(() => 0.999999))).toEqual([0xff]);
  });

  it('labels targets as two uppercase hex digits', () => {
    expect(hex8.formatLabel(Uint8Array.of(0x0a))).toBe('0A');
  });
});
