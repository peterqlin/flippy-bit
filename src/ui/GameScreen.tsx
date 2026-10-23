import { useCallback, useEffect, useRef, useState } from 'react';
import { useMute } from '../audio/useMute';
import type { BitAddress } from '../engine/bytes';
import type { GameMode } from '../engine/types';
import type { KeyboardScheme } from '../input/types';
import { useKeyboardInput } from '../input/useKeyboardInput';
import { usePlayKeys } from '../input/usePlayKeys';
import type { DifficultyId } from '../modes/difficulties';
import { loadHighScore, saveHighScore } from '../persistence/highScore';
import { PlayerProjectileLayer } from './PlayerProjectileLayer';
import { Hud } from './Hud';
import { Playfield } from './Playfield';
import { Register } from './Register';
import { StartMenu } from './StartMenu';
import { useGame } from './useGame';

interface GameScreenProps {
  mode: GameMode;
  scheme: KeyboardScheme;
}

export function GameScreen({ mode, scheme }: GameScreenProps) {
  const { state, playerProjectiles, explosions, flip, start } = useGame(mode);
  const screenRef = useRef<HTMLElement>(null);
  const [savedHighScore, setSavedHighScore] = useState(() => loadHighScore(mode.id));
  const highScore = Math.max(savedHighScore, state.score);
  const [difficulty, setDifficulty] = useState<DifficultyId>('advanced');
  const isPlaying = state.status === 'playing';
  const isOver = state.status === 'over';
  const { muted, toggleMuted } = useMute();

  useEffect(() => {
    if (isOver) saveHighScore(mode.id, highScore);
  }, [isOver, highScore, mode.id]);

  const begin = useCallback(() => {
    setSavedHighScore(highScore);
    start();
  }, [highScore, start]);

  const flipOrBegin = useCallback(
    (address: BitAddress) => {
      if (!isPlaying) begin();
      flip(address);
    },
    [isPlaying, begin, flip],
  );

  useKeyboardInput(scheme, flipOrBegin);
  usePlayKeys(begin, !isPlaying);

  return (
    <main
      ref={screenRef}
      className="relative mx-auto flex h-dvh max-w-2xl flex-col px-3 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] select-none"
    >
      <Hud
        score={state.score}
        lives={state.lives}
        highScore={highScore}
        muted={muted}
        onToggleMuted={toggleMuted}
      />
      <Playfield enemies={state.enemies} explosions={explosions} nowMs={state.elapsedMs} />
      <Register value={state.register} scheme={scheme} onFlip={flipOrBegin} />
      <PlayerProjectileLayer
        game={state}
        playerProjectiles={playerProjectiles}
        containerRef={screenRef}
      />
      {!isPlaying && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
          <StartMenu
            finalScore={isOver ? state.score : null}
            difficulty={difficulty}
            onSelectDifficulty={setDifficulty}
            onStart={begin}
          />
        </div>
      )}
    </main>
  );
}
