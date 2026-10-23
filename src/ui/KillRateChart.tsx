import { useState, type PointerEvent } from 'react';
import type { TimelinePoint } from '../results/roundResults';

const WIDTH = 320;
const HEIGHT = 140;
const PLOT = { left: 28, right: WIDTH - 6, top: 8, bottom: HEIGHT - 18 };
const MIN_Y_MAX = 10;
const MISTAKE_MARK_RADIUS = 4;

interface KillRateChartProps {
  timeline: TimelinePoint[];
}

export function KillRateChart({ timeline }: KillRateChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const durationMs = timeline.at(-1)!.atMs;
  const yTicks = niceTicks(Math.max(MIN_Y_MAX, ...timeline.map((point) => point.killsPerMinute)));
  const yMax = yTicks.at(-1)!;
  const xTicks = secondTicks(durationMs);

  const x = (atMs: number) => PLOT.left + (atMs / durationMs) * (PLOT.right - PLOT.left);
  const y = (killsPerMinute: number) =>
    PLOT.bottom - (killsPerMinute / yMax) * (PLOT.bottom - PLOT.top);
  const line = [{ atMs: 0, killsPerMinute: timeline[0]!.killsPerMinute }, ...timeline]
    .map((point) => `${x(point.atMs).toFixed(1)},${y(point.killsPerMinute).toFixed(1)}`)
    .join(' ');

  function hover(event: PointerEvent<SVGSVGElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const svgX = ((event.clientX - box.left) / box.width) * WIDTH;
    const atMs = ((svgX - PLOT.left) / (PLOT.right - PLOT.left)) * durationMs;
    const index = Math.round(atMs / 1000) - 1;
    setHoveredIndex(Math.min(timeline.length - 1, Math.max(0, index)));
  }

  const hovered = hoveredIndex === null ? null : timeline[hoveredIndex];

  return (
    <figure className="w-full">
      <figcaption className="mb-1 flex justify-between text-xs text-muted">
        <span>kills per minute</span>
        <span>
          <span className="text-danger">✕</span> mistake
        </span>
      </figcaption>
      <div className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full touch-none overflow-visible text-[9px]"
          role="img"
          aria-label={`Kill rate over ${Math.round(durationMs / 1000)} seconds`}
          onPointerMove={hover}
          onPointerDown={hover}
          onPointerLeave={() => setHoveredIndex(null)}
        >
          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={PLOT.left}
                x2={PLOT.right}
                y1={y(tick)}
                y2={y(tick)}
                className="stroke-line"
                strokeWidth={1}
              />
              <text
                x={PLOT.left - 4}
                y={y(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-muted"
              >
                {tick}
              </text>
            </g>
          ))}
          {xTicks.map((seconds) => (
            <text
              key={seconds}
              x={x(seconds * 1000)}
              y={HEIGHT - 4}
              textAnchor="middle"
              className="fill-muted"
            >
              {seconds}s
            </text>
          ))}
          <polyline
            points={line}
            fill="none"
            className="stroke-accent"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {timeline
            .filter((point) => point.mistakes > 0)
            .map((point) => (
              <MistakeMark key={point.atMs} cx={x(point.atMs)} cy={y(point.killsPerMinute)} />
            ))}
          {hovered && (
            <g pointerEvents="none">
              <line
                x1={x(hovered.atMs)}
                x2={x(hovered.atMs)}
                y1={PLOT.top}
                y2={PLOT.bottom}
                className="stroke-muted"
                strokeWidth={1}
              />
              <circle
                cx={x(hovered.atMs)}
                cy={y(hovered.killsPerMinute)}
                r={4}
                className="fill-accent stroke-panel"
                strokeWidth={2}
              />
            </g>
          )}
        </svg>
        {hovered && (
          <div
            className="pointer-events-none absolute top-0 rounded-md border border-line bg-bg px-2 py-1 text-left text-xs whitespace-nowrap shadow-lg"
            style={tooltipPosition(x(hovered.atMs) / WIDTH)}
          >
            <div className="text-muted">{(hovered.atMs / 1000).toFixed(0)}s</div>
            <div>{Math.round(hovered.killsPerMinute)} kills/min</div>
            {hovered.mistakes > 0 && (
              <div>
                {hovered.mistakes} {hovered.mistakes === 1 ? 'mistake' : 'mistakes'}
              </div>
            )}
          </div>
        )}
      </div>
    </figure>
  );
}

function MistakeMark({ cx, cy }: { cx: number; cy: number }) {
  const r = MISTAKE_MARK_RADIUS;
  return (
    <path
      d={`M${cx - r},${cy - r}L${cx + r},${cy + r}M${cx + r},${cy - r}L${cx - r},${cy + r}`}
      className="stroke-danger"
      strokeWidth={2}
      strokeLinecap="round"
    />
  );
}

/** Keeps the tooltip inside the chart by flipping it to the left of the crosshair past the middle. */
function tooltipPosition(fraction: number) {
  const offset = '0.5rem';
  return fraction < 0.5
    ? { left: `calc(${fraction * 100}% + ${offset})` }
    : { right: `calc(${(1 - fraction) * 100}% + ${offset})` };
}

/** Evenly spaced round values from 0 up to at least `max`. */
function niceTicks(max: number): number[] {
  const rough = max / 3;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map((factor) => factor * magnitude).find((s) => s >= rough)!;
  const count = Math.ceil(max / step);
  return Array.from({ length: count + 1 }, (_, index) => index * step);
}

function secondTicks(durationMs: number): number[] {
  const seconds = durationMs / 1000;
  const step = [1, 2, 5, 10, 15, 30, 60, 120, 300].find((s) => seconds / s <= 6) ?? 600;
  return Array.from({ length: Math.floor(seconds / step) + 1 }, (_, index) => index * step);
}
