import type { BitAddress } from '../engine/bytes';

export interface KeyboardScheme {
  id: string;
  name: string;
  addressForKey(key: string): BitAddress | null;
}
