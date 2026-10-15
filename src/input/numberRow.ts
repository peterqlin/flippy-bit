import { BITS_PER_BYTE } from '../engine/bytes';
import type { KeyboardScheme } from './types';

const KEYS_MSB_FIRST = ['1', '2', '3', '4', '5', '6', '7', '8'];

export const numberRow: KeyboardScheme = {
  id: 'number-row',
  name: 'Number row (1–8)',
  addressForKey(key) {
    const position = KEYS_MSB_FIRST.indexOf(key);
    return position === -1 ? null : { byte: 0, bit: BITS_PER_BYTE - 1 - position };
  },
  keyForAddress({ byte, bit }) {
    return byte === 0 ? (KEYS_MSB_FIRST[BITS_PER_BYTE - 1 - bit] ?? null) : null;
  },
};
