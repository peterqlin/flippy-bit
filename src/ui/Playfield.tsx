import type { Enemy } from '../engine/types';
import { explosionProgress, type Explosion } from './explosions';

const ENEMY_BOX =
  'absolute -translate-x-1/2 -translate-y-full rounded-md border px-2 py-1 text-xl font-bold';

interface ShardRing {
  count: number;
  distancePx: number;
  className: string;
}

const SHARD_RINGS: ShardRing[] = [
  { count: 10, distancePx: 56, className: 'size-2 bg-text' },
  { count: 8, distancePx: 30, className: 'size-1.5 bg-accent' },
];

interface PlayfieldProps {
  enemies: Enemy[];
  explosions: Explosion[];
  nowMs: number;
}

export function Playfield({ enemies, explosions, nowMs }: PlayfieldProps) {
  return (
    <div data-playfield className="relative flex-1 overflow-hidden border-b-2 border-danger">
      {enemies.map((enemy) => (
        <div
          key={enemy.id}
          className="pointer-events-none absolute inset-0 will-change-transform"
          style={{ transform: `translateY(${Math.min(enemy.progress, 1) * 100}%)` }}
        >
          <div
            className={`${ENEMY_BOX} top-0 border-line bg-panel`}
            style={{ left: `${enemy.x * 100}%` }}
          >
            {enemy.label}
          </div>
        </div>
      ))}
      {explosions.map((explosion) => (
        <EnemyExplosion key={explosion.enemyId} explosion={explosion} nowMs={nowMs} />
      ))}
    </div>
  );
}

function EnemyExplosion({ explosion, nowMs }: { explosion: Explosion; nowMs: number }) {
  const t = explosionProgress(explosion, nowMs);
  const spread = 1 - (1 - t) ** 2;
  const fade = 1 - t;

  return (
    <div
      className={`${ENEMY_BOX} pointer-events-none border-transparent`}
      style={{ left: `${explosion.x * 100}%`, top: `${explosion.progress * 100}%` }}
      aria-hidden
    >
      <span className="invisible">{explosion.label}</span>
      {SHARD_RINGS.map((ring, ringIndex) =>
        Array.from({ length: ring.count }, (_, shard) => {
          const angle =
            explosion.rotationRad + ((shard + ringIndex / 2) / ring.count) * 2 * Math.PI;
          const distance = spread * ring.distancePx * (shard % 2 === 0 ? 1 : 0.7);
          return (
            <div
              key={`${ringIndex}-${shard}`}
              className={`absolute top-1/2 left-1/2 ${ring.className}`}
              style={{
                opacity: fade,
                transform: `translate(-50%, -50%) rotate(${angle}rad) translateX(${distance}px) scale(${fade})`,
              }}
            />
          );
        }),
      )}
    </div>
  );
}
