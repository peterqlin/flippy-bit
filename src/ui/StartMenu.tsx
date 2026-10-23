import { difficulties, type DifficultyId } from '../modes/difficulties';
import { primaryButton } from './buttonStyles';

interface StartMenuProps {
  finalScore: number | null;
  difficulty: DifficultyId;
  onSelectDifficulty: (difficulty: DifficultyId) => void;
  onStart: () => void;
}

export function StartMenu({ finalScore, difficulty, onSelectDifficulty, onStart }: StartMenuProps) {
  return (
    <section className="pointer-events-auto flex w-full max-w-xs flex-col items-center gap-5 rounded-xl border border-line bg-panel/95 p-6 text-center shadow-lg">
      {finalScore === null ? (
        <h1 className="text-3xl font-bold text-accent">Flippy Bit</h1>
      ) : (
        <div>
          <h2 className="text-3xl font-bold text-danger">Game over</h2>
          <p>Score {finalScore}</p>
        </div>
      )}
      <fieldset className="w-full">
        <legend className="mx-auto mb-2 text-sm text-muted">Difficulty</legend>
        <div className="flex flex-wrap justify-center gap-2">
          {difficulties.map(({ id, name }) => {
            const selected = id === difficulty;
            return (
              <button
                key={id}
                type="button"
                className={`rounded-md border px-4 py-2 ${selected ? 'border-accent bg-accent/20 text-accent' : 'border-line text-muted hover:text-text'}`}
                aria-pressed={selected}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => onSelectDifficulty(id)}
              >
                {name}
              </button>
            );
          })}
        </div>
      </fieldset>
      <button type="button" className={primaryButton} onClick={onStart}>
        Start
      </button>
      <p className="text-xs text-muted">or press 1–8 / Space</p>
    </section>
  );
}
