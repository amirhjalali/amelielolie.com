'use client';

import { Suspense, useRef } from 'react';
import { Canvas, extend, useFrame, ThreeElements } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

const FluidShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uMouse: new THREE.Vector2(0.5, 0.5),
    uResolution: new THREE.Vector2(1, 1),
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
      
      vec2 flow = vec2(
        fbm(uv * 3.0 + uTime * 0.1 + vec2(uMouse.x, 0.0)),
        fbm(uv * 3.0 + uTime * 0.15 + vec2(0.0, uMouse.y))
      );
      
      // RGB Shift
      float shift = interaction * 0.05 + 0.01;
      
      float r = fbm(uv * 5.0 + flow + shift);
      float g = fbm(uv * 5.0 + flow);
      float b = fbm(uv * 5.0 + flow - shift);
      
      vec3 color = vec3(r, g, b);
      
      // Color Grading (Cyberpunk / Void)
      color = pow(color, vec3(3.0)); // Contrast
      color *= vec3(1.2, 0.8, 1.5); // Tint
      
      // Vignette
      float vig = 1.0 - smoothstep(0.0, 1.5, distance(uv, vec2(0.5)));
      color *= vig;
      
      // Scanline effect
      float scanline = sin(uv.y * 200.0 + uTime * 10.0) * 0.05;
      color += scanline;

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
    };
  }
}

const FluidPlane = () => {
  const materialRef = useRef<any>(null);
  const targetMouse = useRef(new THREE.Vector2(0.5, 0.5));

  useFrame(({ clock }) => {
    if (!materialRef.current) return;
    materialRef.current.uTime = clock.getElapsedTime();
    materialRef.current.uMouse.lerp(targetMouse.current, 0.1);
  });

  return (
    <mesh
      onPointerMove={(event) => {
        if (!event.uv) return;
        targetMouse.current.set(event.uv.x, event.uv.y);
      }}
    >
      <planeGeometry args={[4, 2.2]} />
      <fluidShaderMaterial ref={materialRef} transparent />
    </mesh>
  );
};

export const FluidMirror = () => {
  return (
    <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-white/5 bg-void">
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
        </Canvas>
      </Suspense>
      <div className="absolute bottom-4 right-4 font-mono text-[9px] text-liquid-chrome/30 tracking-widest uppercase">
        Input: Cursor Position
      </div>
    </div>
  );
};
