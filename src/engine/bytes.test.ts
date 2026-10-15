import { describe, expect, it } from 'vitest';
import { bytesEqual, isBitSet, toHex, withBitFlipped } from './bytes';

describe('bytes', () => {
  it('flips a bit without mutating the original', () => {
    const original = Uint8Array.of(0b0000_0001);
    const flipped = withBitFlipped(original, { byte: 0, bit: 7 });

    expect(Array.from(flipped)).toEqual([0b1000_0001]);
    expect(Array.from(original)).toEqual([0b0000_0001]);
  });

  it('rejects addresses outside the value', () => {
    expect(() => withBitFlipped(new Uint8Array(1), { byte: 1, bit: 0 })).toThrow(RangeError);
    expect(() => withBitFlipped(new Uint8Array(1), { byte: 0, bit: 8 })).toThrow(RangeError);
  });

  it('reads individual bits', () => {
    expect(isBitSet(Uint8Array.of(0b100), { byte: 0, bit: 2 })).toBe(true);
    expect(isBitSet(Uint8Array.of(0b100), { byte: 0, bit: 1 })).toBe(false);
  });

  it('compares by length and content', () => {
    expect(bytesEqual(Uint8Array.of(1, 2), Uint8Array.of(1, 2))).toBe(true);
    expect(bytesEqual(Uint8Array.of(1), Uint8Array.of(1, 0))).toBe(false);
  });

  it('formats multi-byte values as hex', () => {
    expect(toHex(Uint8Array.of(0x0f, 0xa0))).toBe('0FA0');
  });
});
