import { useEffect } from 'react';

const PLAY_KEY = ' ';

/** Starts a game on Space while `enabled`, in place of clicking the start button. */
export function usePlayKeys(onPlay: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== PLAY_KEY) return;
      event.preventDefault();
      onPlay();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPlay, enabled]);
}
