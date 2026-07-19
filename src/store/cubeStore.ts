import { create } from "zustand";
import {
  Cubie,
  Move,
  MOVE_TABLE,
  commitRotation,
  createSolvedCube,
  cubiesInLayer,
  isSolved,
  randomScramble,
} from "../cube/cubeModel";

interface ActiveTurn {
  name: string;
  move: Move;
  affected: Cubie[];
  progress: number;
}

export interface ManualTurn {
  move: Move;
  affected: Cubie[];
  angle: number;
}

interface CubeState {
  cubies: Cubie[];
  queue: string[];
  active: ActiveTurn | null;
  manual: ManualTurn | null;
  history: string[];
  moveCount: number;
  turnCount: number;
  isScrambling: boolean;
  solved: boolean;
  startedAt: number | null;
  solvedAt: number | null;

  enqueueMove: (name: string) => void;
  scramble: () => void;
  reset: () => void;
  undo: () => void;
  tick: (deltaSeconds: number) => void;
  beginManual: (move: Move) => void;
  updateManual: (angle: number) => void;
  commitManual: () => void;
  cancelManual: () => void;
}

const TURN_DURATION = 0.22;

function inverseOf(name: string): string {
  return name.endsWith("'") ? name.slice(0, -1) : `${name}'`;
}

export const useCubeStore = create<CubeState>((set, get) => ({
  cubies: createSolvedCube(),
  queue: [],
  active: null,
  manual: null,
  history: [],
  moveCount: 0,
  turnCount: 0,
  isScrambling: false,
  solved: true,
  startedAt: null,
  solvedAt: null,

  enqueueMove: (name: string) => {
    if (!MOVE_TABLE[name]) return;
    set((state) => ({
      queue: [...state.queue, name],
      startedAt: state.startedAt ?? Date.now(),
      solvedAt: null,
    }));
  },

  scramble: () => {
    const moves = randomScramble(20);
    set({
      queue: moves,
      isScrambling: true,
      moveCount: 0,
      history: [],
      startedAt: null,
      solvedAt: null,
      solved: false,
      manual: null,
    });
  },

  reset: () => {
    set({
      cubies: createSolvedCube(),
      queue: [],
      active: null,
      manual: null,
      history: [],
      moveCount: 0,
      isScrambling: false,
      solved: true,
      startedAt: null,
      solvedAt: null,
    });
  },

  undo: () => {
    const state = get();
    if (state.active || state.queue.length > 0 || state.isScrambling || state.manual) return;
    const last = state.history[state.history.length - 1];
    if (!last) return;
    set({ history: state.history.slice(0, -1) });
    get().enqueueMove(inverseOf(last));
  },

  tick: (deltaSeconds: number) => {
    const state = get();
    let { active, queue } = state;

    if (!active && queue.length > 0) {
      const name = queue[0];
      const move = MOVE_TABLE[name];
      const affected = cubiesInLayer(state.cubies, move.axis, move.layer);
      active = { name, move, affected, progress: 0 };
      queue = queue.slice(1);
    }

    if (!active) return;

    const progress = active.progress + deltaSeconds / TURN_DURATION;

    if (progress >= 1) {
      commitRotation(active.affected, active.move.axis, active.move.direction);

      const stillScrambling = state.isScrambling && queue.length > 0;
      const nowSolved = queue.length === 0 ? isSolved(state.cubies) : state.solved;
      const recordHistory = !state.isScrambling;

      set({
        active: null,
        queue,
        turnCount: state.turnCount + 1,
        history: recordHistory ? [...state.history, active.name] : state.history,
        moveCount: state.isScrambling ? state.moveCount : state.moveCount + 1,
        isScrambling: stillScrambling,
        solved: nowSolved,
        solvedAt: !stillScrambling && nowSolved && !state.solved ? Date.now() : state.solvedAt,
      });
    } else {
      set({ active: { ...active, progress }, queue });
    }
  },

  beginManual: (move: Move) => {
    const state = get();
    if (state.active || state.queue.length > 0 || state.isScrambling) return;
    const affected = cubiesInLayer(state.cubies, move.axis, move.layer);
    set({
      manual: { move, affected, angle: 0 },
      startedAt: state.startedAt ?? Date.now(),
      solvedAt: null,
    });
  },

  updateManual: (angle: number) => {
    const state = get();
    if (!state.manual) return;
    set({ manual: { ...state.manual, angle } });
  },

  commitManual: () => {
    const state = get();
    if (!state.manual) return;
    const { move, affected, angle } = state.manual;

    const halfPi = Math.PI / 2;
    const snapped = Math.round(angle / halfPi);

    if (snapped === 0) {
      set({ manual: null });
      return;
    }

    const direction = (snapped > 0 ? 1 : -1) as 1 | -1;
    const times = Math.abs(snapped);

    for (let i = 0; i < times; i++) {
      commitRotation(affected, move.axis, direction);
    }

    const moveName = direction === move.direction
      ? findMoveName(move)
      : findMoveName({ ...move, direction: (move.direction * -1) as 1 | -1 });

    const nowSolved = isSolved(state.cubies);

    set({
      manual: null,
      turnCount: state.turnCount + 1,
      history: moveName ? [...state.history, moveName] : state.history,
      moveCount: state.moveCount + 1,
      solved: nowSolved,
      solvedAt: nowSolved && !state.solved ? Date.now() : state.solvedAt,
    });
  },

  cancelManual: () => {
    set({ manual: null });
  },
}));

function findMoveName(move: Move): string | null {
  for (const [name, m] of Object.entries(MOVE_TABLE)) {
    if (m.axis === move.axis && m.layer === move.layer && m.direction === move.direction) {
      return name;
    }
  }
  return null;
}
