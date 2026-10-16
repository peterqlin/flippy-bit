interface HudProps {
  score: number;
  lives: number;
  highScore: number;
}

export function Hud({ score, lives, highScore }: HudProps) {
  return (
    <header className="flex justify-between px-1 py-3 text-muted">
      <span>Score {score}</span>
      <span>Lives {lives}</span>
      <span>Best {highScore}</span>
    </header>
  );
}
