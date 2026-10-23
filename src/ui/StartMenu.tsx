import { difficulties, type DifficultyId } from '../modes/difficulties';
import type { RoundResults } from '../results/roundResults';
import { RoundResultsPanel } from './RoundResultsPanel';

interface StartMenuProps {
  /** Results of the run that just ended; absent before the first run. */
  results: RoundResults | null;
  difficulty: DifficultyId;
  onSelectDifficulty: (difficulty: DifficultyId) => void;
}

export function StartMenu({ results, difficulty, onSelectDifficulty }: StartMenuProps) {
  return (
    <section
      className={`pointer-events-auto flex w-full ${results ? 'max-w-md' : 'max-w-xs'} flex-col items-center gap-5 rounded-xl border border-line bg-panel/95 p-6 text-center shadow-lg`}
    >
      {results && (
        <>
          <h2 className="text-3xl font-bold text-danger">Game over</h2>
          <RoundResultsPanel results={results} />
        </>
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
    </section>
  );
}
