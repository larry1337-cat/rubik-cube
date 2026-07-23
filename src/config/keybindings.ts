export type MoveKey = "U" | "D" | "L" | "R" | "F" | "B" | "M" | "E" | "S" | "x" | "y" | "z";

export const MOVE_KEYS: MoveKey[] = ["U", "D", "L", "R", "F", "B", "M", "E", "S", "x", "y", "z"];

export const MOVE_KEY_LABELS: Record<MoveKey, string> = {
  U: "Up",
  D: "Down",
  L: "Left",
  R: "Right",
  F: "Front",
  B: "Back",
  M: "M (middle)",
  E: "E (equator)",
  S: "S (standing)",
  x: "x (rotate)",
  y: "y (rotate)",
  z: "z (rotate)",
};

export const DEFAULT_BINDINGS: Record<MoveKey, string> = {
  U: "KeyU",
  D: "KeyD",
  L: "KeyL",
  R: "KeyR",
  F: "KeyF",
  B: "KeyB",
  M: "KeyM",
  E: "KeyE",
  S: "KeyS",
  x: "KeyX",
  y: "KeyY",
  z: "KeyZ",
};

export const RESERVED_CODES = ["Space", "Backspace", "Escape", "Slash", "Tab", "Enter"];

export const ACTION_KEYS = {
  scramble: " ",
  undo: "Backspace",
  reset: "Escape",
  help: "?",
} as const;

const CODE_LABELS: Record<string, string> = {
  Minus: "-",
  Equal: "=",
  BracketLeft: "[",
  BracketRight: "]",
  Semicolon: ";",
  Quote: "'",
  Comma: ",",
  Period: ".",
  Slash: "/",
  Backslash: "\\",
  Backquote: "`",
};

export function keyLabel(code: string): string {
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  if (code.startsWith("Numpad")) return code.slice(6);
  return CODE_LABELS[code] ?? code;
}
