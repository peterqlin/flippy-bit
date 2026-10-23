import type { RoundResults } from '../results/roundResults';
import { KillRateChart } from './KillRateChart';

interface RoundResultsPanelProps {
  results: RoundResults;
}

export function RoundResultsPanel({ results }: RoundResultsPanelProps) {
  const accuracy = results.accuracy === null ? '–' : `${Math.round(results.accuracy * 100)}%`;
  return (
    <div className="flex w-full flex-col gap-4">
      <dl className="grid grid-cols-3 gap-2">
        <Stat label="kills/min" value={Math.round(results.killsPerMinute)} />
        <Stat label="accuracy" value={accuracy} />
        <Stat label="out of order" value={results.outOfOrderKills} />
      </dl>
      {results.timeline.length > 1 && <KillRateChart timeline={results.timeline} />}
      <dl className="flex justify-center gap-4 text-xs text-muted">
        <Detail label="kills" value={results.kills} />
        <Detail label="mistakes" value={`${results.mistakes}/${results.judgedFlips}`} />
        <Detail label="time" value={`${(results.durationMs / 1000).toFixed(1)}s`} />
      </dl>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-3xl font-bold text-accent">{value}</dd>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex gap-1">
      <dt>{label}</dt>
      <dd className="text-text">{value}</dd>
    </div>
  );
}
