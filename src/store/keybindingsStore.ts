import { create } from "zustand";
import { DEFAULT_BINDINGS, MOVE_KEYS, RESERVED_CODES } from "../config/keybindings";
import type { MoveKey } from "../config/keybindings";

const STORAGE_KEY = "rubik.keybindings";

function load(): Record<MoveKey, string> {
  const bindings = { ...DEFAULT_BINDINGS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return bindings;
    const parsed = JSON.parse(raw);
    for (const key of MOVE_KEYS) {
      if (typeof parsed[key] === "string") bindings[key] = parsed[key];
    }
  } catch {
    return { ...DEFAULT_BINDINGS };
  }
  return bindings;
}

function save(bindings: Record<MoveKey, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
  } catch {}
}

interface KeybindingsState {
  bindings: Record<MoveKey, string>;
  rebind: (key: MoveKey, code: string) => boolean;
  resetBindings: () => void;
}

export const useKeybindings = create<KeybindingsState>((set, get) => ({
  bindings: load(),

  rebind: (key, code) => {
    if (RESERVED_CODES.includes(code)) return false;
    const current = get().bindings;
    if (current[key] === code) return true;
    const next = { ...current };
    for (const other of MOVE_KEYS) {
      if (next[other] === code) next[other] = current[key];
    }
    next[key] = code;
    save(next);
    set({ bindings: next });
    return true;
  },

  resetBindings: () => {
    const next = { ...DEFAULT_BINDINGS };
    save(next);
    set({ bindings: next });
  },
}));
