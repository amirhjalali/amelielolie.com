'use client';

import { Suspense, useRef, useMemo } from 'react';
import { Canvas, extend, useFrame, ThreeElements } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import { EffectComposer, ChromaticAberration, Scanline, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';

const FluidShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uMouse: new THREE.Vector2(0.5, 0.5),
    uResolution: new THREE.Vector2(1, 1),
    uColorA: new THREE.Color('#FFC1B6'), // Skin
    uColorB: new THREE.Color('#050505'), // Void
    uColorC: new THREE.Color('#E0E0E0'), // Chrome
  },
  /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* glsl */ `
    varying vec2 vUv;
    uniform float uTime;
    uniform vec2 uMouse;
    uniform vec2 uResolution;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform vec3 uColorC;

    // 2D Noise
    float random (in vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }
    float noise (in vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    float fbm (in vec2 st) {
        float value = 0.0;
        float amplitude = .5;
        float frequency = 0.;
        for (int i = 0; i < 6; i++) {
            value += amplitude * noise(st);
            st *= 2.;
            amplitude *= .5;
        }
        return value;
    }

    void main() {
      vec2 uv = vUv;
      
      // Fluid distortion
      float dist = distance(uv, uMouse);
      float interaction = smoothstep(0.4, 0.0, dist);
      
      // Domain warping
      vec2 q = vec2(0.);
      q.x = fbm( uv + 0.00 * uTime);
      q.y = fbm( uv + vec2(1.0));

      vec2 r = vec2(0.);
      r.x = fbm( uv + 1.0*q + vec2(1.7,9.2)+ 0.15*uTime );
      r.y = fbm( uv + 1.0*q + vec2(8.3,2.8)+ 0.126*uTime);

      float f = fbm(uv + r + vec2(uMouse.x * 0.5, uMouse.y * 0.5));
      
      // Mix colors based on noise
      vec3 color = mix(uColorB, uColorC, clamp(f*f*4.0, 0.0, 1.0));
      color = mix(color, uColorA, clamp(length(q), 0.0, 1.0));
      
      // Add ripple from mouse
      float ripple = sin(dist * 40.0 - uTime * 5.0) * 0.02 * interaction;
      color += vec3(ripple);
      
      // Scanline effect baked in shader (optional, but post processing does it better)
      // float scanline = sin(uv.y * 200.0 + uTime * 10.0) * 0.02;
      // color += scanline;

      gl_FragColor = vec4(color, 1.0);
    }
  `
);

extend({ FluidShaderMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    fluidShaderMaterial: ThreeElements['shaderMaterial'] & {
      uTime?: number;
      uMouse?: THREE.Vector2;
      uResolution?: THREE.Vector2;
      uColorA?: THREE.Color;
      uColorB?: THREE.Color;
      uColorC?: THREE.Color;
    };
  }
}

const FluidPlane = () => {
  const materialRef = useRef<any>(null);
  const targetMouse = useRef(new THREE.Vector2(0.5, 0.5));

  useFrame(({ clock, pointer }) => {
    if (!materialRef.current) return;
    materialRef.current.uTime = clock.getElapsedTime();
    
    // Convert pointer (-1 to 1) to UV (0 to 1)
    const uvX = (pointer.x + 1) / 2;
    const uvY = (pointer.y + 1) / 2;
    
    targetMouse.current.lerp(new THREE.Vector2(uvX, uvY), 0.1);
    materialRef.current.uMouse = targetMouse.current;
  });

  return (
    <mesh>
      <planeGeometry args={[4, 2.2]} />
      <fluidShaderMaterial ref={materialRef} transparent />
    </mesh>
  );
};

export const FluidMirror = () => {
  return (
    <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-white/5 bg-void group">
      <Suspense
        fallback={
          <div className="absolute inset-0 flex items-center justify-center text-xs tracking-[0.3em] text-liquid-chrome/40 uppercase">
            Loading shader buffer...
          </div>
        }
      >
        <Canvas camera={{ position: [0, 0, 1], fov: 25 }}>
          <color attach="background" args={['#030303']} />
          <FluidPlane />
          
          <EffectComposer>
            <ChromaticAberration 
                offset={[0.004, 0.004]} // Static slight shift
                radialModulation={true}
                modulationOffset={0.5}
            />
            <Noise opacity={0.1} />
            <Scanline density={1.5} opacity={0.05} />
          </EffectComposer>
        </Canvas>
      </Suspense>
      <div className="absolute bottom-4 right-4 font-mono text-[9px] text-liquid-chrome/30 tracking-widest uppercase opacity-50 group-hover:opacity-100 transition-opacity">
        Effect: Domain Warping + RGB Shift
      </div>
    </div>
  );
};
