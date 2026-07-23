import { useEffect, useState } from "react";
import { useCubeStore } from "../store/cubeStore";
import { useKeybindings } from "../store/keybindingsStore";
import { useDeviceType } from "../hooks/useDeviceType";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { keyLabel, MOVE_KEYS, MOVE_KEY_LABELS } from "../config/keybindings";
import type { MoveKey } from "../config/keybindings";

const FACE_GROUPS: { label: string; moves: [string, string] }[] = [
  { label: "Up", moves: ["U", "U'"] },
  { label: "Down", moves: ["D", "D'"] },
  { label: "Right", moves: ["R", "R'"] },
  { label: "Left", moves: ["L", "L'"] },
  { label: "Front", moves: ["F", "F'"] },
  { label: "Back", moves: ["B", "B'"] },
];

const SLICE_GROUPS: { label: string; moves: [string, string] }[] = [
  { label: "M", moves: ["M", "M'"] },
  { label: "E", moves: ["E", "E'"] },
  { label: "S", moves: ["S", "S'"] },
];

const ROTATION_GROUPS: { label: string; moves: [string, string] }[] = [
  { label: "x", moves: ["x", "x'"] },
  { label: "y", moves: ["y", "y'"] },
  { label: "z", moves: ["z", "z'"] },
];

function keycapFor(move: string, bindings: Record<MoveKey, string>) {
  const base = (move.endsWith("'") ? move.slice(0, -1) : move) as MoveKey;
  const label = keyLabel(bindings[base]);
  return move.endsWith("'") ? `Shift+${label}` : label;
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

  const bindings = useKeybindings((s) => s.bindings);
  const rebind = useKeybindings((s) => s.rebind);
  const resetBindings = useKeybindings((s) => s.resetBindings);

  const device = useDeviceType();
  const isDesktop = device === "desktop";

  const [showHelp, setShowHelp] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [capturing, setCapturing] = useState<MoveKey | null>(null);
  useKeyboardShortcuts({ onToggleHelp: () => setShowHelp((v) => !v) });

  useEffect(() => {
    if (!capturing) return;
    function onKey(event: KeyboardEvent) {
      event.preventDefault();
      event.stopPropagation();
      if (event.code !== "Escape") rebind(capturing!, event.code);
      setCapturing(null);
    }
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, true);
  }, [capturing, rebind]);

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
          <div className="help-card__title">Keys</div>
          <div className="keybind-list">
            {MOVE_KEYS.map((key) => (
              <div className="keybind-row" key={key}>
                <span className="keybind-row__label">{MOVE_KEY_LABELS[key]}</span>
                <button
                  className={`keybind-row__key ${capturing === key ? "is-capturing" : ""}`}
                  onClick={() => setCapturing(key)}
                >
                  {capturing === key ? "Press a key…" : keyLabel(bindings[key])}
                </button>
              </div>
            ))}
          </div>
          <div className="help-card__row"><kbd>Shift</kbd><span>+ key turns counterclockwise</span></div>
          <div className="help-card__row"><kbd>Space</kbd><span>scramble</span></div>
          <div className="help-card__row"><kbd>Backspace</kbd><span>undo</span></div>
          <div className="help-card__row"><kbd>Esc</kbd><span>reset</span></div>
          <button className="keybind-reset" onClick={resetBindings}>Reset keys</button>
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
                        {isDesktop && <span className="keycap">{keycapFor(m, bindings)}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="face-grid face-grid--extra">
              {[...SLICE_GROUPS, ...ROTATION_GROUPS].map(({ label, moves }) => (
                <div className="face-group" key={label}>
                  <span className="face-group__label">{label}</span>
                  <div className="face-group__buttons">
                    {moves.map((m) => (
                      <button key={m} onClick={() => enqueueMove(m)} disabled={isScrambling}>
                        {m}
                        {isDesktop && <span className="keycap">{keycapFor(m, bindings)}</span>}
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
