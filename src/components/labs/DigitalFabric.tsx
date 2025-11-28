'use client';

import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

// Simplex Noise for the vertex shader injection
const noiseGLSL = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
`;

const ChromeFabric = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Uniforms for the custom shader injection
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) }
  }), []);

  useFrame((state) => {
    const { clock, pointer } = state;
    uniforms.uTime.value = clock.getElapsedTime();
    // Smooth mouse follow
    uniforms.uMouse.value.lerp(pointer, 0.05);
    
    if (meshRef.current) {
        // Subtle breathing rotation
        meshRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.1) * 0.05;
        meshRef.current.rotation.x = -1.5 + Math.sin(clock.getElapsedTime() * 0.15) * 0.05;
    }
  });

  const onBeforeCompile = (shader: any) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uMouse = uniforms.uMouse;
    
    shader.vertexShader = `
      uniform float uTime;
      uniform vec2 uMouse;
      ${noiseGLSL}
      ${shader.vertexShader}
    `;
    
    // Inject noise into position
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      
      // Base wave
      float noiseVal = snoise(position.xy * 1.5 + uTime * 0.3);
      
      // Detail ripple
      float ripple = snoise(position.xy * 4.0 - uTime * 0.5) * 0.1;
      
      // Mouse interaction wave
      float dist = distance(uv, uMouse * 2.0 + vec2(1.0, 1.0)); // Adjust coordinate space roughly
      float interaction = smoothstep(1.5, 0.0, dist) * sin(dist * 10.0 - uTime * 5.0) * 0.3;
      
      float finalZ = noiseVal * 0.4 + ripple + interaction;
      
      transformed.z += finalZ;
      
      // Recalculate normals for correct lighting on waves (Finite Difference Method approx)
      // This is simplified; for perfect results we'd calculate derivatives of the noise function
      vec3 vNormal = normalize(vec3(
         snoise(vec2(position.x + 0.01, position.y) * 1.5 + uTime * 0.3) - noiseVal,
         snoise(vec2(position.x, position.y + 0.01) * 1.5 + uTime * 0.3) - noiseVal,
         0.01
      ));
      // Use the material's existing normal logic but blend? 
      // Actually standard material handles normal updates if we update 'objectNormal' but usually requires normal map
      // For now, we rely on the high-poly mesh smoothing
      `
    );
  };

  return (
    <mesh ref={meshRef} rotation={[-1.5, 0, 0]} position={[0, -0.2, 0]}>
      <planeGeometry args={[6, 4, 256, 256]} />
      <meshPhysicalMaterial 
        color="#ffffff"
        roughness={0.15}
        metalness={1.0}
        clearcoat={1.0}
        clearcoatRoughness={0.1}
        ior={1.5}
        thickness={2.0}
        transmission={0.0}
        onBeforeCompile={onBeforeCompile}
        envMapIntensity={1.5}
      />
    </mesh>
  );
};

export const DigitalFabric = () => {
  return (
    <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-white/5 bg-obsidian group">
      <Suspense
        fallback={
          <div className="absolute inset-0 flex items-center justify-center text-xs tracking-[0.3em] text-liquid-chrome/40 uppercase">
            Simulating liquid metal...
          </div>
        }
      >
        <Canvas 
            camera={{ position: [0, 0, 4], fov: 40 }} 
            dpr={[1, 2]}
            gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.9 }}
        >
          <color attach="background" args={['#050505']} />
          
          {/* Rich Environment for reflections */}
          <Environment preset="warehouse" />
          
          <ambientLight intensity={0.2} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
          
          <ChromeFabric />
          
          {/* Post Processing for the "Glamour" look */}
          <EffectComposer>
            <Bloom luminanceThreshold={0.8} mipmapBlur intensity={1.2} radius={0.6} />
            <Noise opacity={0.05} />
            <Vignette eskil={false} offset={0.1} darkness={0.5} />
          </EffectComposer>
          
        </Canvas>
      </Suspense>
      
      <div className="absolute bottom-4 right-4 font-mono text-[9px] text-liquid-chrome/30 tracking-widest uppercase transition-opacity duration-300 group-hover:opacity-100 opacity-50">
        Material: Liquid Chrome · Sim: Realtime
      </div>
    </div>
  );
};
