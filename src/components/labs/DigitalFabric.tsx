'use client';

import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, useTexture, MeshTransmissionMaterial } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';

// Vertex shader for organic cloth movement
const vertexShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vElevation;

  //	Simplex 3D Noise 
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

  float snoise(vec3 v){ 
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 =   v - i + dot(i, C.xxx) ;

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1. + 3.0 * C.xxx;

    i = mod(i, 289.0 ); 
    vec4 p = permute( permute( permute( 
              i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
            + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

    float n_ = 1.0/7.0;
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    vUv = uv;
    
    vec3 pos = position;
    
    // Multi-octave noise for organic cloth feel
    float t = uTime * 0.3;
    
    // Large slow waves
    float wave1 = snoise(vec3(pos.x * 0.5, pos.y * 0.5, t * 0.5)) * 1.2;
    
    // Medium detail
    float wave2 = snoise(vec3(pos.x * 1.5, pos.y * 1.5, t * 0.8)) * 0.4;
    
    // Fine ripples
    float wave3 = snoise(vec3(pos.x * 4.0, pos.y * 4.0, t * 1.5)) * 0.15;
    
    // Mouse interaction - creates a "push" effect
    float mouseX = uMouse.x * 2.0 - 1.0;
    float mouseY = uMouse.y * 2.0 - 1.0;
    float distToMouse = distance(vec2(pos.x / 3.0, pos.y / 2.0), vec2(mouseX, mouseY));
    float mouseWave = smoothstep(0.8, 0.0, distToMouse) * sin(distToMouse * 15.0 - uTime * 8.0) * 0.5;
    
    float elevation = wave1 + wave2 + wave3 + mouseWave;
    vElevation = elevation;
    
    pos.z += elevation;
    
    // Compute normals for lighting
    float eps = 0.01;
    float nx = snoise(vec3((pos.x + eps) * 0.5, pos.y * 0.5, t * 0.5)) - snoise(vec3((pos.x - eps) * 0.5, pos.y * 0.5, t * 0.5));
    float ny = snoise(vec3(pos.x * 0.5, (pos.y + eps) * 0.5, t * 0.5)) - snoise(vec3(pos.x * 0.5, (pos.y - eps) * 0.5, t * 0.5));
    
    vec3 computedNormal = normalize(vec3(-nx * 20.0, -ny * 20.0, 1.0));
    vNormal = normalize(normalMatrix * computedNormal);
    vPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColorDeep;
  uniform vec3 uColorMid;
  uniform vec3 uColorHighlight;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vElevation;

  void main() {
    vec3 viewDir = normalize(-vPosition);
    vec3 normal = normalize(vNormal);
    
    // Fresnel for edge glow
    float fresnel = pow(1.0 - max(0.0, dot(viewDir, normal)), 4.0);
    
    // Specular highlights
    vec3 lightDir1 = normalize(vec3(1.0, 1.0, 1.0));
    vec3 lightDir2 = normalize(vec3(-1.0, 0.5, 0.5));
    
    vec3 halfVec1 = normalize(lightDir1 + viewDir);
    vec3 halfVec2 = normalize(lightDir2 + viewDir);
    
    float spec1 = pow(max(0.0, dot(normal, halfVec1)), 64.0);
    float spec2 = pow(max(0.0, dot(normal, halfVec2)), 32.0);
    
    // Color based on elevation (folds catch light differently)
    float elevNorm = vElevation * 0.5 + 0.5;
    vec3 baseColor = mix(uColorDeep, uColorMid, elevNorm);
    
    // Add iridescence based on view angle and position
    float iridescence = sin(vUv.x * 20.0 + vUv.y * 15.0 + uTime * 0.5) * 0.5 + 0.5;
    vec3 iridescentColor = mix(
      vec3(0.95, 0.7, 0.8),  // Warm pink
      vec3(0.7, 0.8, 0.95),  // Cool blue
      iridescence
    );
    
    // Combine
    vec3 color = baseColor;
    color += fresnel * iridescentColor * 0.6;
    color += uColorHighlight * spec1 * 1.5;
    color += vec3(0.9, 0.7, 0.8) * spec2 * 0.5;
    
    // Subtle subsurface scattering fake
    float sss = max(0.0, dot(-viewDir, lightDir1)) * 0.1;
    color += uColorMid * sss;
    
    gl_FragColor = vec4(color, 0.95);
  }
`;

const SilkCloth = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const targetMouse = useRef(new THREE.Vector2(0.5, 0.5));
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uColorDeep: { value: new THREE.Color('#1a0a10') },      // Deep burgundy shadow
    uColorMid: { value: new THREE.Color('#e8c4c4') },       // Soft blush
    uColorHighlight: { value: new THREE.Color('#ffffff') }, // Pure white highlights
  }), []);

  useFrame(({ clock, pointer }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
      
      // Smooth mouse tracking
      targetMouse.current.lerp(
        new THREE.Vector2((pointer.x + 1) / 2, (pointer.y + 1) / 2),
        0.08
      );
      materialRef.current.uniforms.uMouse.value = targetMouse.current;
    }
    
    if (meshRef.current) {
      // Gentle floating rotation
      meshRef.current.rotation.x = -0.4 + Math.sin(clock.getElapsedTime() * 0.2) * 0.05;
      meshRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.15) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <planeGeometry args={[6, 4, 300, 300]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// Floating particles for atmosphere
const FloatingParticles = () => {
  const count = 100;
  const mesh = useRef<THREE.Points>(null);
  
  const [positions, sizes] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4 + 2;
      sizes[i] = Math.random() * 2 + 0.5;
    }
    
    return [positions, sizes];
  }, []);

  useFrame(({ clock }) => {
    if (mesh.current) {
      mesh.current.rotation.y = clock.getElapsedTime() * 0.02;
      const posArray = mesh.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        posArray[i3 + 1] += Math.sin(clock.getElapsedTime() * 0.5 + i) * 0.001;
      }
      mesh.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#FFC1B6"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
};

export const DigitalFabric = () => {
  return (
    <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-white/5 bg-obsidian group cursor-crosshair">
      <Suspense
        fallback={
          <div className="absolute inset-0 flex items-center justify-center text-xs tracking-[0.3em] text-liquid-chrome/40 uppercase">
            <span className="animate-pulse">Weaving digital silk...</span>
          </div>
        }
      >
        <Canvas 
          camera={{ position: [0, 0, 4], fov: 45 }} 
          dpr={[1, 2]}
          gl={{ 
            toneMapping: THREE.ACESFilmicToneMapping, 
            toneMappingExposure: 1.2,
            antialias: true 
          }}
        >
          <color attach="background" args={['#050505']} />
          
          {/* Dramatic lighting */}
          <ambientLight intensity={0.1} />
          <spotLight 
            position={[5, 5, 5]} 
            angle={0.4} 
            penumbra={1} 
            intensity={2} 
            color="#ffffff"
          />
          <spotLight 
            position={[-5, 3, 2]} 
            angle={0.5} 
            penumbra={1} 
            intensity={1} 
            color="#FFC1B6"
          />
          <pointLight position={[0, -3, 3]} intensity={0.5} color="#E0E0E0" />
          
          <SilkCloth />
          <FloatingParticles />
          
          {/* Post Processing */}
          <EffectComposer>
            <Bloom 
              luminanceThreshold={0.6} 
              luminanceSmoothing={0.9}
              mipmapBlur 
              intensity={0.8} 
            />
            <ChromaticAberration 
              offset={[0.0015, 0.0015]}
              radialModulation={false}
              modulationOffset={0.0}
            />
          </EffectComposer>
        </Canvas>
      </Suspense>
      
      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top left - Title */}
        <div className="absolute top-4 left-4 font-mono text-[10px] text-skin/70 tracking-[0.3em] uppercase">
          Digital Silk v2.0
        </div>
        
        {/* Bottom corners - Stats */}
        <div className="absolute bottom-4 left-4 font-mono text-[9px] text-liquid-chrome/30 tracking-widest uppercase">
          300×300 vertices
        </div>
        <div className="absolute bottom-4 right-4 font-mono text-[9px] text-liquid-chrome/30 tracking-widest uppercase opacity-50 group-hover:opacity-100 transition-opacity">
          Move cursor to interact
        </div>
      </div>
    </div>
  );
};
