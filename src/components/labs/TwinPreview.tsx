'use client';

import { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PresentationControls } from '@react-three/drei';
import * as THREE from 'three';

const AvatarFigure = ({ identity }: { identity: number }) => {
  const bodyRef = useRef<THREE.Mesh>(null);
  const chromeRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const waver = Math.sin(clock.elapsedTime * 0.6) * 0.05;
    if (bodyRef.current) {
      bodyRef.current.rotation.y = waver;
      const skinMaterial = bodyRef.current.material as THREE.MeshPhysicalMaterial;
      skinMaterial.color.setRGB(1 - identity * 0.3, 0.8 - identity * 0.4, 0.75 - identity * 0.4);
      skinMaterial.transmission = 0.3 + identity * 0.4;
    }
    if (chromeRef.current) {
      chromeRef.current.visible = identity > 0.1;
      chromeRef.current.scale.setScalar(1 + identity * 0.05);
    }
  });

  return (
    <group>
      <mesh ref={bodyRef} castShadow>
        <capsuleGeometry args={[0.4, 1.6, 32, 64]} />
        <meshPhysicalMaterial
          roughness={0.15}
          metalness={0.1}
          transmission={0.35}
          thickness={0.5}
          envMapIntensity={1}
        />
      </mesh>
      <mesh ref={chromeRef} position={[0, 0.2, 0]}>
        <icosahedronGeometry args={[0.45, 1]} />
        <meshStandardMaterial
          color="#d8d8ff"
          metalness={1}
          roughness={0.1}
          emissiveIntensity={identity * 0.5}
        />
      </mesh>
    </group>
  );
};

export const TwinPreview = () => {
  const [identityBlend, setIdentityBlend] = useState(0.35);

  return (
    <div className="flex flex-col gap-6">
      <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-white/5 bg-black/60">
        <Suspense
          fallback={
            <div className="absolute inset-0 flex items-center justify-center text-xs tracking-[0.3em] text-liquid-chrome/40 uppercase">
              Spawning meta-human...
            </div>
          }
        >
          <Canvas camera={{ position: [0, 0.8, 3.2], fov: 35 }} dpr={[1, 2]}>
            <color attach="background" args={['#050505']} />
            <ambientLight intensity={0.4} />
            <spotLight position={[4, 6, 3]} intensity={2.5} angle={0.4} penumbra={0.6} />
            <PresentationControls global config={{ mass: 2, tension: 400 }} rotation={[0, 0, 0]} polar={[-0.1, 0.2]}>
              <AvatarFigure identity={identityBlend} />
            </PresentationControls>
            <Environment preset="city" />
          </Canvas>
        </Suspense>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-mono tracking-[0.2em] text-liquid-chrome/70 uppercase">
          <span>Human</span>
          <span>Digital</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={identityBlend}
          onChange={(event) => setIdentityBlend(Number(event.target.value))}
          className="w-full accent-skin"
        />
        <p className="font-mono text-[11px] tracking-[0.2em] text-liquid-chrome/60 uppercase">
          Identity mix: {(identityBlend * 100).toFixed(0)}%
        </p>
      </div>
    </div>
  );
};

