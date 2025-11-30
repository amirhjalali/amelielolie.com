'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FaceMesh, FACEMESH_TESSELATION, FACEMESH_RIGHT_EYE, FACEMESH_RIGHT_EYEBROW, FACEMESH_LEFT_EYE, FACEMESH_LEFT_EYEBROW, FACEMESH_FACE_OVAL, FACEMESH_LIPS } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

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

export const FaceLandmarks = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showVideo, setShowVideo] = useState(true);
    const [showMesh, setShowMesh] = useState(true);
    const [fps, setFps] = useState(0);
    const [resolution, setResolution] = useState('0x0');
    const lastFrameTimeRef = useRef(0);

    // Ref-based state for the callback loop
    const showVideoRef = useRef(showVideo);
    const showMeshRef = useRef(showMesh);

    useEffect(() => {
        showVideoRef.current = showVideo;
    }, [showVideo]);

    useEffect(() => {
        showMeshRef.current = showMesh;
    }, [showMesh]);

    useEffect(() => {
        let camera: Camera | null = null;
        let faceMesh: FaceMesh | null = null;

        const onResults = (results: any) => {
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

            // 2. Draw the Face Mesh
            if (showMeshRef.current && results.multiFaceLandmarks) {
                for (const landmarks of results.multiFaceLandmarks) {
                    // Config for drawing - Amelie Lolie Aesthetic
                    // Skin/Salmon: #FFC1B6, Chrome/White: #E0E0E0, Green/Matrix: #30FF30 (maybe too matrix-y, stick to brand)

                    const connectConfig = { color: '#FFC1B640', lineWidth: 1 }; // Faint skin tone
                    const landmarkConfig = { color: '#E0E0E0', lineWidth: 1, radius: 1 }; // Chrome points

                    // Draw Tessellation (The Mesh)
                    drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, connectConfig);

                    // Draw Eyes - Sharp Chrome
                    drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, { color: '#E0E0E0', lineWidth: 2 });
                    drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYEBROW, { color: '#E0E0E0', lineWidth: 2 });
                    drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, { color: '#E0E0E0', lineWidth: 2 });
                    drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYEBROW, { color: '#E0E0E0', lineWidth: 2 });

                    // Draw Face Oval - Subtle boundary
                    drawConnectors(canvasCtx, landmarks, FACEMESH_FACE_OVAL, { color: '#FFC1B680', lineWidth: 1 });

                    // Draw Lips - Highlight
                    drawConnectors(canvasCtx, landmarks, FACEMESH_LIPS, { color: '#FFC1B6', lineWidth: 2 });
                }
            }
            canvasCtx.restore();
        };

        const init = async () => {
            if (!videoRef.current) return;

            try {
                faceMesh = new FaceMesh({
                    locateFile: (file) => {
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

                camera = new Camera(videoRef.current, {
                    onFrame: async () => {
                        if (faceMesh && videoRef.current) {
                            await faceMesh.send({ image: videoRef.current });
                        }
                    },
                    width: 1280,
                    height: 720,
                });

                await camera.start();
            } catch (err) {
                console.error('Error initializing FaceMesh:', err);
                setError('Failed to access camera or initialize models.');
                setIsLoading(false);
            }
        };

        init();

        return () => {
            if (camera) {
                // Camera stop method might not be exposed directly in type definition but usually exists or we just stop tracks
                // The Camera utility handles the loop, but we should stop the video element tracks
                const stream = videoRef.current?.srcObject as MediaStream;
                if (stream) stream.getTracks().forEach(track => track.stop());
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

                {/* Output Canvas */}
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-contain"
                />

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
            </div>
        </div>
    );
};
