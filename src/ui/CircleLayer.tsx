import { useEffect, useState, type RefObject } from 'react';
import type { GameState } from '../engine/types';
import { circleHeight, projectilePosition, type Circles, type Point } from './circles';

const RISE_PX = 24;
const CIRCLE_SIZE_PX = 10;

interface Layout {
  playfield: { left: number; top: number; width: number; height: number };
  /** Top-centre of each bit button, keyed by `bitKey`. */
  slots: Map<string, Point>;
}

export const bitKey = (byte: number, bit: number) => `${byte}:${bit}`;

function measure(container: HTMLElement): Layout | null {
  const origin = container.getBoundingClientRect();
  const playfield = container.querySelector<HTMLElement>('[data-playfield]');
  if (!playfield) return null;
  const playfieldRect = playfield.getBoundingClientRect();
  const slots = new Map<string, Point>();
  container.querySelectorAll<HTMLElement>('[data-bit]').forEach((element) => {
    const rect = element.getBoundingClientRect();
    slots.set(element.dataset.bit!, {
      x: rect.left - origin.left + rect.width / 2,
      y: rect.top - origin.top,
    });
  });
  return {
    playfield: {
      left: playfieldRect.left - origin.left,
      top: playfieldRect.top - origin.top,
      width: playfield.clientWidth,
      height: playfield.clientHeight,
    },
    slots,
  };
}

function useLayout(containerRef: RefObject<HTMLElement | null>): Layout | null {
  const [layout, setLayout] = useState<Layout | null>(null);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => setLayout(measure(container)));
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef]);
  return layout;
}

interface CircleLayerProps {
  game: GameState;
  circles: Circles;
  containerRef: RefObject<HTMLElement | null>;
}

export function CircleLayer({ game, circles, containerRef }: CircleLayerProps) {
  const layout = useLayout(containerRef);
  if (!layout) return null;
  const now = game.elapsedMs;
  const dots: { key: string; at: Point }[] = [];

  circles.bits.forEach((row, byte) =>
    row.forEach((circle, bit) => {
      const height = circleHeight(circle, now);
      const slot = layout.slots.get(bitKey(byte, bit));
      if (height > 0 && slot) {
        dots.push({ key: `bit-${byte}-${bit}`, at: { x: slot.x, y: slot.y - height * RISE_PX } });
      }
    }),
  );

  for (const projectile of circles.projectiles) {
    const enemy = game.enemies.find(({ id }) => id === projectile.enemyId);
    const slot = layout.slots.get(bitKey(projectile.address.byte, projectile.address.bit));
    if (!enemy || !slot) continue;
    const { playfield } = layout;
    const enemyX = playfield.left + enemy.x * playfield.width;
    const progressAtHit = enemy.progress + (enemy.speed * (projectile.hitAtMs - now)) / 1000;
    const at = projectilePosition(
      projectile,
      now,
      { x: slot.x, y: slot.y - projectile.startHeight * RISE_PX },
      { x: enemyX, y: slot.y - RISE_PX },
      { x: enemyX, y: playfield.top + Math.min(progressAtHit, 1) * playfield.height },
    );
    dots.push({
      key: `shot-${projectile.enemyId}-${projectile.address.byte}-${projectile.address.bit}`,
      at,
    });
  }

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {dots.map(({ key, at }) => (
        <div
          key={key}
          className="absolute top-0 left-0 rounded-full bg-accent"
          style={{
            width: CIRCLE_SIZE_PX,
            height: CIRCLE_SIZE_PX,
            transform: `translate(${at.x - CIRCLE_SIZE_PX / 2}px, ${at.y - CIRCLE_SIZE_PX / 2}px)`,
          }}
        />
      ))}
    </div>
  );
}
