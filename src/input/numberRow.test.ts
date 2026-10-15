import { describe, expect, it } from 'vitest';
import { numberRow } from './numberRow';

describe('numberRow', () => {
  it('maps 1 to the most significant bit and 8 to the least', () => {
    expect(numberRow.addressForKey('1')).toEqual({ byte: 0, bit: 7 });
    expect(numberRow.addressForKey('8')).toEqual({ byte: 0, bit: 0 });
  });

  it('ignores unmapped keys', () => {
    expect(numberRow.addressForKey('9')).toBeNull();
    expect(numberRow.addressForKey('a')).toBeNull();
  });

  it('round-trips addresses back to keys', () => {
    expect(numberRow.keyForAddress({ byte: 0, bit: 7 })).toBe('1');
    expect(numberRow.keyForAddress({ byte: 1, bit: 7 })).toBeNull();
  });
});
