import { useEffect, useRef } from "react";
import { useCubeStore } from "../store/cubeStore";
import { playTurnSound, playSolvedSound } from "./sounds";

export function SoundEffects() {
  const turnCount = useCubeStore((s) => s.turnCount);
  const solved = useCubeStore((s) => s.solved);
  const skipTurn = useRef(true);
  const skipSolved = useRef(true);

  useEffect(() => {
    if (skipTurn.current) {
      skipTurn.current = false;
      return;
    }
    playTurnSound();
  }, [turnCount]);

  useEffect(() => {
    if (skipSolved.current) {
      skipSolved.current = false;
      return;
    }
    if (solved) playSolvedSound();
  }, [solved]);

  return null;
}
