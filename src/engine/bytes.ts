export const BITS_PER_BYTE = 8;

export interface BitAddress {
  byte: number;
  bit: number;
}

export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export function isZero(bytes: Uint8Array): boolean {
  return bytes.every((value) => value === 0);
}

export function isBitSet(bytes: Uint8Array, { byte, bit }: BitAddress): boolean {
  return ((bytes[byte] ?? 0) & (1 << bit)) !== 0;
}

export function withBitFlipped(bytes: Uint8Array, { byte, bit }: BitAddress): Uint8Array {
  if (byte < 0 || byte >= bytes.length || bit < 0 || bit >= BITS_PER_BYTE) {
    throw new RangeError(`Bit ${byte}:${bit} is outside a ${bytes.length}-byte value`);
  }
  const flipped = bytes.slice();
  flipped[byte] = (flipped[byte] ?? 0) ^ (1 << bit);
  return flipped;
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0').toUpperCase()).join('');
}
