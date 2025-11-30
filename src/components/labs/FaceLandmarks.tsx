'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { TRIANGULATION } from '@/utils/triangulation';


// Local implementation of drawConnectors to avoid import issues with @mediapipe/drawing_utils
const drawConnectors = (
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    connections: any[],
    style: { color: string; lineWidth: number }
) => {
    const canvas = ctx.canvas;
    ctx.save();
    ctx.strokeStyle = style.color;
    ctx.lineWidth = style.lineWidth;

    for (const connection of connections) {
        const start = landmarks[connection[0]];
        const end = landmarks[connection[1]];
        if (start && end) {
            ctx.beginPath();
            ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
            ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
            ctx.stroke();
        }
    }
    ctx.restore();
};

const FaceMask3D = ({
    resultsRef,
    maskImageSrc
}: {
    resultsRef: React.MutableRefObject<any>,
    maskImageSrc: string
}) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const geometryRef = useRef<THREE.BufferGeometry>(null);
    const texture = useLoader(THREE.TextureLoader, maskImageSrc);
    const initializedRef = useRef(false);

    useFrame(() => {
        const mesh = meshRef.current;
        const geometry = geometryRef.current;
        const results = resultsRef.current;

        if (!mesh || !geometry || !results || !results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
            return;
        }

        const landmarks = results.multiFaceLandmarks[0];

        // Initialize Geometry (Indices & UVs) once
        if (!initializedRef.current) {
            // Set Indices from static triangulation
            geometry.setIndex(TRIANGULATION);

            // Extract UVs (stride 2: u, v)
            // Planar mapping: u = x, v = 1 - y (flip Y)
            // We use the INITIAL frame as the reference "pose" for the texture.
            const count = landmarks.length;
            const uvs = new Float32Array(count * 2);

            for (let i = 0; i < count; i++) {
                uvs[i * 2] = landmarks[i].x;
                uvs[i * 2 + 1] = 1.0 - landmarks[i].y;
            }

            geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
            initializedRef.current = true;
        }

        // Update Vertices (Positions) every frame
        if (initializedRef.current) {
            const count = landmarks.length;
            const positions = geometry.attributes.position.array as Float32Array;

            for (let i = 0; i < count; i++) {
                // Map normalized (0-1) to Three.js coordinates
                // MediaPipe: x: 0(left)->1(right), y: 0(top)->1(bottom)
                // Three.js: x: -1(left)->1(right), y: -1(bottom)->1(top)

                const x = (landmarks[i].x * 2) - 1;
                const y = -(landmarks[i].y * 2) + 1;
                const z = -landmarks[i].z; // Depth (might need scaling)

                positions[i * 3] = x;
                positions[i * 3 + 1] = y;
                positions[i * 3 + 2] = z;
            }

            geometry.attributes.position.needsUpdate = true;

            // Recalculate normals for lighting
            geometry.computeVertexNormals();
        }
    });

    // Create a placeholder geometry with 468 vertices
    const vertexCount = 468;
    const positions = new Float32Array(vertexCount * 3);

    return (
        <mesh ref={meshRef}>
            <bufferGeometry ref={geometryRef}>
                <bufferAttribute
                    attach="attributes-position"
                    count={vertexCount}
                    args={[positions, 3]}
                />
            </bufferGeometry>
            <meshStandardMaterial
                map={texture}
                transparent
                side={THREE.DoubleSide}
                roughness={0.5}
                metalness={0.2}
            />
        </mesh>
    );
};

