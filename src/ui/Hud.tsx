interface HudProps {
  highScore: number;
}

export function Hud({ highScore }: HudProps) {
  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-1 py-3">
      <h1 className="font-bold text-accent">Flippy Bit</h1>
      <span className="text-accent">Highscore {highScore}</span>
    </header>
  );
}
