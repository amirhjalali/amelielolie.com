'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, PerspectiveCamera, useGLTF, PresentationControls } from '@react-three/drei';

const Avatar = () => {
    const { scene } = useGLTF('https://models.readyplayer.me/692c53130e3d4bf2f2ee1d2b.glb');

    return (
        <primitive
            object={scene}
            position={[0, -1.5, 0]}
            scale={1.8}
        />
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

useGLTF.preload('https://models.readyplayer.me/692c53130e3d4bf2f2ee1d2b.glb');