export const FaceLandmarks = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showVideo, setShowVideo] = useState(true);
    const [showMesh, setShowMesh] = useState(true);
    const [showMask, setShowMask] = useState(false);
    const resultsRef = useRef<any>(null);
    const [fps, setFps] = useState(0);
    const [resolution, setResolution] = useState('0x0');
    const lastFrameTimeRef = useRef(0);

    // Ref-based state for the callback loop
    const showVideoRef = useRef(showVideo);
    const showMeshRef = useRef(showMesh);
    const showMaskRef = useRef(showMask);

    useEffect(() => {
        showVideoRef.current = showVideo;
    }, [showVideo]);

    useEffect(() => {
        showMeshRef.current = showMesh;
    }, [showMesh]);

    useEffect(() => {
        showMaskRef.current = showMask;
    }, [showMask]);

    // Load mask image (preload for 3D loader)
    useEffect(() => {
        const img = new Image();
        img.src = '/assets/mask.png';
    }, []);

    useEffect(() => {
        let faceMesh: any = null;
        let animationFrameId: number;
        let stream: MediaStream | null = null;
        let isMounted = true;

        const onResults = (results: any) => {
            if (!isMounted) return;

            // Update ref for Three.js
            resultsRef.current = results;

            // Clear error if we are getting results (self-healing)
            setError(null);

            // Calculate FPS
            const now = performance.now();
            const delta = now - lastFrameTimeRef.current;
            if (delta >= 1000 / 10) { // Update roughly every 10 frames or so for stability
                setFps(Math.round(1000 / delta));
                lastFrameTimeRef.current = now;
            }

            const canvasElement = canvasRef.current;
            const canvasCtx = canvasElement?.getContext('2d');

            if (!canvasElement || !canvasCtx) return;

            // Resize canvas to match video dimensions
            if (results.image.width && results.image.height) {
                if (canvasElement.width !== results.image.width || canvasElement.height !== results.image.height) {
                    canvasElement.width = results.image.width;
                    canvasElement.height = results.image.height;
                    setResolution(`${results.image.width}x${results.image.height}`);
                }
            }

            setIsLoading(false);

            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

            // 1. Draw the video frame
            if (showVideoRef.current) {
                canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
            } else {
                canvasCtx.fillStyle = '#050505'; // Void black
                canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
            }

            // 2. Draw the Face Mesh (Layer 02)
            if (showMeshRef.current && results.multiFaceLandmarks) {
                const global = window as any;
                for (const landmarks of results.multiFaceLandmarks) {
                    // Config for drawing - Amelie Lolie Aesthetic
                    // Skin/Salmon: #FFC1B6, Chrome/White: #E0E0E0, Green/Matrix: #30FF30 (maybe too matrix-y, stick to brand)

                    const connectConfig = { color: '#FFC1B640', lineWidth: 1 }; // Faint skin tone

                    // Draw Tessellation (The Mesh)
                    if (global.FACEMESH_TESSELATION) {
                        drawConnectors(canvasCtx, landmarks, global.FACEMESH_TESSELATION, connectConfig);
                    }

                    // Draw Eyes - Sharp Chrome
                    if (global.FACEMESH_RIGHT_EYE) drawConnectors(canvasCtx, landmarks, global.FACEMESH_RIGHT_EYE, { color: '#E0E0E0', lineWidth: 2 });
                    if (global.FACEMESH_RIGHT_EYEBROW) drawConnectors(canvasCtx, landmarks, global.FACEMESH_RIGHT_EYEBROW, { color: '#E0E0E0', lineWidth: 2 });
                    if (global.FACEMESH_LEFT_EYE) drawConnectors(canvasCtx, landmarks, global.FACEMESH_LEFT_EYE, { color: '#E0E0E0', lineWidth: 2 });
                    if (global.FACEMESH_LEFT_EYEBROW) drawConnectors(canvasCtx, landmarks, global.FACEMESH_LEFT_EYEBROW, { color: '#E0E0E0', lineWidth: 2 });

                    // Draw Face Oval - Subtle boundary
                    if (global.FACEMESH_FACE_OVAL) drawConnectors(canvasCtx, landmarks, global.FACEMESH_FACE_OVAL, { color: '#FFC1B680', lineWidth: 1 });

                    // Draw Lips - Highlight
                    if (global.FACEMESH_LIPS) drawConnectors(canvasCtx, landmarks, global.FACEMESH_LIPS, { color: '#FFC1B6', lineWidth: 2 });
                }
            }
            canvasCtx.restore();
        };

        const loadScript = (src: string): Promise<void> => {
            return new Promise((resolve, reject) => {
                if (document.querySelector(`script[src="${src}"]`)) {
                    resolve();
                    return;
                }
                const script = document.createElement('script');
                script.src = src;
                script.crossOrigin = 'anonymous';
                script.onload = () => resolve();
                script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
                document.body.appendChild(script);
            });
        };

        const init = async () => {
            if (!videoRef.current) return;

            try {
                await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js');

                if (!isMounted) return;

                const global = window as any;

                // Retry loop to wait for FaceMesh to be available in global scope
                // This handles cases where the script tag exists but hasn't fully executed yet
                let attempts = 0;
                while (!global.FaceMesh && attempts < 50) { // Wait up to 5 seconds
                    await new Promise(resolve => setTimeout(resolve, 100));
                    if (!isMounted) return;
                    attempts++;
                }

                if (!global.FaceMesh) {
                    throw new Error('FaceMesh not found in global scope after loading script');
                }

                faceMesh = new global.FaceMesh({
                    locateFile: (file: string) => {
                        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
                    },
                });

                faceMesh.setOptions({
                    maxNumFaces: 1,
                    refineLandmarks: true,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5,
                });

                faceMesh.onResults(onResults);

                // Initialize Camera manually
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 1280, height: 720, facingMode: 'user' }
                });

                if (!isMounted) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();

                    // Start processing loop
                    const processFrame = async () => {
                        if (!isMounted) return;
                        if (faceMesh && videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
                            await faceMesh.send({ image: videoRef.current });
                        }
                        animationFrameId = requestAnimationFrame(processFrame);
                    };
                    processFrame();
                }

            } catch (err) {
                if (isMounted) {
                    console.error('Error initializing FaceMesh:', err);
                    setError('Failed to access camera or initialize models.');
                    setIsLoading(false);
                }
            }
        };

        init();

        return () => {
            isMounted = false;
            cancelAnimationFrame(animationFrameId);
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (faceMesh) {
                faceMesh.close();
            }
        };
    }, []);

    return (
        <div className="flex flex-col gap-6">
            <div className="relative w-full aspect-[16/9] overflow-hidden rounded-2xl border border-white/5 bg-obsidian shadow-2xl">
                {/* Hidden Video Input */}
                <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
                    playsInline
                />

                {/* Output Canvas (2D) */}
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-contain"
                />

                {/* 3D Canvas Layer */}
                {showMask && (
                    <div className="absolute inset-0 pointer-events-none">
                        <Canvas camera={{ position: [0, 0, 1], left: -1, right: 1, top: 1, bottom: -1, near: 0.1, far: 100 }} orthographic>
                            <ambientLight intensity={1.5} />
                            <directionalLight position={[0, 0, 1]} intensity={1} />
                            <FaceMask3D resultsRef={resultsRef} maskImageSrc="/assets/mask.png" />
                        </Canvas>
                    </div>
                )}

                {/* Loading Overlay */}
                {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10 transition-opacity duration-500">
                        <div className="w-12 h-12 border-2 border-skin border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="font-mono text-xs tracking-[0.2em] text-skin uppercase">Initializing Neural Net...</p>
                    </div>
                )}

                {/* Error Overlay */}
                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20">
                        <p className="font-mono text-xs text-red-400 uppercase tracking-widest">{error}</p>
                    </div>
                )}

                {/* HUD Overlay */}
                <div className="absolute top-4 left-4 z-10">
                    <div className="rounded-full bg-black/40 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em] text-white/80 backdrop-blur border border-white/10">
                        Face Mesh v2.0
                    </div>
                </div>

                <div className="absolute top-4 right-4 z-10 text-right font-mono text-[10px] uppercase tracking-[0.3em] text-white/50 space-y-1">
                    <div>FPS: <span className="text-skin">{fps}</span></div>
                    <div>RES: {resolution}</div>
                </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                    onClick={() => setShowVideo(!showVideo)}
                    className={`p-4 rounded-xl border transition-all duration-300 text-left group ${showVideo ? 'border-skin/50 bg-skin/5' : 'border-white/10 hover:border-white/20'
                        }`}
                >
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-liquid-chrome/60 mb-1">Layer 01</div>
                    <div className={`font-sans text-sm ${showVideo ? 'text-skin' : 'text-liquid-chrome'}`}>
                        {showVideo ? 'Video Feed Active' : 'Video Feed Disabled'}
                    </div>
                </button>

                <button
                    onClick={() => setShowMesh(!showMesh)}
                    className={`p-4 rounded-xl border transition-all duration-300 text-left group ${showMesh ? 'border-skin/50 bg-skin/5' : 'border-white/10 hover:border-white/20'
                        }`}
                >
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-liquid-chrome/60 mb-1">Layer 02</div>
                    <div className={`font-sans text-sm ${showMesh ? 'text-skin' : 'text-liquid-chrome'}`}>
                        {showMesh ? 'Mesh Overlay Active' : 'Mesh Overlay Disabled'}
                    </div>
                </button>

                <button
                    onClick={() => setShowMask(!showMask)}
                    className={`p-4 rounded-xl border transition-all duration-300 text-left group md:col-span-2 ${showMask ? 'border-skin/50 bg-skin/5' : 'border-white/10 hover:border-white/20'
                        }`}
                >
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-liquid-chrome/60 mb-1">Layer 03</div>
                    <div className={`font-sans text-sm ${showMask ? 'text-skin' : 'text-liquid-chrome'}`}>
                        {showMask ? 'Mask Overlay Active' : 'Mask Overlay Disabled'}
                    </div>
                </button>
            </div>
        </div>
    );
};
