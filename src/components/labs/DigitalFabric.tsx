'use client';

import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

const vertexShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying float vFold;

  // Simplex noise
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

  float snoise(vec3 v){ 
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1. + 3.0 * C.xxx;

    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 1.0/7.0;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vUv = uv;
    
    vec3 pos = position;
    float t = uTime * 0.15;
    
    // Gentle billowing - like silk caught in a soft breeze
    float billow = sin(pos.x * 0.8 + t * 2.0) * cos(pos.y * 0.6 + t * 1.5) * 0.3;
    
    // Soft flowing folds
    float fold1 = snoise(vec3(pos.x * 0.4, pos.y * 0.3, t)) * 0.5;
    float fold2 = snoise(vec3(pos.x * 0.8, pos.y * 0.6, t * 1.2)) * 0.25;
    float fold3 = snoise(vec3(pos.x * 1.5, pos.y * 1.2, t * 0.8)) * 0.1;
    
    // Draping effect - fabric hangs more at the bottom
    float drape = (1.0 - uv.y) * 0.3;
    
    // Mouse interaction - gentle push
    vec2 mousePos = uMouse * 2.0 - 1.0;
    float mouseDist = distance(vec2(pos.x / 2.5, pos.y / 1.5), mousePos);
    float mouseEffect = smoothstep(1.0, 0.0, mouseDist) * 0.4;
    
    float totalDisplacement = billow + fold1 + fold2 + fold3 + drape + mouseEffect;
    vFold = totalDisplacement;
    
    pos.z += totalDisplacement;
    
    // Slight horizontal movement for flow
    pos.x += sin(pos.y * 2.0 + t * 3.0) * 0.05;
    
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;
    vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform sampler2D uEnvMap;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying float vFold;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 normal = normalize(vNormal);
    
    // Silk base color - rich blush/rose
    vec3 silkColor = uColor;
    
    // Fresnel - silk has edge highlights
    float fresnel = pow(1.0 - max(0.0, dot(viewDir, normal)), 4.0);
    
    // Anisotropic-like highlights (simplified) - silk has directional sheen
    vec3 tangent = normalize(cross(normal, vec3(0.0, 1.0, 0.0)));
    
    // Light directions
    vec3 light1 = normalize(vec3(1.0, 1.0, 0.5));
    vec3 light2 = normalize(vec3(-0.5, 0.8, 0.3));
    
    // Diffuse lighting
    float diff1 = max(0.0, dot(normal, light1));
    float diff2 = max(0.0, dot(normal, light2));
    float diffuse = diff1 * 0.6 + diff2 * 0.3;
    
    // Anisotropic highlight calculation
    float dotTH1 = dot(tangent, normalize(light1 + viewDir));
    float dotTH2 = dot(tangent, normalize(light2 + viewDir));
    float sinTH1 = sqrt(1.0 - dotTH1 * dotTH1);
    float sinTH2 = sqrt(1.0 - dotTH2 * dotTH2);
    
    float spec1 = pow(sinTH1, 32.0) * 0.25;
    float spec2 = pow(sinTH2, 48.0) * 0.15;
    
    // Fold shadows and highlights - more contrast
    float foldShading = smoothstep(-0.8, 0.8, vFold);
    
    // Shadow color - darker in folds
    vec3 shadowColor = silkColor * 0.3;
    
    // Base color with fold variation
    vec3 color = mix(shadowColor, silkColor, foldShading);
    
    // Apply diffuse lighting
    color *= (0.4 + diffuse * 0.6);
    
    // Add silk sheen (the characteristic shimmer) - more subtle
    vec3 sheenColor = vec3(1.0, 0.95, 0.92);
    color += sheenColor * spec1 * foldShading;
    color += sheenColor * spec2 * foldShading;
    
    // Fresnel edge highlight - subtle
    color += fresnel * sheenColor * 0.15;
    
    // Translucency in thin areas
    float backlight = max(0.0, dot(-viewDir, light1)) * 0.08;
    color += silkColor * backlight;
    
    // Subtle color shift in deep folds (cooler tones in shadows)
    color = mix(color * vec3(0.9, 0.88, 0.95), color, foldShading);
    
    // Very subtle iridescence at edges only
    float irid = sin(vUv.x * 40.0 + vUv.y * 30.0 + uTime * 0.2) * 0.5 + 0.5;
    color += vec3(0.03, 0.0, 0.02) * irid * fresnel * 0.5;
    
    gl_FragColor = vec4(color, 0.95);
  }
`;

const SilkFabric = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const targetMouse = useRef(new THREE.Vector2(0.5, 0.5));
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uColor: { value: new THREE.Color('#e8b4a8') }, // Soft rose/blush silk
  }), []);

  useFrame(({ clock, pointer }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
      
      targetMouse.current.lerp(
        new THREE.Vector2((pointer.x + 1) / 2, (pointer.y + 1) / 2),
        0.05
      );
      materialRef.current.uniforms.uMouse.value = targetMouse.current;
    }
    
    if (meshRef.current) {
      // Very gentle sway
      meshRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.1) * 0.03;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0.2, 0]} rotation={[-0.3, 0, 0]}>
      <planeGeometry args={[5, 3.5, 200, 200]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
};

export const DigitalFabric = () => {
  return (
    <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-white/5 bg-[#0a0908] group cursor-crosshair">
      <Suspense
        fallback={
          <div className="absolute inset-0 flex items-center justify-center text-xs tracking-[0.3em] text-liquid-chrome/40 uppercase">
            <span className="animate-pulse">Draping silk...</span>
          </div>
        }
      >
        <Canvas 
          camera={{ position: [0, 0, 3.5], fov: 50 }} 
          dpr={[1, 2]}
          gl={{ 
            toneMapping: THREE.ACESFilmicToneMapping, 
            toneMappingExposure: 1.0,
            antialias: true,
            alpha: true
          }}
        >
          <color attach="background" args={['#0a0908']} />
          
          {/* Soft studio lighting - reduced intensity */}
          <ambientLight intensity={0.15} color="#f5f0eb" />
          
          {/* Key light - warm, softer */}
          <directionalLight 
            position={[3, 4, 2]} 
            intensity={0.8} 
            color="#fff8f0"
          />
          
          {/* Fill light - cool, subtle */}
          <directionalLight 
            position={[-2, 2, 3]} 
            intensity={0.25} 
            color="#e0e8f0"
          />
          
          {/* Rim light - very subtle */}
          <pointLight 
            position={[0, -2, 4]} 
            intensity={0.15} 
            color="#ffffff"
          />
          
          <SilkFabric />
          
          <Environment preset="studio" />
          
          <EffectComposer>
            <Bloom 
              luminanceThreshold={0.9} 
              luminanceSmoothing={0.5}
              intensity={0.3}
            />
          </EffectComposer>
        </Canvas>
      </Suspense>
      
      {/* Minimal UI */}
      <div className="absolute bottom-4 right-4 font-mono text-[9px] text-white/20 tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        Silk simulation · Interactive
      </div>
    </div>
  );
};
