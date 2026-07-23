import { useEffect, useRef } from "react";
import { useCubeStore } from "../store/cubeStore";
import { playTurnSound, playSolvedSound } from "./sounds";

export function SoundEffects() {
  const turnCount = useCubeStore((s) => s.turnCount);
  const solvedAt = useCubeStore((s) => s.solvedAt);
  const lastTurn = useRef(turnCount);
  const lastSolvedAt = useRef(solvedAt);

  useEffect(() => {
    if (turnCount > lastTurn.current) playTurnSound();
    lastTurn.current = turnCount;
  }, [turnCount]);

  useEffect(() => {
    if (solvedAt && solvedAt !== lastSolvedAt.current) playSolvedSound();
    lastSolvedAt.current = solvedAt;
  }, [solvedAt]);

  return null;
}
