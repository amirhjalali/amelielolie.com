'use client';

import { Suspense, useRef } from 'react';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

const FluidShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uMouse: new THREE.Vector2(0.5, 0.5),
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

    float noise(vec2 p) {
      return sin(p.x) * sin(p.y);
    }

    void main() {
      vec2 uv = vUv;
      float dist = distance(uv, uMouse);
      float ripple = sin((dist - uTime * 0.4) * 18.0);
      float swirl = noise(uv * 8.0 + uTime * 0.2);
      vec2 offset = normalize(uv - uMouse + 0.0001) * ripple * 0.015;
      uv += offset + swirl * 0.01;

      vec3 base = mix(vec3(0.06, 0.04, 0.09), vec3(0.9, 0.3, 0.5), smoothstep(0.6, 0.0, dist));
      vec3 highlight = vec3(0.8, 0.4, 0.9) * ripple * 0.1;
      vec3 color = base + highlight;

      gl_FragColor = vec4(color, 0.9);
    }
  `
);

extend({ FluidShaderMaterial });

type FluidShaderMaterialImpl = {
  uTime: number;
  uMouse: THREE.Vector2;
} & THREE.ShaderMaterial;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      fluidShaderMaterial: React.ComponentProps<typeof FluidShaderMaterial>;
    }
  }
}

const FluidPlane = () => {
  const materialRef = useRef<FluidShaderMaterialImpl>(null);
  const targetMouse = useRef(new THREE.Vector2(0.5, 0.5));

  useFrame(({ clock }) => {
    if (!materialRef.current) return;
    materialRef.current.uTime = clock.getElapsedTime();
    materialRef.current.uMouse.lerp(targetMouse.current, 0.08);
  });

  return (
    <mesh
      onPointerMove={(event) => {
        if (!event.uv) return;
        targetMouse.current.lerp(new THREE.Vector2(event.uv.x, event.uv.y), 0.5);
      }}
    >
      <planeGeometry args={[4, 2.2, 64, 64]} />
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
            Calibrating mirror...
          </div>
        }
      >
        <Canvas camera={{ position: [0, 0, 1], fov: 25 }}>
          <color attach="background" args={['#030303']} />
          <FluidPlane />
        </Canvas>
      </Suspense>
    </div>
  );
};

