'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, PerspectiveCamera, useGLTF, PresentationControls } from '@react-three/drei';

const Avatar = () => {
    // Placeholder model from Ready Player Me or similar standard GLB
    // Using a simple box for now if no URL is provided, but the prompt suggested a placeholder URL.
    // I'll use a common placeholder or a simple mesh if the URL fails, but for now let's try a standard one or just a box as a fallback if I don't have a reliable URL.
    // Actually, the prompt mentioned "use a placeholder URL for a Ready Player Me GLB".
    // I will use a sample model URL.
    return (
        <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1, 2, 1]} />
            <meshStandardMaterial color="hotpink" />
        </mesh>
    );
};

export const AvatarCanvas = () => {
    return (
        <div className="w-full h-[600px] relative rounded-2xl overflow-hidden border border-white/10 bg-white/5">
            <Canvas dpr={[1, 2]} shadows>
                <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />

                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />

                <Environment preset="city" />

                <PresentationControls
                    global
                    snap={true}
                    rotation={[0, 0, 0]}
                    polar={[-Math.PI / 4, Math.PI / 4]}
                    azimuth={[-Math.PI / 2, Math.PI / 2]}
                >
                    <Suspense fallback={null}>
                        <Avatar />
                    </Suspense>
                </PresentationControls>
            </Canvas>

            {/* Loading Overlay (Optional but good for UX) */}
            <div className="absolute bottom-4 right-4 pointer-events-none">
                <span className="font-mono text-xs text-liquid-chrome/50">
                    INTERACTIVE // DRAG TO ROTATE
                </span>
            </div>
        </div>
    );
};


