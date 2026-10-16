import { useCallback, useEffect, useState } from 'react';
import { loadMuted, saveMuted } from '../persistence/muted';
import { setSoundEffectsMuted } from './soundEffects';

const MUTE_KEY = 'm';

export function useMute() {
  const [muted, setMuted] = useState(loadMuted);
  const toggleMuted = useCallback(() => setMuted((current) => !current), []);

  useEffect(() => {
    setSoundEffectsMuted(muted);
    saveMuted(muted);
  }, [muted]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key.toLowerCase() === MUTE_KEY) toggleMuted();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleMuted]);

  return { muted, toggleMuted };
}
