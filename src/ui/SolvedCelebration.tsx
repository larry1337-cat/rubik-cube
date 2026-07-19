import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useCubeStore } from "../store/cubeStore";

const CONFETTI_COLORS = ["#ef4a44", "#ff9f1c", "#ffd93d", "#2ecc71", "#4d8dfb", "#6c5ce7"];

interface ConfettiPiece {
  id: number;
  left: number;
  color: string;
  delay: number;
  drift: number;
}

function formatTime(ms: number) {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(1).padStart(4, "0");
  return `${minutes}:${seconds}`;
}

export function SolvedCelebration() {
  const solved = useCubeStore((s) => s.solved);
  const startedAt = useCubeStore((s) => s.startedAt);
  const solvedAt = useCubeStore((s) => s.solvedAt);
  const moveCount = useCubeStore((s) => s.moveCount);

  const [visible, setVisible] = useState(false);
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const skipFirst = useRef(true);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    if (!solved || !solvedAt || !startedAt) return;

    setPieces(
      Array.from({ length: 60 }, (_, id) => ({
        id,
        left: Math.random() * 100,
        color: CONFETTI_COLORS[id % CONFETTI_COLORS.length],
        delay: Math.random() * 0.4,
        drift: (Math.random() - 0.5) * 140,
      }))
    );
    setVisible(true);

    const timeout = setTimeout(() => setVisible(false), 3200);
    return () => clearTimeout(timeout);
  }, [solved, solvedAt, startedAt]);

  if (!visible || !solvedAt || !startedAt) return null;

  return (
    <div className="celebration">
      <div className="confetti">
        {pieces.map((p) => (
          <span
            key={p.id}
            className="confetti__piece"
            style={
              {
                left: `${p.left}%`,
                backgroundColor: p.color,
                animationDelay: `${p.delay}s`,
                "--drift": `${p.drift}px`,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="celebration__card">
        <div className="celebration__title">Solved!</div>
        <div className="celebration__stats">
          {formatTime(solvedAt - startedAt)} · {moveCount} moves
        </div>
      </div>
    </div>
  );
}
