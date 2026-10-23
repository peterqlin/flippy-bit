import { numberRow } from './input/numberRow';
import { hex8 } from './modes/hex8';
import { GameScreen } from './ui/GameScreen';

export function App() {
  return <GameScreen mode={hex8} scheme={numberRow} />;
}
