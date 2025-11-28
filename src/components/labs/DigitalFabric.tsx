'use client';

import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, MeshTransmissionMaterial, OrbitControls, PerspectiveCamera, Lightformer, Float } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// --- Wave Simulation Logic ---

const FabricMesh = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  // Using a lower resolution for performance since we calculate in JS
  // 64x64 segments = ~4k vertices
  const geometryRef = useRef<THREE.PlaneGeometry>(null);
  
  // Store initial positions to calculate offset from
  const originalPositions = useRef<Float32Array | null>(null);

  useFrame(({ clock, pointer }) => {
    if (!meshRef.current || !geometryRef.current) return;

    const t = clock.getElapsedTime();
    const geometry = geometryRef.current;
    const positionAttribute = geometry.attributes.position;
    
    // Cache original positions once
    if (!originalPositions.current) {
      originalPositions.current = positionAttribute.array.slice() as Float32Array;
    }

    const positions = positionAttribute.array;
    const originals = originalPositions.current;
    
    // Wave parameters
    // We combine multiple sine waves to simulate "fluid" motion
    const wave1 = 0.5; // Amplitude
    const freq1 = 0.8;
    const speed1 = 1.0;
    
    const wave2 = 0.2;
    const freq2 = 2.0;
    const speed2 = 1.5;

    // Mouse influence
    const mx = pointer.x * 2;
    const my = pointer.y * 2;

    for (let i = 0; i < positionAttribute.count; i++) {
      const x = originals[i * 3];
      const y = originals[i * 3 + 1];
      // z is index + 2
      
      // Calculate distance from center/mouse for interaction
      const dist = Math.sqrt((x - mx) ** 2 + (y - my) ** 2);
      const mouseInfluence = Math.max(0, 1.5 - dist) * 0.5; // 0 to 0.5

      // Complex wave function
      // Z-displacement
      let z = 
        Math.sin(x * freq1 + t * speed1) * Math.cos(y * freq1 + t * speed1 * 0.8) * wave1 +
        Math.sin(x * freq2 - t * speed2) * Math.cos(y * freq2 * 1.5 + t * speed2) * wave2;
      
      // Add mouse ripple
      z += Math.sin(dist * 5 - t * 5) * mouseInfluence;

      // Apply to position
      positions[i * 3 + 2] = z;
    }

    // Mark as needing update
    positionAttribute.needsUpdate = true;
    
    // Recompute normals for correct lighting/refraction
    geometry.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} rotation={[0, 0, 0]}>
      <planeGeometry ref={geometryRef} args={[5, 3, 48, 48]} />
      {/* 
        MeshTransmissionMaterial: The "Liquid Glass" look.
        - transmission: How much light passes through (1 = clear glass)
        - thickness: Refraction depth
        - roughness: Surface blur
        - chromaticAberration: The "glitch" color splitting at edges
      */}
      <MeshTransmissionMaterial 
        backside={true}
        thickness={0.5}
        roughness={0.2}
        transmission={1.0}
        ior={1.2} // Index of Refraction (Water/Glass-like)
        chromaticAberration={0.1} // High for that "digital" look
        anisotropy={0.5}
        distortion={0.5} // Add internal distortion
        distortionScale={0.5}
        temporalDistortion={0.2}
        color="#ffffff" // Base tint (white allows environment color)
        metalness={0.1}
        resolution={512} // Resolution of the refraction buffer
      />
    </mesh>
  );
};

// --- Scene Environment ---

export const DigitalFabric = () => {
  return (
    <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-white/5 bg-[#050505] group">
      <Suspense
        fallback={
          <div className="absolute inset-0 flex items-center justify-center text-xs tracking-[0.3em] text-liquid-chrome/40 uppercase">
            Initialising Fluid Dynamics...
          </div>
        }
      >
        <Canvas 
          camera={{ position: [0, 0, 3], fov: 45 }} 
          dpr={[1, 2]}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        >
          <color attach="background" args={['#050505']} />
          
          <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
            <FabricMesh />
          </Float>

          {/* Lighting Environment for Refractions */}
          <Environment resolution={512}>
            {/* Create a custom "studio" with light formers for clean reflections */}
            <group rotation={[-Math.PI / 4, -0.3, 0]}>
              <Lightformer intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
              <Lightformer intensity={4} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[10, 2, 1]} />
              <Lightformer intensity={4} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={[10, 2, 1]} />
              <Lightformer intensity={4} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={[20, 2, 1]} color="#FFC1B6" /> {/* Skin tone accent */}
              <Lightformer type="ring" intensity={20} rotation-y={Math.PI / 2} position={[-0.1, -1, -5]} scale={10} color="#E0E0E0" />
            </group>
          </Environment>

          <EffectComposer>
            <Bloom luminanceThreshold={1.2} intensity={0.8} radius={0.5} />
          </EffectComposer>
          
          <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 1.5} minPolarAngle={Math.PI / 3} />
        </Canvas>
      </Suspense>
      
      {/* UI Overlay */}
      <div className="absolute bottom-4 right-4 font-mono text-[9px] text-liquid-chrome/30 tracking-widest uppercase opacity-50 group-hover:opacity-100 transition-opacity">
        Material: Liquid_Glass_v2 · Physics: Sine_Wave_Superposition
      </div>
      <div className="absolute top-4 left-4 font-mono text-[9px] text-skin tracking-widest uppercase opacity-70">
        Drag to Orbit · Hover to Ripple
      </div>
    </div>
  );
};
