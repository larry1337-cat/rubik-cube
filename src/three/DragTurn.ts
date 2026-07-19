import * as THREE from "three";
import type { Axis } from "../cube/cubeModel";
import { AXIS_VECTOR, MOVE_TABLE } from "../cube/cubeModel";

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
  const camRight = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  const camUp = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);

  const dragWorld = camRight
    .clone()
    .multiplyScalar(dragDelta.x)
    .addScaledVector(camUp, dragDelta.y)
    .normalize();

  dragWorld.addScaledVector(faceNormal, -dragWorld.dot(faceNormal));
  if (dragWorld.length() < 1e-4) return null;
  dragWorld.normalize();

  const faceAxisInfo = dominantAxis(faceNormal);
  const faceAxis = faceAxisInfo.axis;

  const dragAxisInfo = dominantAxis(dragWorld, faceAxis);
  const dragAxis = dragAxisInfo.axis;
  const dragSign = dragAxisInfo.sign;

  const faceVec = AXIS_VECTOR[faceAxis].clone().multiplyScalar(faceAxisInfo.sign);
  const dragVec = AXIS_VECTOR[dragAxis].clone().multiplyScalar(dragSign);
  const rotWorld = new THREE.Vector3().crossVectors(faceVec, dragVec);

  const rotAxisInfo = dominantAxis(rotWorld);
  const rotAxis = rotAxisInfo.axis;
  const rotSign = Math.sign(rotWorld[rotAxis]) || 1;

  const layerVal = Math.round(cubieWorldPos[rotAxis]);
  if (layerVal === 0) return null;
  const layer = (layerVal > 0 ? 1 : -1) as -1 | 1;

  const direction = (rotSign > 0 ? -1 : 1) as 1 | -1;

  const validMove = Object.values(MOVE_TABLE).some(
    (m) => m.axis === rotAxis && m.layer === layer
  );
  if (!validMove) return null;

  return { axis: rotAxis, layer, direction };
}
