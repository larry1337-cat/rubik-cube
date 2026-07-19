import { useEffect, useState } from "react";
import { useCubeStore } from "../store/cubeStore";
import { useDeviceType } from "../hooks/useDeviceType";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { FACE_KEYS } from "../config/keybindings";

const FACE_GROUPS: { label: string; moves: [string, string] }[] = [
  { label: "Up", moves: ["U", "U'"] },
  { label: "Down", moves: ["D", "D'"] },
  { label: "Right", moves: ["R", "R'"] },
  { label: "Left", moves: ["L", "L'"] },
  { label: "Front", moves: ["F", "F'"] },
  { label: "Back", moves: ["B", "B'"] },
];

function keycapFor(move: string) {
  const face = move.endsWith("'") ? move.slice(0, -1) : move;
  const key = FACE_KEYS[face].toUpperCase();
  return move.endsWith("'") ? `Shift+${key}` : key;
}

function formatTime(ms: number) {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(1).padStart(4, "0");
  return `${minutes}:${seconds}`;
}

export function Controls() {
  const enqueueMove = useCubeStore((s) => s.enqueueMove);
  const scramble = useCubeStore((s) => s.scramble);
  const reset = useCubeStore((s) => s.reset);
  const undo = useCubeStore((s) => s.undo);
  const moveCount = useCubeStore((s) => s.moveCount);
  const solved = useCubeStore((s) => s.solved);
  const startedAt = useCubeStore((s) => s.startedAt);
  const solvedAt = useCubeStore((s) => s.solvedAt);
  const isScrambling = useCubeStore((s) => s.isScrambling);
  const historyLength = useCubeStore((s) => s.history.length);

  const device = useDeviceType();
  const isDesktop = device === "desktop";

  const [showHelp, setShowHelp] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  useKeyboardShortcuts({ onToggleHelp: () => setShowHelp((v) => !v) });

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startedAt || solvedAt) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [startedAt, solvedAt]);

  const elapsed = startedAt ? (solvedAt ?? now) - startedAt : 0;

  return (
    <div className="hud" data-device={device}>
      <div className="hud__top">
        <div className="stat">
          <span className="stat__label">Time</span>
          <span className="stat__value">{formatTime(elapsed)}</span>
        </div>
        <div className="stat">
          <span className="stat__label">Moves</span>
          <span className="stat__value">{moveCount}</span>
        </div>
        <div className={`stat stat--status ${solved ? "is-solved" : ""}`}>
          <span className="stat__label">Status</span>
          <span className="stat__value">
            {isScrambling ? "Scrambling…" : solved ? "Solved" : "In progress"}
          </span>
        </div>

        {isDesktop && (
          <button className="help-toggle" onClick={() => setShowHelp((v) => !v)} title="Keyboard shortcuts (?)">
            ?
          </button>
        )}
      </div>

      {showHelp && isDesktop && (
        <div className="help-card">
          <div className="help-card__title">Shortcuts</div>
          <div className="help-card__row">
            <kbd>{Object.values(FACE_KEYS).map((k) => k.toUpperCase()).join(" ")}</kbd>
            <span>turn face clockwise</span>
          </div>
          <div className="help-card__row"><kbd>Shift</kbd><span>+ letter turns counterclockwise</span></div>
          <div className="help-card__row"><kbd>Space</kbd><span>scramble</span></div>
          <div className="help-card__row"><kbd>Backspace</kbd><span>undo</span></div>
          <div className="help-card__row"><kbd>Esc</kbd><span>reset</span></div>
        </div>
      )}

      <div className={`hud__bottom ${collapsed ? "is-collapsed" : ""}`}>
        <button className="panel-toggle" onClick={() => setCollapsed((v) => !v)}>
          {collapsed ? "☰" : "✕"}
        </button>

        {!collapsed && (
          <>
            <div className="face-grid">
              {FACE_GROUPS.map(({ label, moves }) => (
                <div className="face-group" key={label}>
                  <span className="face-group__label">{label}</span>
                  <div className="face-group__buttons">
                    {moves.map((m) => (
                      <button key={m} onClick={() => enqueueMove(m)} disabled={isScrambling}>
                        {m}
                        {isDesktop && <span className="keycap">{keycapFor(m)}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="actions">
              <button className="actions__scramble" onClick={scramble} disabled={isScrambling}>
                Scramble
              </button>
              <button onClick={undo} disabled={isScrambling || historyLength === 0}>
                Undo
              </button>
              <button className="actions__reset" onClick={reset} disabled={isScrambling}>
                Reset
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
