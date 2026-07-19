import { useRef, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { TrackballControls, ContactShadows } from "@react-three/drei";
import { Cube3D } from "./Cube3D";

export function Scene() {
  const trackballRef = useRef<any>(null);

  const handleDragStart = useCallback(() => {
    if (trackballRef.current) trackballRef.current.enabled = false;
  }, []);

  const handleDragEnd = useCallback(() => {
    if (trackballRef.current) trackballRef.current.enabled = true;
  }, []);

  return (
    <Canvas
      shadows
      camera={{ position: [4.2, 3.6, 5.2], fov: 40 }}
      gl={{ antialias: true }}
    >
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
        ref={trackballRef}
        noPan
        minDistance={4}
        maxDistance={11}
        rotateSpeed={3.2}
        dynamicDampingFactor={0.12}
      />
    </Canvas>
  );
}
