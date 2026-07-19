import { forwardRef } from "react";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";
import type { Cubie as CubieModel } from "../cube/cubeModel";

const BODY_SIZE = 0.94;
const BODY_RADIUS = 0.1;
const STICKER_SIZE = 0.76;
const STICKER_DEPTH = 0.06;
const STICKER_RADIUS = 0.02;
const HALF = BODY_SIZE / 2;
const BODY_COLOR = "#f4f6f9";

const STICKER_TRANSFORMS: Record<
  keyof CubieModel["colors"],
  { position: [number, number, number]; rotation: [number, number, number] }
> = {
  px: { position: [HALF - STICKER_DEPTH / 2 + 0.001, 0, 0], rotation: [0, Math.PI / 2, 0] },
  nx: { position: [-HALF + STICKER_DEPTH / 2 - 0.001, 0, 0], rotation: [0, -Math.PI / 2, 0] },
  py: { position: [0, HALF - STICKER_DEPTH / 2 + 0.001, 0], rotation: [-Math.PI / 2, 0, 0] },
  ny: { position: [0, -HALF + STICKER_DEPTH / 2 - 0.001, 0], rotation: [Math.PI / 2, 0, 0] },
  pz: { position: [0, 0, HALF - STICKER_DEPTH / 2 + 0.001], rotation: [0, 0, 0] },
  nz: { position: [0, 0, -HALF + STICKER_DEPTH / 2 - 0.001], rotation: [0, Math.PI, 0] },
};

interface CubieProps {
  cubieId: number;
  colors: CubieModel["colors"];
}

export const Cubie = forwardRef<THREE.Group, CubieProps>(({ cubieId, colors }, ref) => {
  return (
    <group ref={ref} userData={{ cubieId }}>
      <RoundedBox
        args={[BODY_SIZE, BODY_SIZE, BODY_SIZE]}
        radius={BODY_RADIUS}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial color={BODY_COLOR} roughness={0.55} metalness={0} clearcoat={0.15} />
      </RoundedBox>
      {(Object.keys(STICKER_TRANSFORMS) as (keyof CubieModel["colors"])[]).map((face) => {
        const color = colors[face];
        if (!color) return null;
        const { position, rotation } = STICKER_TRANSFORMS[face];
        return (
          <RoundedBox
            key={face}
            args={[STICKER_SIZE, STICKER_SIZE, STICKER_DEPTH]}
            radius={STICKER_RADIUS}
            smoothness={4}
            position={position}
            rotation={rotation}
            userData={{ isSticker: true }}
          >
            <meshPhysicalMaterial
              color={color}
              roughness={0.3}
              metalness={0}
              clearcoat={0.6}
              clearcoatRoughness={0.25}
            />
          </RoundedBox>
        );
      })}
    </group>
  );
});
Cubie.displayName = "Cubie";
