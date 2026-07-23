import { useState, useCallback, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { TrackballControls, ContactShadows } from "@react-three/drei";
import { Cube3D } from "./Cube3D";
import { useDeviceType } from "../hooks/useDeviceType";
import type { DeviceType } from "../hooks/useDeviceType";

function cameraFor(device: DeviceType) {
  const touch = device === "touch";
  return {
    position: (touch ? [6.5, 5.5, 8.0] : [4.2, 3.6, 5.2]) as [number, number, number],
    fov: touch ? 44 : 40,
  };
}

function CameraRig({ device }: { device: DeviceType }) {
  const { camera } = useThree();
  useEffect(() => {
    const { position, fov } = cameraFor(device);
    camera.position.set(position[0], position[1], position[2]);
    (camera as THREE.PerspectiveCamera).fov = fov;
    camera.updateProjectionMatrix();
  }, [camera, device]);
  return null;
}

export function Scene() {
  const device = useDeviceType();
  const [dragging, setDragging] = useState(false);

  const handleDragStart = useCallback(() => setDragging(true), []);
  const handleDragEnd = useCallback(() => setDragging(false), []);

  const initial = cameraFor(device);

  return (
    <Canvas
      shadows
      camera={{ position: initial.position, fov: initial.fov }}
      gl={{ antialias: true }}
    >
      <CameraRig device={device} />

      <color attach="background" args={["#eef4f9"]} />
      <fog attach="fog" args={["#eef4f9", 9, 16]} />

      <hemisphereLight args={["#ffffff", "#dce6ee", 0.9]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[5, 8, 4]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-6, 3, -4]} intensity={0.25} />

      <Cube3D onDragStart={handleDragStart} onDragEnd={handleDragEnd} />

      <ContactShadows
        position={[0, -1.8, 0]}
        opacity={0.25}
        scale={10}
        blur={2.6}
        far={3}
        color="#8fa3b3"
      />

      <TrackballControls
        enabled={!dragging}
        noPan
        minDistance={4}
        maxDistance={11}
        rotateSpeed={3.2}
        dynamicDampingFactor={0.12}
      />
    </Canvas>
  );
}
