import type { Enemy } from '../engine/types';

export function Playfield({ enemies }: { enemies: Enemy[] }) {
  return (
    <div className="playfield">
      {enemies.map((enemy) => (
        <div
          key={enemy.id}
          className={`enemy ${enemy.matchedAtMs === null ? '' : 'enemy--matched'}`}
          style={{ left: `${enemy.x * 100}%`, top: `${Math.min(enemy.progress, 1) * 100}%` }}
        >
          {enemy.label}
        </div>
      ))}
    </div>
  );
}
