import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toHex, type BitAddress } from '../engine/bytes';
import type { GameMode } from '../engine/types';
import type { KeyboardScheme } from '../input/types';
import { useKeyboardInput } from '../input/useKeyboardInput';
import { usePlayKeys } from '../input/usePlayKeys';
import { difficulties, withDifficulty, type DifficultyId } from '../modes/difficulties';
import { loadDifficulty, saveDifficulty } from '../persistence/difficulty';
import { loadHighScore, saveHighScore } from '../persistence/highScore';
import { summarizeRound } from '../results/roundResults';
import { PlayerProjectileLayer } from './PlayerProjectileLayer';
import { Hud } from './Hud';
import { Playfield } from './Playfield';
import { Register } from './Register';
import { StartMenu } from './StartMenu';
import { useGame } from './useGame';

/** Keeps bit presses mashed at the moment of death from skipping the results. */
const RESULTS_LOCKOUT_MS = 1000;

interface GameScreenProps {
  mode: GameMode;
  scheme: KeyboardScheme;
}

export function GameScreen({ mode, scheme }: GameScreenProps) {
  const { state, playerProjectiles, explosions, roundRecord, flip, start } = useGame(mode);
  const screenRef = useRef<HTMLElement>(null);
  const [difficulty, setDifficulty] = useState(loadDifficulty);
  const [runDifficulty, setRunDifficulty] = useState(difficulty);
  const [savedHighScores, setSavedHighScores] = useState(() => loadHighScores(mode.id));
  const runHighScore = Math.max(savedHighScores[runDifficulty], state.score);
  const isPlaying = state.status === 'playing';
  const isOver = state.status === 'over';
  const highScore =
    isOver && difficulty === runDifficulty ? runHighScore : savedHighScores[difficulty];

  const results = useMemo(
    () => (isOver ? summarizeRound(roundRecord, state.elapsedMs) : null),
    [isOver, roundRecord, state.elapsedMs],
  );
  const gameOverAtRef = useRef(Number.NEGATIVE_INFINITY);

  useEffect(() => {
    if (isOver) gameOverAtRef.current = performance.now();
  }, [isOver]);

  useEffect(() => {
    if (isOver) saveHighScore(mode.id, runDifficulty, runHighScore);
  }, [isOver, runHighScore, runDifficulty, mode.id]);

  const selectDifficulty = useCallback((id: DifficultyId) => {
    setDifficulty(id);
    saveDifficulty(id);
  }, []);

  const begin = useCallback(() => {
    setSavedHighScores((scores) => ({ ...scores, [runDifficulty]: runHighScore }));
    setRunDifficulty(difficulty);
    start(withDifficulty(mode, difficulty));
  }, [runDifficulty, runHighScore, difficulty, start, mode]);

  const flipOrBegin = useCallback(
    (address: BitAddress) => {
      if (isOver && performance.now() - gameOverAtRef.current < RESULTS_LOCKOUT_MS) return;
      if (!isPlaying) begin();
      flip(address);
    },
    [isOver, isPlaying, begin, flip],
  );

  useKeyboardInput(scheme, flipOrBegin);
  usePlayKeys(begin, !isPlaying);

  return (
    <main
      ref={screenRef}
      className="relative mx-auto flex h-dvh max-w-2xl flex-col px-3 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] select-none"
    >
      <Hud highScore={highScore} />
      <Playfield enemies={state.enemies} explosions={explosions} nowMs={state.elapsedMs} />
      <Register value={state.register} onFlip={flipOrBegin} />
      <footer className="flex items-center justify-between px-1 py-3 text-2xl">
        <span>{state.score}</span>
        <span className="text-accent">{toHex(state.register)}</span>
      </footer>
      <PlayerProjectileLayer
        game={state}
        playerProjectiles={playerProjectiles}
        containerRef={screenRef}
      />
      {!isPlaying && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
          <StartMenu
            results={results}
            difficulty={difficulty}
            onSelectDifficulty={selectDifficulty}
          />
        </div>
      )}
    </main>
  );
}

function loadHighScores(modeId: string): Record<DifficultyId, number> {
  return Object.fromEntries(
    difficulties.map(({ id }) => [id, loadHighScore(modeId, id)]),
  ) as Record<DifficultyId, number>;
}
