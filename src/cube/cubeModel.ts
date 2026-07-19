import { Quaternion, Vector3 } from "three";

/**
 * Core Rubik's Cube data model.
 *
 * A cube is 26 small "cubies" arranged on a 3x3x3 grid (the center piece
 * is omitted since it's never visible). Each cubie has:
 *  - a logical position: integer coords in {-1, 0, 1} for x/y/z
 *  - an orientation: a running quaternion applied on top of its original
 *    orientation, so stickers rotate correctly with the piece
 *  - sticker colors: assigned once at creation time and never recomputed —
 *    a sticker belongs to a physical piece, not a grid slot.
 *
 * This file has no rendering code. <Cube3D> just reads this state and
 * draws it; <Controls> calls applyMove()/scramble() to mutate it.
 */

export type Axis = "x" | "y" | "z";

export interface Cubie {
  id: number;
  position: Vector3; // logical grid position, components in {-1,0,1}
  quaternion: Quaternion; // accumulated rotation from the solved state
  colors: Partial<Record<"px" | "nx" | "py" | "ny" | "pz" | "nz", string>>;
}

// Standard Western color scheme
export const FACE_COLORS = {
  px: "#ef4a44", // right  - warm coral red
  nx: "#ff9f1c", // left   - bright orange
  py: "#fafaf6", // up     - soft warm white
  ny: "#ffd93d", // down   - sunny yellow
  pz: "#2ecc71", // front  - fresh green
  nz: "#4d8dfb", // back   - friendly sky blue
};

export function createSolvedCube(): Cubie[] {
  const cubies: Cubie[] = [];
  let id = 0;
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue; // hidden core, skip
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

/** A move: which layer, and which way (+1 / -1) it turns. */
export interface Move {
  axis: Axis;
  layer: -1 | 1; // which slice of the cube (middle-layer moves omitted for a v1 3x3)
  direction: 1 | -1;
}

// Standard face-move notation. Signs were picked to look right for the
// standard color scheme/camera in Cube3D — flip a `direction` here if any
// move looks mirrored once you're looking at the rendered cube.
export const MOVE_TABLE: Record<string, Move> = {
  U: { axis: "y", layer: 1, direction: -1 },
  "U'": { axis: "y", layer: 1, direction: 1 },
  D: { axis: "y", layer: -1, direction: 1 },
  "D'": { axis: "y", layer: -1, direction: -1 },
  R: { axis: "x", layer: 1, direction: -1 },
  "R'": { axis: "x", layer: 1, direction: 1 },
  L: { axis: "x", layer: -1, direction: 1 },
  "L'": { axis: "x", layer: -1, direction: -1 },
  F: { axis: "z", layer: 1, direction: -1 },
  "F'": { axis: "z", layer: 1, direction: 1 },
  B: { axis: "z", layer: -1, direction: 1 },
  "B'": { axis: "z", layer: -1, direction: -1 },
};

export const MOVE_NAMES = Object.keys(MOVE_TABLE);

/** Cubies belonging to the layer a given move rotates. */
export function cubiesInLayer(cubies: Cubie[], axis: Axis, layer: number): Cubie[] {
  return cubies.filter((c) => Math.round(c.position[axis]) === layer);
}

/**
 * Permanently applies a 90-degree rotation to the given cubies: rotates
 * their logical position around the axis, rounds back to the {-1,0,1}
 * grid to kill floating point drift, and pre-multiplies their orientation
 * quaternion so stickers stay attached to the physical piece.
 */
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

export function isSolved(cubies: Cubie[]): boolean {
  // A cube is solved if every cubie sits back at an "identity-ish"
  // orientation for its position — simplest robust check: each sticker's
  // world-facing direction (position-derived) must match its original
  // face. Since colors never move relative to the cubie, checking that
  // every cubie's quaternion is a multiple of 90 degrees on each axis is
  // enough combined with position being back to a valid grid cell — but
  // the simplest sufficient check for a shuffle-then-solve game is: every
  // cubie's rotated "up" vector for each of its colored faces still
  // points along that face's original axis.
  const identityAxes: [Vector3, keyof Cubie["colors"]][] = [
    [new Vector3(1, 0, 0), "px"],
    [new Vector3(-1, 0, 0), "nx"],
    [new Vector3(0, 1, 0), "py"],
    [new Vector3(0, -1, 0), "ny"],
    [new Vector3(0, 0, 1), "pz"],
    [new Vector3(0, 0, -1), "nz"],
  ];
  const EPS = 1e-3;
  for (const cubie of cubies) {
    for (const [dir, face] of identityAxes) {
      if (!cubie.colors[face]) continue;
      const rotated = dir.clone().applyQuaternion(cubie.quaternion);
      if (rotated.distanceTo(dir) > EPS) return false;
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
      name = MOVE_NAMES[Math.floor(Math.random() * MOVE_NAMES.length)];
      move = MOVE_TABLE[name];
    } while (move.axis === lastAxis); // avoid back-to-back same-axis moves
    lastAxis = move.axis;
    moves.push(name);
  }
  return moves;
}
