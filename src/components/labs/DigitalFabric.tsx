'use client';

import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';

const SilkMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorA: new THREE.Color('#f4cbc0'),
    uColorB: new THREE.Color('#fbeee8'),
  },
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* glsl */ `
    uniform float uTime;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p){
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = hash(i);
      float b = hash(i + vec2(1.0,0.0));
      float c = hash(i + vec2(0.0,1.0));
      float d = hash(i + vec2(1.0,1.0));
      vec2 u = f*f*(3.0-2.0*f);
      return mix(a, b, u.x) + (c - a)*u.y*(1.0 - u.x) + (d - b)*u.x*u.y;
    }

    void main() {
      vec3 lightDir = normalize(vec3(0.3, 0.8, 0.6));
      float diffuse = max(dot(normalize(vNormal), lightDir), 0.0);
      float fresnel = pow(1.0 - dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 2.0);

      float wavePattern = sin(vUv.x * 18.0 + uTime * 1.8) * 0.5 + 0.5;
      float silkNoise = noise(vUv * 8.0 + uTime * 0.2);
      float highlight = smoothstep(0.8, 1.0, diffuse + silkNoise * 0.2);

      vec3 baseColor = mix(uColorA, uColorB, wavePattern);
      vec3 sheenColor = mix(vec3(0.95, 0.78, 0.95), vec3(0.8, 0.9, 1.0), wavePattern);
      vec3 color = baseColor + fresnel * 0.25 + sheenColor * highlight * 0.2;
      color *= 0.6 + diffuse * 0.4;

      gl_FragColor = vec4(color, 0.97);
    }
  `
);

extend({ SilkMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      silkMaterial: React.ComponentProps<typeof SilkMaterial>;
    }
  }
}

const FabricPlane = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const basePositions = useRef<Float32Array | null>(null);

  useEffect(() => {
    if (!meshRef.current) return;
    const geometry = meshRef.current.geometry as THREE.BufferGeometry;
    const position = geometry.attributes.position as THREE.BufferAttribute;
    basePositions.current = new Float32Array(position.array);
  }, []);

  useFrame(({ clock, mouse }) => {
    if (!meshRef.current) return;

    const geometry = meshRef.current.geometry as THREE.BufferGeometry;
    const position = geometry.attributes.position as THREE.BufferAttribute;
    if (!position || !basePositions.current) return;

    const t = clock.getElapsedTime();

    for (let i = 0; i < position.count; i++) {
      const idx = i * 3;
      const x = basePositions.current[idx];
      const y = basePositions.current[idx + 1];
      const baseZ = basePositions.current[idx + 2];

      const waveX = Math.sin(x * 2.2 + t * 1.1) * 0.09;
      const waveY = Math.cos(y * 2.8 + t * 0.7) * 0.07;
      const mouseInfluence = mouse.x * 0.12 * Math.sin((y + t) * 2.5);

      position.setZ(i, baseZ + waveX + waveY + mouseInfluence);
    }

    position.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.attributes.normal.needsUpdate = true;

    meshRef.current.rotation.x = -0.35 + mouse.y * 0.1;
    meshRef.current.rotation.y = mouse.x * 0.15;
  });

  const materialRef = useRef<any>(null);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uTime = clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-0.2, 0.3, 0]}>
      <planeGeometry args={[4.2, 2.6, 220, 220]} />
      <silkMaterial ref={materialRef} transparent />
    </mesh>
  );
};

export const DigitalFabric = () => {
  return (
    <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-white/5 bg-black/40">
      <Suspense
        fallback={
          <div className="absolute inset-0 flex items-center justify-center text-xs tracking-[0.3em] text-liquid-chrome/40 uppercase">
            Initializing cloth solver...
          </div>
        }
      >
        <Canvas camera={{ position: [0, 0.5, 4.4], fov: 30 }} dpr={[1, 2]}>
          <color attach="background" args={['#080606']} />
          <fog attach="fog" args={['#050505', 4, 10]} />
          <ambientLight intensity={0.5} color="#fdf2f0" />
          <spotLight position={[3, 4, 3]} angle={0.5} penumbra={0.7} intensity={1.6} color="#ffffff" />
          <spotLight position={[-3, 3, -3]} angle={0.4} intensity={0.6} color="#b297ff" />
          <pointLight position={[0, 1.5, 2]} intensity={1.2} color="#ffe8de" distance={6} />
          <FabricPlane />
          <Environment preset="apartment" />
        </Canvas>
      </Suspense>
    </div>
  );
};

