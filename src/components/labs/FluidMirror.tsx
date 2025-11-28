'use client';

import { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import { EffectComposer, ChromaticAberration, Noise, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// --- Shader Definition ---

const MirrorShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uTexture: new THREE.Texture(), // Will hold the webcam feed
    uMouse: new THREE.Vector2(0.5, 0.5),
    uResolution: new THREE.Vector2(1, 1),
    uColorHigh: new THREE.Color('#E0E0E0'), // Chrome/White
    uColorLow: new THREE.Color('#050505'),  // Void/Black
    uDistortion: 0.0, // Level of glitch/distortion
    uSignalType: 1.0, // 1.0 = Camera, 0.0 = Synthetic
  },
  /* glsl Vertex */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* glsl Fragment */ `
    uniform float uTime;
    uniform sampler2D uTexture;
    uniform vec2 uMouse;
    uniform vec3 uColorHigh;
    uniform vec3 uColorLow;
    uniform float uDistortion;
    uniform float uSignalType;
    uniform vec2 uResolution;
    varying vec2 vUv;

    // --- Noise Functions ---
    float hash(vec2 p) { return fract(1e4 * sin(17.0 * p.x + p.y * 0.1) * (0.1 + abs(sin(p.y * 13.0 + p.x)))); }
    float noise(vec2 x) {
        vec2 i = floor(x);
        vec2 f = fract(x);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    float fbm (in vec2 st) {
        float value = 0.0;
        float amplitude = .5;
        float frequency = 0.;
        for (int i = 0; i < 5; i++) {
            value += amplitude * noise(st);
            st *= 2.;
            amplitude *= .5;
        }
        return value;
    }

    // --- Fluid Math ---
    vec2 getDistortion(vec2 uv, float time, vec2 mouse) {
        float dist = distance(uv, mouse);
        float decay = exp(-dist * 2.5);
        
        // Flowing noise field
        float n = noise(uv * 4.0 + time * 0.2);
        
        // Mouse influence
        vec2 mouseForce = (uv - mouse) * decay * 0.15;
        
        // Base liquid undulation
        vec2 liquid = vec2(
            sin(uv.y * 8.0 + time * 0.5) * 0.01,
            cos(uv.x * 8.0 + time * 0.4) * 0.01
        );
        
        return liquid + mouseForce * uDistortion;
    }

    // --- Chrome Lighting ---
    // Calculate "height" based on luminance to create fake 3D normals
    float getLuminance(vec2 uv, vec2 offset) {
        vec4 tex = texture2D(uTexture, uv + offset);
        return dot(tex.rgb, vec3(0.299, 0.587, 0.114));
    }

    void main() {
      vec2 uv = vUv;
      uv.x = 1.0 - uv.x; // Mirror flip

      // 1. Get Base Distortion
      vec2 flow = getDistortion(uv, uTime, uMouse);
      vec2 distortedUV = uv + flow;

      // 2. Generate Source Content (Camera or Synthetic)
      float height = 0.0;
      
      if (uSignalType > 0.5) {
        // Sample camera with distortion
        // Use multiple samples to blur/smooth the height map slightly
        height = getLuminance(distortedUV, vec2(0.0));
      } else {
        // Synthetic height map from FBM
        // Domain warping for "oil" look
        vec2 q = vec2(0.);
        q.x = fbm(distortedUV + 0.00 * uTime);
        q.y = fbm(distortedUV + vec2(1.0));
        vec2 r = vec2(0.);
        r.x = fbm(distortedUV + 1.0*q + vec2(1.7,9.2) + 0.15*uTime);
        r.y = fbm(distortedUV + 1.0*q + vec2(8.3,2.8) + 0.126*uTime);
        height = fbm(distortedUV + r);
      }

      // 3. Compute Surface Normals (The "3D" Look)
      // Differentiate the height map to get slope
      vec2 pixelSize = vec2(1.0/1280.0, 1.0/720.0) * 2.0; // Slightly larger step for smoother normals
      float hL = getLuminance(distortedUV, vec2(-pixelSize.x, 0.0));
      float hR = getLuminance(distortedUV, vec2(pixelSize.x, 0.0));
      float hD = getLuminance(distortedUV, vec2(0.0, -pixelSize.y));
      float hU = getLuminance(distortedUV, vec2(0.0, pixelSize.y));
      
      if (uSignalType < 0.5) {
          // Recalculate neighbors for synthetic mode (expensive but correct)
          // Simplified: just assume the height computed earlier is somewhat smooth
          // actually, let's just reuse the camera logic pattern for consistency,
          // assuming uTexture is empty/black in synthetic mode is wrong. 
          // For synthetic, we compute "fake" gradients from the fbm directly.
           float eps = 0.01;
           hL = fbm(distortedUV + vec2(-eps, 0.));
           hR = fbm(distortedUV + vec2(eps, 0.));
           hD = fbm(distortedUV + vec2(0., -eps));
           hU = fbm(distortedUV + vec2(0., eps));
      }

      vec3 normal = normalize(vec3(hL - hR, hD - hU, 0.5)); // Z component controls "flatness"

      // 4. Chrome / Studio Lighting Simulation
      // Light direction
      vec3 lightDir = normalize(vec3(-1.0, 1.0, 1.0));
      vec3 viewDir = vec3(0.0, 0.0, 1.0);
      
      // Specular reflection (The shiny part)
      vec3 halfDir = normalize(lightDir + viewDir);
      float spec = pow(max(dot(normal, halfDir), 0.0), 32.0);
      
      // Fresnel (Rim lighting)
      float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 4.0);
      
      // Environment Reflection (Fake Matcap-ish)
      // Map normal to 2D coordinates to sample a "gradient" or pattern
      float reflection = sin(normal.x * 10.0 + normal.y * 5.0 + uTime);
      
      // 5. Combine into Liquid Metal
      vec3 baseColor = mix(uColorLow, uColorHigh, height);
      
      // Add "Topographic" scan lines
      float topo = sin(height * 40.0 + uTime * 0.5);
      float topoLine = smoothstep(0.95, 1.0, topo);
      
      // Final Composite
      vec3 finalColor = baseColor;
      finalColor += vec3(spec) * 1.5; // Add bright highlights
      finalColor += vec3(fresnel) * uColorHigh; // Add rim light
      finalColor += vec3(topoLine) * uColorHigh * 0.2; // Add subtle contour lines
      
      // Add subtle chromatic aberration to the "glass"
      finalColor.r += normal.x * 0.05;
      finalColor.b -= normal.x * 0.05;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

extend({ MirrorShaderMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    mirrorShaderMaterial: ThreeElements['shaderMaterial'] & {
      uTime?: number;
      uTexture?: THREE.Texture;
      uMouse?: THREE.Vector2;
      uColorHigh?: THREE.Color;
      uColorLow?: THREE.Color;
      uDistortion?: number;
      uSignalType?: number;
      uResolution?: THREE.Vector2;
    };
  }
}

// --- Video Texture Manager ---

const VideoPlane = ({ stream }: { stream: MediaStream | null }) => {
  const materialRef = useRef<any>(null);
  const targetMouse = useRef(new THREE.Vector2(0.5, 0.5));
  
  // Create video element and texture (only if stream exists)
  const videoTexture = useMemo(() => {
    if (!stream) return new THREE.Texture(); // Placeholder
    const video = document.createElement('video');
    video.srcObject = stream;
    video.playsInline = true;
    video.autoplay = true;
    video.play();
    const texture = new THREE.VideoTexture(video);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBAFormat;
    return texture;
  }, [stream]);

  useFrame(({ clock, pointer }) => {
    if (!materialRef.current) return;
    materialRef.current.uTime = clock.getElapsedTime();
    
    // Update video texture
    if (stream && videoTexture instanceof THREE.VideoTexture) {
         videoTexture.needsUpdate = true;
    }
    
    // Mouse Interaction
    const uvX = (pointer.x + 1) / 2;
    const uvY = (pointer.y + 1) / 2;
    targetMouse.current.lerp(new THREE.Vector2(1.0 - uvX, uvY), 0.1);
    materialRef.current.uMouse = targetMouse.current;
  });

  return (
    <mesh>
      <planeGeometry args={[4, 2.25]} />
      <mirrorShaderMaterial 
        ref={materialRef} 
        uTexture={videoTexture} 
        uDistortion={1.0}
        uSignalType={stream ? 1.0 : 0.0} // Switch mode based on stream presence
        uResolution={new THREE.Vector2(1280, 720)}
        transparent 
      />
    </mesh>
  );
};

// --- Main Component ---

export const FluidMirror = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [isSynthetic, setIsSynthetic] = useState(false);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
        } 
      });
      setStream(mediaStream);
      setActive(true);
      setIsSynthetic(false);
      setError(null);
    } catch (err) {
      console.error("Camera access denied:", err);
      setError("Camera access unavailable.");
    }
  };

  const startSynthetic = () => {
    setStream(null);
    setActive(true);
    setIsSynthetic(true);
    setError(null);
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setActive(false);
    setIsSynthetic(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-white/5 bg-void group">
      
      {/* 3D Scene */}
      {active ? (
        <Canvas camera={{ position: [0, 0, 1], fov: 35 }}>
          <color attach="background" args={['#030303']} />
          <Suspense fallback={null}>
            <VideoPlane stream={stream} />
          </Suspense>
          
          <EffectComposer>
            <ChromaticAberration offset={[0.004, 0.004]} />
            <Bloom luminanceThreshold={0.9} intensity={1.0} radius={0.8} />
            <Noise opacity={0.15} />
          </EffectComposer>
        </Canvas>
      ) : (
        /* Inactive State UI */
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 text-center">
            <div className="max-w-md space-y-6">
                <div className="space-y-2">
                    <h3 className="font-serif text-2xl text-liquid-chrome">Neural Reflection</h3>
                    <p className="font-sans text-sm text-liquid-chrome/60">
                        Allow camera access to digitize your identity. 
                        The system will reinterpret your biological signal into the atelier's aesthetic.
                    </p>
                </div>
                
                <div className="flex flex-col gap-3 items-center">
                    {!error && (
                        <button 
                            onClick={startCamera}
                            className="group relative px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-skin/50 rounded-full transition-all duration-300"
                        >
                            <span className="font-mono text-xs tracking-[0.2em] text-skin uppercase group-hover:text-white transition-colors">
                                Initialize Camera
                            </span>
                            <div className="absolute inset-0 rounded-full border border-skin/0 group-hover:border-skin/30 scale-105 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                        </button>
                    )}

                    {(error || !error) && (
                         <button 
                            onClick={startSynthetic}
                            className="text-[10px] tracking-[0.2em] text-liquid-chrome/40 hover:text-skin uppercase transition-colors border-b border-transparent hover:border-skin"
                        >
                            {error ? "Camera Unavailable · Run Simulation" : "Or Run Simulation"}
                        </button>
                    )}
                </div>
                
                {error && (
                     <div className="p-2 border border-red-500/10 text-red-400/50 text-[10px] font-mono uppercase tracking-widest">
                        {error}
                     </div>
                )}
                
                <p className="text-[10px] text-white/20 uppercase tracking-widest font-mono mt-4">
                    Local processing only · No data stored
                </p>
            </div>
        </div>
      )}

      {/* Active Overlay */}
      {active && (
        <>
            <div className="absolute bottom-4 right-4 font-mono text-[9px] text-liquid-chrome/30 tracking-widest uppercase opacity-50 group-hover:opacity-100 transition-opacity">
                Signal: {isSynthetic ? 'Synthetic_Generation' : 'Live_Feed'} · Process: Liquid_Metal_Reconstruction
            </div>
            <button 
                onClick={stopCamera}
                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors group/btn"
                title="Stop Signal"
            >
                <div className="w-2 h-2 bg-red-500/50 group-hover/btn:bg-red-500 rounded-full" />
            </button>
        </>
      )}
    </div>
  );
};
