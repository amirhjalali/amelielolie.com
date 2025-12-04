'use client';

import React, { useEffect, useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { FaceLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

// --- Avatar Component ---
const AvatarMask = ({
    blendshapes,
    matrix,
    url
}: {
    blendshapes: any[],
    matrix: THREE.Matrix4 | null,
    url: string
}) => {
    const { scene } = useGLTF(url);
    const groupRef = useRef<THREE.Group>(null);
    const headMeshRef = useRef<THREE.Mesh | null>(null);

    // Setup: Find head mesh and hide body
    useEffect(() => {
        if (scene) {
            scene.traverse((child: any) => {
                if (child.isMesh) {
                    // RPM usually has 'Wolf3D_Head', 'Wolf3D_Teeth', etc.
                    // Hide body parts
                    if (child.name.includes('Body') || child.name.includes('Outfit') || child.name.includes('Top') || child.name.includes('Bottom') || child.name.includes('Footwear')) {
                        child.visible = false;
                    }

                    // Identify head mesh for morph targets
                    // Usually 'Wolf3D_Head' or similar has the main blendshapes
                    // But often they are distributed (Head, Teeth, Beard, etc.)
                    // We need to apply to ALL meshes that have morphTargetDictionary
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
        }
    }, [scene]);

    useFrame(() => {
        const group = groupRef.current;
        if (!group) return;

        // 1. Apply Pose
        if (matrix) {
            group.matrixAutoUpdate = false;
            group.matrix.copy(matrix);
            group.visible = true;
        } else {
            group.visible = false;
        }

        // 2. Apply Blendshapes
        if (blendshapes && blendshapes.length > 0) {
            scene.traverse((child: any) => {
                if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
                    for (const shape of blendshapes) {
                        const name = shape.categoryName;
                        const score = shape.score;

                        // RPM uses ARKit naming convention usually
                        // MediaPipe uses similar naming
                        // We try to match directly
                        const index = child.morphTargetDictionary[name];
                        if (index !== undefined) {
                            child.morphTargetInfluences[index] = score;
                        }
                    }
                }
            });
        }
    });

    return (
        <group ref={groupRef}>
            <primitive
                object={scene}
                scale={100}
                position={[0, -170, 0]}
            />
        </group>
    );
};

// --- Face Mask Component (Legacy Texture) ---
// Simplified for new API
const FaceMask3D = ({
    landmarks,
    maskImageSrc
}: {
    landmarks: any,
    maskImageSrc: string
}) => {
    // Note: Implementing full UV mapping for the new API requires re-mapping the landmarks
    // For now, we will disable this or implement a simple version if needed.
    // The user prioritized the Avatar, so we focus on that.
    // We can leave a placeholder or try to adapt the old logic.
    // Given the complexity of re-implementing the custom geometry with the new landmarks format,
    // and the user's focus on the Avatar, I will omit the texture mask for this iteration 
    // or implement a basic version if requested.
    // Let's keep it simple and focus on the Avatar as requested.
    return null;
};


export const FaceLandmarks = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // UI State
    const [showVideo, setShowVideo] = useState(true);
    const [activeAvatar, setActiveAvatar] = useState<string | null>(null);
    const [showDebug, setShowDebug] = useState(true); // Replaces showMesh for drawing utils

    // Data State
    const [faceMatrix, setFaceMatrix] = useState<THREE.Matrix4 | null>(null);
    const [blendshapes, setBlendshapes] = useState<any[]>([]);

    const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
    const lastVideoTimeRef = useRef(-1);
    const requestRef = useRef<number>(0);

    useEffect(() => {
        const init = async () => {
            try {
                const filesetResolver = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
                );

                faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
                    baseOptions: {
                        modelAssetPath: "/models/face_landmarker.task",
                        delegate: "GPU"
                    },
                    outputFaceBlendshapes: true,
                    outputFacialTransformationMatrixes: true,
                    runningMode: "VIDEO",
                    numFaces: 1
                });

                // Camera Setup
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 1280, height: 720, facingMode: "user" }
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.addEventListener("loadeddata", predictWebcam);
                }

                setIsLoading(false);

            } catch (err) {
                console.error(err);
                setError("Failed to initialize Face Landmarker");
                setIsLoading(false);
            }
        };

        init();

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            // Cleanup stream
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(t => t.stop());
            }
        };
    }, []);

    const predictWebcam = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const landmarker = faceLandmarkerRef.current;

        if (video && canvas && landmarker) {
            if (video.currentTime !== lastVideoTimeRef.current) {
                lastVideoTimeRef.current = video.currentTime;

                const startTimeMs = performance.now();
                const results = landmarker.detectForVideo(video, startTimeMs);

                // 1. Draw Video & Debug
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    // Resize canvas to match video
                    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                    }

                    if (showVideo) {
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    }

                    if (showDebug && results.faceLandmarks) {
                        const drawingUtils = new DrawingUtils(ctx);
                        for (const landmarks of results.faceLandmarks) {
                            drawingUtils.drawConnectors(
                                landmarks,
                                FaceLandmarker.FACE_LANDMARKS_TESSELATION,
                                { color: "#C0C0C070", lineWidth: 1 }
                            );
                            drawingUtils.drawConnectors(
                                landmarks,
                                FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
                                { color: "#FF3030", lineWidth: 2 }
                            );
                            drawingUtils.drawConnectors(
                                landmarks,
                                FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
                                { color: "#FF3030", lineWidth: 2 }
                            );
                            drawingUtils.drawConnectors(
                                landmarks,
                                FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
                                { color: "#30FF30", lineWidth: 2 }
                            );
                            drawingUtils.drawConnectors(
                                landmarks,
                                FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
                                { color: "#30FF30", lineWidth: 2 }
                            );
                            drawingUtils.drawConnectors(
                                landmarks,
                                FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
                                { color: "#E0E0E0", lineWidth: 1 }
                            );
                            drawingUtils.drawConnectors(
                                landmarks,
                                FaceLandmarker.FACE_LANDMARKS_LIPS,
                                { color: "#E0E0E0", lineWidth: 2 }
                            );
                        }
                    }
                }

                // 2. Update 3D Data
                if (results.facialTransformationMatrixes && results.facialTransformationMatrixes.length > 0) {
                    const matrix = new THREE.Matrix4().fromArray(results.facialTransformationMatrixes[0].data);
                    setFaceMatrix(matrix);
                } else {
                    setFaceMatrix(null);
                }

                if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
                    setBlendshapes(results.faceBlendshapes[0].categories);
                }
            }
        }
        requestRef.current = requestAnimationFrame(predictWebcam);
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="relative w-full aspect-[16/9] overflow-hidden rounded-2xl border border-white/5 bg-obsidian shadow-2xl">
                <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover opacity-0"
                    autoPlay
                    playsInline
                />
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-contain"
                />

                {/* 3D Layer */}
                {activeAvatar && (
                    <div className="absolute inset-0 pointer-events-none">
                        <Canvas camera={{ fov: 63, position: [0, 0, 0] }}>
                            {/* Note: MediaPipe Matrix assumes a specific camera setup.
                                Usually FOV ~63 deg (vertical) for 16:9, or matching the input video.
                                The matrix is in world space relative to the camera at origin.
                            */}
                            <ambientLight intensity={1.5} />
                            <directionalLight position={[0, 0, 1]} intensity={1} />
                            <Suspense fallback={null}>
                                <AvatarMask
                                    blendshapes={blendshapes}
                                    matrix={faceMatrix}
                                    url={activeAvatar === 'default'
                                        ? 'https://models.readyplayer.me/692c53130e3d4bf2f2ee1d2b.glb'
                                        : '/assets/amir.glb'
                                    }
                                />
                            </Suspense>
                        </Canvas>
                    </div>
                )}

                {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10">
                        <div className="w-12 h-12 border-2 border-skin border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="font-mono text-xs tracking-[0.2em] text-skin uppercase">Loading AI Model...</p>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20">
                        <p className="font-mono text-xs text-red-400 uppercase tracking-widest">{error}</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                    onClick={() => setShowVideo(!showVideo)}
                    className={`p-4 rounded-xl border transition-all duration-300 text-left group ${showVideo ? 'border-skin/50 bg-skin/5' : 'border-white/10 hover:border-white/20'}`}
                >
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-liquid-chrome/60 mb-1">Layer 01</div>
                    <div className={`font-sans text-sm ${showVideo ? 'text-skin' : 'text-liquid-chrome'}`}>
                        {showVideo ? 'Video Feed Active' : 'Video Feed Disabled'}
                    </div>
                </button>

                <button
                    onClick={() => setShowDebug(!showDebug)}
                    className={`p-4 rounded-xl border transition-all duration-300 text-left group ${showDebug ? 'border-skin/50 bg-skin/5' : 'border-white/10 hover:border-white/20'}`}
                >
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-liquid-chrome/60 mb-1">Layer 02</div>
                    <div className={`font-sans text-sm ${showDebug ? 'text-skin' : 'text-liquid-chrome'}`}>
                        {showDebug ? 'Debug Mesh Active' : 'Debug Mesh Disabled'}
                    </div>
                </button>

                <button
                    onClick={() => setActiveAvatar(activeAvatar === 'default' ? null : 'default')}
                    className={`p-4 rounded-xl border transition-all duration-300 text-left group ${activeAvatar === 'default' ? 'border-skin/50 bg-skin/5' : 'border-white/10 hover:border-white/20'}`}
                >
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-liquid-chrome/60 mb-1">Layer 03</div>
                    <div className={`font-sans text-sm ${activeAvatar === 'default' ? 'text-skin' : 'text-liquid-chrome'}`}>
                        {activeAvatar === 'default' ? 'Avatar: Default' : 'Avatar: Default'}
                    </div>
                </button>

                <button
                    onClick={() => setActiveAvatar(activeAvatar === 'amir' ? null : 'amir')}
                    className={`p-4 rounded-xl border transition-all duration-300 text-left group ${activeAvatar === 'amir' ? 'border-skin/50 bg-skin/5' : 'border-white/10 hover:border-white/20'}`}
                >
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-liquid-chrome/60 mb-1">Layer 04</div>
                    <div className={`font-sans text-sm ${activeAvatar === 'amir' ? 'text-skin' : 'text-liquid-chrome'}`}>
                        {activeAvatar === 'amir' ? 'Avatar: Amir' : 'Avatar: Amir'}
                    </div>
                </button>
            </div>
        </div>
    );
};
