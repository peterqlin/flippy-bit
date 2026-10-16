import { useCallback, useState } from 'react';
import { numberRow } from './input/numberRow';
import { usePlayKeys } from './input/usePlayKeys';
import { hex8 } from './modes/hex8';
import { primaryButton } from './ui/buttonStyles';
import { GameScreen } from './ui/GameScreen';

export function App() {
  const [started, setStarted] = useState(false);
  const start = useCallback(() => setStarted(true), []);
  usePlayKeys(start, !started);

  if (started) return <GameScreen mode={hex8} scheme={numberRow} />;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-[clamp(2rem,8vw,3.5rem)] font-bold text-accent">Flippy Bit</h1>
      <p>Flip bits to match each enemy's hex label before it reaches you.</p>
      <p className="text-muted">Keys 1–8 or tap the bits.</p>
      <button type="button" className={primaryButton} onClick={start}>
        Start
      </button>
    </main>
  );
}
