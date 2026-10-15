import { useEffect } from 'react';
import type { BitAddress } from '../engine/bytes';
import type { KeyboardScheme } from './types';

export function useKeyboardInput(scheme: KeyboardScheme, onFlip: (address: BitAddress) => void) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      const address = scheme.addressForKey(event.key);
      if (!address) return;
      event.preventDefault();
      onFlip(address);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scheme, onFlip]);
}
