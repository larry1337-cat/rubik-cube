import { Quaternion, Vector3 } from "three";

export type Axis = "x" | "y" | "z";

export interface Cubie {
  id: number;
  position: Vector3;
  quaternion: Quaternion;
  colors: Partial<Record<"px" | "nx" | "py" | "ny" | "pz" | "nz", string>>;
}

export const FACE_COLORS = {
  px: "#ef4a44",
  nx: "#ff9f1c",
  py: "#fafaf6",
  ny: "#ffd93d",
  pz: "#2ecc71",
  nz: "#4d8dfb",
};

export function createSolvedCube(): Cubie[] {
  const cubies: Cubie[] = [];
  let id = 0;
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue;
        const colors: Cubie["colors"] = {};
        if (x === 1) colors.px = FACE_COLORS.px;
        if (x === -1) colors.nx = FACE_COLORS.nx;
        if (y === 1) colors.py = FACE_COLORS.py;
        if (y === -1) colors.ny = FACE_COLORS.ny;
        if (z === 1) colors.pz = FACE_COLORS.pz;
        if (z === -1) colors.nz = FACE_COLORS.nz;

        cubies.push({
          id: id++,
          position: new Vector3(x, y, z),
          quaternion: new Quaternion(),
          colors,
        });
      }
    }
  }
  return cubies;
}

export const AXIS_VECTOR: Record<Axis, Vector3> = {
  x: new Vector3(1, 0, 0),
  y: new Vector3(0, 1, 0),
  z: new Vector3(0, 0, 1),
};

export interface Move {
  axis: Axis;
  layers: number[];
  direction: 1 | -1;
}

const ALL_LAYERS = [-1, 0, 1];

export const MOVE_TABLE: Record<string, Move> = {
  U: { axis: "y", layers: [1], direction: -1 },
  "U'": { axis: "y", layers: [1], direction: 1 },
  D: { axis: "y", layers: [-1], direction: 1 },
  "D'": { axis: "y", layers: [-1], direction: -1 },
  R: { axis: "x", layers: [1], direction: -1 },
  "R'": { axis: "x", layers: [1], direction: 1 },
  L: { axis: "x", layers: [-1], direction: 1 },
  "L'": { axis: "x", layers: [-1], direction: -1 },
  F: { axis: "z", layers: [1], direction: -1 },
  "F'": { axis: "z", layers: [1], direction: 1 },
  B: { axis: "z", layers: [-1], direction: 1 },
  "B'": { axis: "z", layers: [-1], direction: -1 },
  M: { axis: "x", layers: [0], direction: 1 },
  "M'": { axis: "x", layers: [0], direction: -1 },
  E: { axis: "y", layers: [0], direction: 1 },
  "E'": { axis: "y", layers: [0], direction: -1 },
  S: { axis: "z", layers: [0], direction: -1 },
  "S'": { axis: "z", layers: [0], direction: 1 },
  x: { axis: "x", layers: ALL_LAYERS, direction: -1 },
  "x'": { axis: "x", layers: ALL_LAYERS, direction: 1 },
  y: { axis: "y", layers: ALL_LAYERS, direction: -1 },
  "y'": { axis: "y", layers: ALL_LAYERS, direction: 1 },
  z: { axis: "z", layers: ALL_LAYERS, direction: -1 },
  "z'": { axis: "z", layers: ALL_LAYERS, direction: 1 },
};

export const MOVE_NAMES = Object.keys(MOVE_TABLE);

export const SCRAMBLE_MOVES = ["U", "U'", "D", "D'", "R", "R'", "L", "L'", "F", "F'", "B", "B'"];

export function isRotation(move: Move): boolean {
  return move.layers.length === 3;
}

export function cubiesForMove(cubies: Cubie[], move: Move): Cubie[] {
  return cubies.filter((c) => move.layers.includes(Math.round(c.position[move.axis])));
}

export function commitRotation(affected: Cubie[], axis: Axis, direction: 1 | -1) {
  const angle = (Math.PI / 2) * direction;
  const axisVec = AXIS_VECTOR[axis];
  const rotationQuat = new Quaternion().setFromAxisAngle(axisVec, angle);

  for (const cubie of affected) {
    cubie.position.applyAxisAngle(axisVec, angle);
    cubie.position.set(
      Math.round(cubie.position.x),
      Math.round(cubie.position.y),
      Math.round(cubie.position.z)
    );
    cubie.quaternion.premultiply(rotationQuat);
  }
}

const LOCAL_FACE_NORMALS: [keyof Cubie["colors"], Vector3][] = [
  ["px", new Vector3(1, 0, 0)],
  ["nx", new Vector3(-1, 0, 0)],
  ["py", new Vector3(0, 1, 0)],
  ["ny", new Vector3(0, -1, 0)],
  ["pz", new Vector3(0, 0, 1)],
  ["nz", new Vector3(0, 0, -1)],
];

const WORLD_FACES = [
  new Vector3(1, 0, 0),
  new Vector3(-1, 0, 0),
  new Vector3(0, 1, 0),
  new Vector3(0, -1, 0),
  new Vector3(0, 0, 1),
  new Vector3(0, 0, -1),
];

export function isSolved(cubies: Cubie[]): boolean {
  const EPS = 1e-3;
  for (const worldFace of WORLD_FACES) {
    let color: string | null = null;
    for (const cubie of cubies) {
      for (const [face, normal] of LOCAL_FACE_NORMALS) {
        const c = cubie.colors[face];
        if (!c) continue;
        const world = normal.clone().applyQuaternion(cubie.quaternion);
        if (world.distanceTo(worldFace) > EPS) continue;
        if (color === null) color = c;
        else if (color !== c) return false;
      }
    }
  }
  return true;
}

export function randomScramble(length = 20): string[] {
  const moves: string[] = [];
  let lastAxis: Axis | null = null;
  for (let i = 0; i < length; i++) {
    let name: string;
    let move: Move;
    do {
      name = SCRAMBLE_MOVES[Math.floor(Math.random() * SCRAMBLE_MOVES.length)];
      move = MOVE_TABLE[name];
    } while (move.axis === lastAxis);
    lastAxis = move.axis;
    moves.push(name);
  }
  return moves;
}
