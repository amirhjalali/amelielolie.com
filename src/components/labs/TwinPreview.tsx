'use client';

import { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, PerspectiveCamera, Float, Sparkles, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

const AvatarEntity = ({ identity }: { identity: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const wireframeRef = useRef<THREE.Mesh>(null);
  const solidRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.2;
      groupRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.3) * 0.1;
    }
    
    // Pulse effect for wireframe
    if (wireframeRef.current) {
       const material = wireframeRef.current.material as THREE.MeshBasicMaterial;
       material.opacity = 0.1 + Math.sin(clock.getElapsedTime() * 2.0) * 0.05 + (1.0 - identity) * 0.2;
       
       // Expand wireframe slightly based on identity
       const scale = 1.0 + (identity * 0.1);
       wireframeRef.current.scale.setScalar(scale);
    }
    
    // Identity blend logic
    if (solidRef.current) {
        solidRef.current.scale.setScalar(0.95);
        const material = solidRef.current.material as THREE.MeshPhysicalMaterial;
        
        // Transition from "Human Skin" to "Digital Chrome"
        // Identity 0 = Human, 1 = Digital
        
        const humanColor = new THREE.Color('#FFC1B6'); // Skin
        const digitalColor = new THREE.Color('#E0E0E0'); // Chrome
        
        material.color.lerpColors(humanColor, digitalColor, identity);
        material.metalness = identity * 1.0; // 0 to 1
        material.roughness = 0.35 - (identity * 0.25); // 0.35 (skin) to 0.1 (chrome)
        material.transmission = 0.2 * (1.0 - identity); // Skin has some subsurface scattering-like transmission
        material.clearcoat = identity;
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        {/* The Complex Geometry Entity */}
        <mesh ref={solidRef}>
          <torusKnotGeometry args={[0.8, 0.25, 128, 64]} />
          <meshPhysicalMaterial 
            color="#FFC1B6"
            roughness={0.4}
            metalness={0.0}
            clearcoat={0.5}
            clearcoatRoughness={0.1}
          />
        </mesh>

        {/* The Digital Construct Wireframe */}
        <mesh ref={wireframeRef}>
          <torusKnotGeometry args={[0.8, 0.25, 64, 16]} />
          <meshBasicMaterial 
            color="#E0E0E0" 
            wireframe 
            transparent 
            opacity={0.1} 
          />
        </mesh>
        
        {/* Internal Particles representing 'soul' or 'data' */}
        <Sparkles 
            count={50} 
            scale={2} 
            size={2} 
            speed={0.4} 
            opacity={0.5} 
            color={identity > 0.5 ? "#E0E0E0" : "#FFC1B6"} 
        />
      </Float>
    </group>
  );
};

export const TwinPreview = () => {
  const [identityBlend, setIdentityBlend] = useState(0.5);

  return (
    <div className="flex flex-col gap-6">
      <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-white/5 bg-gradient-to-b from-obsidian to-void">
        <Suspense
          fallback={
            <div className="absolute inset-0 flex items-center justify-center text-xs tracking-[0.3em] text-liquid-chrome/40 uppercase">
              Constructing Geometry...
            </div>
          }
        >
          <Canvas dpr={[1, 2]}>
            <PerspectiveCamera makeDefault position={[0, 0, 4]} />
            
            <color attach="background" args={['#050505']} />
            
            {/* Lighting Setup */}
            <ambientLight intensity={0.2} />
            <spotLight position={[5, 5, 5]} intensity={1.5} angle={0.3} penumbra={1} color="#ffffff" />
            <spotLight position={[-5, -5, -5]} intensity={0.5} color="#FFC1B6" />
            <pointLight position={[0, 0, 3]} intensity={0.5} color="#E0E0E0" distance={5} />
            
            <AvatarEntity identity={identityBlend} />
            
            <Environment preset="city" />
            <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
            <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
            
            {/* Floating dust/data particles in the environment */}
            <Sparkles count={100} scale={8} size={1} speed={0.2} opacity={0.2} color="#ffffff" />
          </Canvas>
        </Suspense>
        
        <div className="absolute top-4 left-4 font-mono text-[9px] text-skin tracking-widest uppercase opacity-70">
           Subject: Torus_Knot_001
        </div>
      </div>

      <div className="space-y-4 p-4 rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm">
        <div className="flex justify-between text-xs font-mono tracking-[0.2em] text-liquid-chrome/70 uppercase">
          <span>Biological</span>
          <span>Synthetic</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={identityBlend}
          onChange={(event) => setIdentityBlend(Number(event.target.value))}
          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-skin hover:accent-white transition-all"
        />
        <div className="flex justify-between items-center border-t border-white/10 pt-3 mt-2">
            <p className="font-mono text-[10px] tracking-[0.2em] text-liquid-chrome/40 uppercase">
              Interpolation
            </p>
            <p className="font-mono text-[11px] tracking-[0.2em] text-skin uppercase">
              {(identityBlend * 100).toFixed(0)}%
            </p>
        </div>
      </div>
    </div>
  );
};
