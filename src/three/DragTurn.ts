import * as THREE from "three";
import type { Axis, Move } from "../cube/cubeModel";
import { AXIS_VECTOR } from "../cube/cubeModel";
import { MOVE_TABLE } from "../cube/cubeModel";

export interface DragTurnResult {
  axis: Axis;
  layer: -1 | 1;
  direction: 1 | -1;
}

const AXES: Axis[] = ["x", "y", "z"];

function dominantAxis(v: THREE.Vector3, exclude?: Axis): { axis: Axis; sign: number } {
  let best: Axis = "x";
  let bestAbs = -Infinity;
  for (const ax of AXES) {
    if (ax === exclude) continue;
    if (Math.abs(v[ax]) > bestAbs) {
      bestAbs = Math.abs(v[ax]);
      best = ax;
    }
  }
  return { axis: best, sign: Math.sign(v[best]) || 1 };
}

export function inferTurn(
  dragDelta: THREE.Vector2,
  faceNormal: THREE.Vector3,
  cubieWorldPos: THREE.Vector3,
  camera: THREE.Camera
): DragTurnResult | null {
  // Camera basis vectors in world space
  const camRight = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  const camUp = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);

  // World-space drag vector
  const dragWorld = camRight
    .clone()
    .multiplyScalar(dragDelta.x)
    .addScaledVector(camUp, -dragDelta.y)
    .normalize();

  // Remove faceNormal component — project drag onto the face plane
  dragWorld.addScaledVector(faceNormal, -dragWorld.dot(faceNormal));
  if (dragWorld.length() < 1e-4) return null;
  dragWorld.normalize();

  // The face this sticker belongs to
  const faceAxisInfo = dominantAxis(faceNormal);
  const faceAxis = faceAxisInfo.axis;

  // The direction the user dragged (axis-aligned, excluding face axis)
  const dragAxisInfo = dominantAxis(dragWorld, faceAxis);
  const dragAxis = dragAxisInfo.axis;
  const dragSign = dragAxisInfo.sign;

  // Rotation axis = faceNormal cross dragDir
  const faceVec = AXIS_VECTOR[faceAxis].clone().multiplyScalar(faceAxisInfo.sign);
  const dragVec = AXIS_VECTOR[dragAxis].clone().multiplyScalar(dragSign);
  const rotWorld = new THREE.Vector3().crossVectors(faceVec, dragVec);

  const rotAxisInfo = dominantAxis(rotWorld, undefined);
  const rotAxis = rotAxisInfo.axis;
  const rotSign = Math.sign(rotWorld[rotAxis]) || 1;

  // Layer = which slice along rotAxis the cubie belongs to
  const layerVal = Math.round(cubieWorldPos[rotAxis]);
  if (layerVal === 0) return null;
  const layer = (layerVal > 0 ? 1 : -1) as -1 | 1;

  // Direction: positive rotSign with positive layer → check against MOVE_TABLE convention
  // We need to find the move that matches axis+layer and determine which direction sign
  // is "clockwise" per our convention, then adjust for rotSign * layer sign
  const rawDir = rotSign * (layerVal > 0 ? 1 : -1);
  const direction = (rawDir >= 0 ? 1 : -1) as 1 | -1;

  // Validate this matches a known move
  const validMove = Object.values(MOVE_TABLE).some(
    (m) => m.axis === rotAxis && m.layer === layer
  );
  if (!validMove) return null;

  return { axis: rotAxis, layer, direction };
}
