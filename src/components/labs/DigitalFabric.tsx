'use client';

import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame, extend, ThreeElements } from '@react-three/fiber';
import { Environment, shaderMaterial, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const SilkMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorA: new THREE.Color('#E0E0E0'), // Liquid Chrome
    uColorB: new THREE.Color('#050505'), // Obsidian
    uMouse: new THREE.Vector2(0, 0),
    uResolution: new THREE.Vector2(1, 1),
  },
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying float vDisplacement;
    
    uniform float uTime;
    uniform vec2 uMouse;

    // Simplex noise function (simplified)
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

    void main() {
      vUv = uv;
      vec3 pos = position;
      
      // Interaction
      float dist = distance(uv, uMouse);
      float mouseForce = smoothstep(0.5, 0.0, dist) * 1.5;
      
      // Fluid movement
      float noiseVal = snoise(uv * 3.0 + uTime * 0.2);
      float wave = sin(uv.y * 5.0 + uTime) * 0.5;
      
      float displacement = noiseVal * 0.8 + wave * 0.2 + mouseForce * sin(uTime * 5.0) * 0.2;
      vDisplacement = displacement;
      
      // Apply displacement along normal
      pos += normal * displacement * 0.5;
      
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  /* glsl */ `
    uniform float uTime;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying float vDisplacement;

    void main() {
      // Metallic lighting approximation
      vec3 viewDir = normalize(-vPosition); // Assume camera at 0,0,0 in view space
      vec3 normal = normalize(vNormal);
      vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
      
      // Fresnel
      float fresnel = pow(1.0 - max(0.0, dot(viewDir, normal)), 3.0);
      
      // Specular
      vec3 halfVector = normalize(lightDir + viewDir);
      float NdotH = max(0.0, dot(normal, halfVector));
      float specular = pow(NdotH, 32.0);
      
      // Liquid Metal Colors
      vec3 col = mix(uColorB, uColorA, vDisplacement * 0.5 + 0.5);
      
      // Add iridescence/chrome feel
      col += vec3(0.1, 0.2, 0.3) * fresnel * 2.0;
      col += vec3(1.0) * specular * 0.8;
      
      gl_FragColor = vec4(col, 1.0);
    }
  `
);

extend({ SilkMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    silkMaterial: ThreeElements['shaderMaterial'] & {
      uTime?: number;
      uColorA?: THREE.Color;
      uColorB?: THREE.Color;
      uMouse?: THREE.Vector2;
      uResolution?: THREE.Vector2;
    };
  }
}

const FabricPlane = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);
  const targetMouse = useRef(new THREE.Vector2(0.5, 0.5));

  useFrame(({ clock, mouse }) => {
    if (materialRef.current) {
      materialRef.current.uTime = clock.getElapsedTime();
      // Smooth mouse lerp
      targetMouse.current.lerp(mouse, 0.1);
      // Map mouse -1 to 1 range to 0 to 1 uv space roughly
      const uvMouse = new THREE.Vector2(targetMouse.current.x * 0.5 + 0.5, targetMouse.current.y * 0.5 + 0.5);
      materialRef.current.uMouse = uvMouse;
    }
    
    if(meshRef.current) {
       // Slight floating rotation
       meshRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.2) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-0.2, 0, 0]}>
      {/* High res plane for better vertex displacement */}
      <planeGeometry args={[5, 3, 128, 128]} />
      <silkMaterial ref={materialRef} transparent />
    </mesh>
  );
};

export const DigitalFabric = () => {
  return (
    <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-white/5 bg-obsidian">
      <Suspense
        fallback={
          <div className="absolute inset-0 flex items-center justify-center text-xs tracking-[0.3em] text-liquid-chrome/40 uppercase">
            Initializing chrome sim...
          </div>
        }
      >
        <Canvas camera={{ position: [0, 0, 3.5], fov: 45 }} dpr={[1, 2]}>
          <color attach="background" args={['#050505']} />
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={1.0} color="#E0E0E0" />
          <FabricPlane />
          <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 1.5} minPolarAngle={Math.PI / 3} />
        </Canvas>
      </Suspense>
      
      <div className="absolute bottom-4 right-4 font-mono text-[9px] text-liquid-chrome/30 tracking-widest uppercase">
        Interaction: Cursor Move
      </div>
    </div>
  );
};
