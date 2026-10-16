import { useCallback, useEffect, useRef, useState } from 'react';
import { useMute } from '../audio/useMute';
import type { GameMode } from '../engine/types';
import type { KeyboardScheme } from '../input/types';
import { useKeyboardInput } from '../input/useKeyboardInput';
import { usePlayKeys } from '../input/usePlayKeys';
import { loadHighScore, saveHighScore } from '../persistence/highScore';
import { primaryButton } from './buttonStyles';
import { PlayerProjectileLayer } from './PlayerProjectileLayer';
import { Hud } from './Hud';
import { Playfield } from './Playfield';
import { Register } from './Register';
import { useGame } from './useGame';

interface GameScreenProps {
  mode: GameMode;
  scheme: KeyboardScheme;
}

export function GameScreen({ mode, scheme }: GameScreenProps) {
  const { state, playerProjectiles, explosions, flip, restart } = useGame(mode);
  const screenRef = useRef<HTMLElement>(null);
  const [savedHighScore, setSavedHighScore] = useState(() => loadHighScore(mode.id));
  const highScore = Math.max(savedHighScore, state.score);
  const isOver = state.status === 'over';
  const { muted, toggleMuted } = useMute();

  useKeyboardInput(scheme, flip);

  useEffect(() => {
    if (isOver) saveHighScore(mode.id, highScore);
  }, [isOver, highScore, mode.id]);

  const playAgain = useCallback(() => {
    setSavedHighScore(highScore);
    restart();
  }, [highScore, restart]);

  usePlayKeys(playAgain, isOver);

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
      <Register value={state.register} scheme={scheme} onFlip={flip} />
      <PlayerProjectileLayer
        game={state}
        playerProjectiles={playerProjectiles}
        containerRef={screenRef}
      />
      {isOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-bg/85">
          <h2 className="text-3xl font-bold text-danger">Game over</h2>
          <p>Score {state.score}</p>
          <button type="button" className={primaryButton} onClick={playAgain}>
            Play again
          </button>
        </div>
      )}
    </main>
  );
}
