import type { Enemy } from '../engine/types';

export function Playfield({ enemies }: { enemies: Enemy[] }) {
  return (
    <div className="relative flex-1 overflow-hidden border-b-2 border-danger">
      {enemies.map((enemy) => (
        <div
          key={enemy.id}
          className={`absolute -translate-x-1/2 -translate-y-full rounded-md border bg-panel px-2 py-1 text-xl font-bold ${enemy.matchedAtMs === null ? 'border-line' : 'border-accent text-accent opacity-60'}`}
          style={{ left: `${enemy.x * 100}%`, top: `${Math.min(enemy.progress, 1) * 100}%` }}
        >
          {enemy.label}
        </div>
      ))}
    </div>
  );
}
