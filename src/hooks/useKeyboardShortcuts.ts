import { useEffect } from "react";
import { useCubeStore } from "../store/cubeStore";
import { useKeybindings } from "../store/keybindingsStore";
import { ACTION_KEYS, MOVE_KEYS } from "../config/keybindings";

interface Options {
  onToggleHelp?: () => void;
}

export function useKeyboardShortcuts({ onToggleHelp }: Options = {}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

      const bindings = useKeybindings.getState().bindings;
      const key = MOVE_KEYS.find((k) => bindings[k] === event.code);
      if (key) {
        event.preventDefault();
        useCubeStore.getState().enqueueMove(event.shiftKey ? `${key}'` : key);
        return;
      }

      switch (event.key) {
        case ACTION_KEYS.scramble:
          event.preventDefault();
          useCubeStore.getState().scramble();
          break;
        case ACTION_KEYS.undo:
          event.preventDefault();
          useCubeStore.getState().undo();
          break;
        case ACTION_KEYS.reset:
          event.preventDefault();
          useCubeStore.getState().reset();
          break;
        case ACTION_KEYS.help:
          event.preventDefault();
          onToggleHelp?.();
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onToggleHelp]);
}
