interface HudProps {
  score: number;
  lives: number;
  highScore: number;
}

export function Hud({ score, lives, highScore }: HudProps) {
  return (
    <header className="hud">
      <span>Score {score}</span>
      <span>Lives {lives}</span>
      <span>Best {highScore}</span>
    </header>
  );
}
