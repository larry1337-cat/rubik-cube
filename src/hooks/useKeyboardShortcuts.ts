import { useEffect } from "react";
import { useCubeStore } from "../store/cubeStore";
import { FACE_KEYS, ACTION_KEYS } from "../config/keybindings";

const KEY_TO_FACE = Object.fromEntries(
  Object.entries(FACE_KEYS).map(([face, key]) => [key.toLowerCase(), face])
);

interface Options {
  onToggleHelp?: () => void;
}

export function useKeyboardShortcuts({ onToggleHelp }: Options = {}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

      const face = KEY_TO_FACE[event.key.toLowerCase()];
      if (face) {
        event.preventDefault();
        useCubeStore.getState().enqueueMove(event.shiftKey ? `${face}'` : face);
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
