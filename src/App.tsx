import { useState } from 'react';
import { numberRow } from './input/numberRow';
import { hex8 } from './modes/hex8';
import { GameScreen } from './ui/GameScreen';

export function App() {
  const [started, setStarted] = useState(false);

  if (started) return <GameScreen mode={hex8} scheme={numberRow} />;

  return (
    <main className="title">
      <h1>Flippy Bit</h1>
      <p>Flip bits to match each enemy's hex label before it reaches you.</p>
      <p className="hint">Keys 1–8 or tap the bits.</p>
      <button type="button" className="primary" onClick={() => setStarted(true)}>
        Start
      </button>
    </main>
  );
}
