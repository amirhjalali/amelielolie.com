'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Canvas } from '@react-three/fiber';
import { Environment, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const FabricMesh = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Create geometry with high segment count for smooth ripples
  const geometry = useMemo(() => new THREE.PlaneGeometry(4, 4, 64, 64), []);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();
    const positions = meshRef.current.geometry.attributes.position;

    // Animate vertices
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);

      // Calculate wave effect
      // Combine multiple sine waves for organic look
      const wave1 = 0.5 * Math.sin(x * 2 + time * 1.5);
      const wave2 = 0.2 * Math.sin(y * 3 + time * 2);
      const wave3 = 0.1 * Math.sin((x + y) * 4 + time);

      // Apply displacement to Z axis
      positions.setZ(i, wave1 + wave2 + wave3);
    }

    positions.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 3, 0, 0]}>
      <meshPhysicalMaterial
        color="#e0e0e0"
        roughness={0.2}
        metalness={0.1}
        transmission={0.9} // Glass-like transparency
        thickness={2} // Refraction
        clearcoat={1}
        clearcoatRoughness={0.1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

export const DigitalFabric = () => {
  return (
    <div className="w-full h-full min-h-[500px] relative">
      <Canvas dpr={[1, 2]} shadows>
        <PerspectiveCamera makeDefault position={[0, 2, 5]} fov={50} />

        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ffb2b2" /> {/* Warm underlight */}

        <Environment preset="studio" />

        <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 2} />

        <FabricMesh />
      </Canvas>

      <div className="absolute bottom-4 right-4 pointer-events-none">
        <span className="font-mono text-xs text-liquid-chrome/50">
          SIMULATION // VERTEX DISPLACEMENT
        </span>
      </div>
    </div>
  );
};
