interface HudProps {
  score: number;
  lives: number;
  highScore: number;
  muted: boolean;
  onToggleMuted: () => void;
}

export function Hud({ score, lives, highScore, muted, onToggleMuted }: HudProps) {
  return (
    <header className="flex items-center justify-between gap-3 px-1 py-3 text-muted">
      <span>Score {score}</span>
      <span>Lives {lives}</span>
      <span>Best {highScore}</span>
      <button
        type="button"
        className="rounded-md p-1 hover:text-text"
        aria-label="Mute sound"
        aria-pressed={muted}
        title="Mute (M)"
        onPointerDown={(event) => event.preventDefault()}
        onClick={onToggleMuted}
      >
        <SpeakerIcon muted={muted} />
      </button>
    </header>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M11 5 6 9H2v6h4l5 4V5Z" fill="currentColor" />
      {muted ? (
        <path d="m16 9 6 6m0-6-6 6" />
      ) : (
        <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
      )}
    </svg>
  );
}
