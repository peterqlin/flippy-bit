import { useCallback, useEffect, useState } from 'react';
import type { GameMode } from '../engine/types';
import type { KeyboardScheme } from '../input/types';
import { useKeyboardInput } from '../input/useKeyboardInput';
import { loadHighScore, saveHighScore } from '../persistence/highScore';
import { Hud } from './Hud';
import { Playfield } from './Playfield';
import { Register } from './Register';
import { useGame } from './useGame';

interface GameScreenProps {
  mode: GameMode;
  scheme: KeyboardScheme;
}

export function GameScreen({ mode, scheme }: GameScreenProps) {
  const { state, flip, restart } = useGame(mode);
  const [savedHighScore, setSavedHighScore] = useState(() => loadHighScore(mode.id));
  const highScore = Math.max(savedHighScore, state.score);
  const isOver = state.status === 'over';

  useKeyboardInput(scheme, flip);

  useEffect(() => {
    if (isOver) saveHighScore(mode.id, highScore);
  }, [isOver, highScore, mode.id]);

  const playAgain = useCallback(() => {
    setSavedHighScore(highScore);
    restart();
  }, [highScore, restart]);

  useEffect(() => {
    if (!isOver) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Enter') playAgain();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOver, playAgain]);

  return (
    <main className="game">
      <Hud score={state.score} lives={state.lives} highScore={highScore} />
      <Playfield enemies={state.enemies} />
      <Register value={state.register} scheme={scheme} onFlip={flip} />
      {isOver && (
        <div className="overlay">
          <h2>Game over</h2>
          <p>Score {state.score}</p>
          <button type="button" className="primary" onClick={playAgain}>
            Play again
          </button>
        </div>
      )}
    </main>
  );
}
