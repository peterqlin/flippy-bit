import { useEffect } from 'react';

const PLAY_KEYS = new Set(['Enter', ' ']);

/** Starts a game on Enter or Space while `enabled`, in place of clicking the screen's play button. */
export function usePlayKeys(onPlay: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (!PLAY_KEYS.has(event.key)) return;
      event.preventDefault();
      onPlay();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPlay, enabled]);
}
