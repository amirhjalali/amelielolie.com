'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Canvas } from '@react-three/fiber';
import { Environment, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Configuration
const COLS = 20;
const ROWS = 20;
const SPACING = 0.25;
const ITERATIONS = 5; // Solver iterations for stability
const GRAVITY = -9.8;
const FRICTION = 0.98;
const MOUSE_INFLUENCE_RADIUS = 1.5;

interface Particle {
  x: number;
  y: number;
  z: number;
  oldX: number;
  oldY: number;
  oldZ: number;
  pinned: boolean;
}

interface Constraint {
  p1: number; // Index of particle 1
  p2: number; // Index of particle 2
  length: number;
}

const ClothSimulation = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { mouse, raycaster, camera, gl } = useThree();

  // Physics State
  const particles = useMemo(() => {
    const parts: Particle[] = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const px = (x - COLS / 2) * SPACING;
        const py = (y - ROWS / 2) * SPACING + 2; // Start higher up
        const pz = 0;
        parts.push({
          x: px, y: py, z: pz,
          oldX: px, oldY: py, oldZ: pz,
          pinned: y === 0 // Pin the top row initially
        });
      }
    }
    return parts;
  }, []);

  const constraints = useMemo(() => {
    const cons: Constraint[] = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const i = y * COLS + x;

        // Horizontal constraint
        if (x < COLS - 1) {
          cons.push({ p1: i, p2: i + 1, length: SPACING });
        }

        // Vertical constraint
        if (y < ROWS - 1) {
          cons.push({ p1: i, p2: i + COLS, length: SPACING });
        }
      }
    }
    return cons;
  }, []);

  // Interaction State
  const interactionRef = useRef<{
    isDragging: boolean;
    draggedParticleIndex: number;
    planeNormal: THREE.Vector3;
    planeConstant: number;
  }>({
    isDragging: false,
    draggedParticleIndex: -1,
    planeNormal: new THREE.Vector3(0, 0, 1),
    planeConstant: 0
  });

  // Geometry
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(1, 1, COLS - 1, ROWS - 1);
    // Initialize positions
    const positions = geo.attributes.position.array as Float32Array;
    for (let i = 0; i < particles.length; i++) {
      positions[i * 3] = particles[i].x;
      positions[i * 3 + 1] = particles[i].y;
      positions[i * 3 + 2] = particles[i].z;
    }
    return geo;
  }, [particles]);

  // Mouse Handlers
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      // Raycast to find closest particle
      raycaster.setFromCamera(mouse, camera);

      let minDist = Infinity;
      let closestIndex = -1;

      // Simple distance check to all particles (could be optimized with spatial partitioning but fine for 400 particles)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const particlePos = new THREE.Vector3(p.x, p.y, p.z);
        // Project particle to screen space to check distance to mouse ray? 
        // Or just check distance to ray in 3D?
        // Let's check distance to ray
        const dist = raycaster.ray.distanceToPoint(particlePos);

        if (dist < 0.5 && dist < minDist) { // Threshold
          minDist = dist;
          closestIndex = i;
        }
      }

      if (closestIndex !== -1) {
        interactionRef.current.isDragging = true;
        interactionRef.current.draggedParticleIndex = closestIndex;
        // Unpin top row if grabbed? Or just move it?
        // Let's allow moving pinned particles too

        // Define a drag plane at the particle's depth
        interactionRef.current.planeNormal.copy(camera.position).sub(new THREE.Vector3(particles[closestIndex].x, particles[closestIndex].y, particles[closestIndex].z)).normalize();
        // Actually, let's just use a plane facing the camera
        camera.getWorldDirection(interactionRef.current.planeNormal);
        interactionRef.current.planeNormal.negate(); // Face camera

        // Plane constant d = -n . p
        const p = new THREE.Vector3(particles[closestIndex].x, particles[closestIndex].y, particles[closestIndex].z);
        interactionRef.current.planeConstant = -interactionRef.current.planeNormal.dot(p);

        // Disable orbit controls while dragging
        const controls = (window as any).orbitControls; // Hacky way to disable if we had access, but we don't directly.
        // We can stop propagation if we attach to canvas events, but R3F handles this.
        // For now, let's just rely on the fact that we are handling the logic.
      }
    };

    const handlePointerUp = () => {
      interactionRef.current.isDragging = false;
      interactionRef.current.draggedParticleIndex = -1;
    };

    gl.domElement.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      gl.domElement.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [gl, mouse, raycaster, camera, particles]);


  useFrame((state, delta) => {
    // Clamp delta to avoid explosion on tab switch
    const dt = Math.min(delta, 0.05);

    // 1. Integrate (Verlet)
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      if (p.pinned) continue;
      if (interactionRef.current.isDragging && interactionRef.current.draggedParticleIndex === i) continue;

      const vx = (p.x - p.oldX) * FRICTION;
      const vy = (p.y - p.oldY) * FRICTION;
      const vz = (p.z - p.oldZ) * FRICTION;

      p.oldX = p.x;
      p.oldY = p.y;
      p.oldZ = p.z;

      p.x += vx;
      p.y += vy;
      p.z += vz;

      // Gravity
      p.y += GRAVITY * dt * dt;

      // Floor Collision
      if (p.y < -2.5) {
        p.y = -2.5;
        p.oldY = p.y; // Stop velocity
        // Add some friction on floor
        p.oldX = p.x - (p.x - p.oldX) * 0.5;
        p.oldZ = p.z - (p.z - p.oldZ) * 0.5;
      }
    }

    // 2. Interaction (Mouse Drag)
    if (interactionRef.current.isDragging && interactionRef.current.draggedParticleIndex !== -1) {
      raycaster.setFromCamera(mouse, camera);
      const target = new THREE.Vector3();

      // Intersect ray with drag plane
      // Ray: O + tD
      // Plane: N.P + d = 0 => N.(O + tD) + d = 0 => N.O + t(N.D) + d = 0 => t = -(d + N.O) / (N.D)

      const N = interactionRef.current.planeNormal;
      const O = raycaster.ray.origin;
      const D = raycaster.ray.direction;
      const d = interactionRef.current.planeConstant;

      const denom = N.dot(D);
      if (Math.abs(denom) > 1e-6) {
        const t = -(d + N.dot(O)) / denom;
        target.copy(O).addScaledVector(D, t);

        const p = particles[interactionRef.current.draggedParticleIndex];
        // Reset velocity effectively by moving old pos too? Or just set pos?
        // For Verlet, setting pos and oldPos to same stops it. Setting oldPos to prev pos keeps velocity.
        // Let's just set pos.
        p.x = target.x;
        p.y = target.y;
        p.z = target.z;

        // To prevent massive velocity buildup when releasing, we can update oldPos to be close to current
        p.oldX = target.x - (target.x - p.oldX) * 0.1;
        p.oldY = target.y - (target.y - p.oldY) * 0.1;
        p.oldZ = target.z - (target.z - p.oldZ) * 0.1;
      }
    }

    // 3. Constraints (Relaxation)
    for (let j = 0; j < ITERATIONS; j++) {
      for (let i = 0; i < constraints.length; i++) {
        const c = constraints[i];
        const p1 = particles[c.p1];
        const p2 = particles[c.p2];

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dz = p2.z - p1.z;

        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const diff = (dist - c.length) / dist;

        if (dist === 0) continue; // Avoid division by zero

        const offsetX = dx * diff * 0.5;
        const offsetY = dy * diff * 0.5;
        const offsetZ = dz * diff * 0.5;

        const p1Fixed = p1.pinned || (interactionRef.current.isDragging && interactionRef.current.draggedParticleIndex === c.p1);
        const p2Fixed = p2.pinned || (interactionRef.current.isDragging && interactionRef.current.draggedParticleIndex === c.p2);

        if (!p1Fixed && !p2Fixed) {
          p1.x += offsetX; p1.y += offsetY; p1.z += offsetZ;
          p2.x -= offsetX; p2.y -= offsetY; p2.z -= offsetZ;
        } else if (!p1Fixed) {
          p1.x += offsetX * 2; p1.y += offsetY * 2; p1.z += offsetZ * 2;
        } else if (!p2Fixed) {
          p2.x -= offsetX * 2; p2.y -= offsetY * 2; p2.z -= offsetZ * 2;
        }
      }

      // Floor constraint again during relaxation to prevent pushing through
      for (let i = 0; i < particles.length; i++) {
        if (particles[i].y < -2.5) {
          particles[i].y = -2.5;
        }
      }
    }

    // 4. Update Geometry
    if (meshRef.current) {
      const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particles.length; i++) {
        positions[i * 3] = particles[i].x;
        positions[i * 3 + 1] = particles[i].y;
        positions[i * 3 + 2] = particles[i].z;
      }
      meshRef.current.geometry.attributes.position.needsUpdate = true;
      meshRef.current.geometry.computeVertexNormals();
    }
  });

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry} frustumCulled={false}>
        <meshPhysicalMaterial
          color="#ffb2b2" // Rose hue
          roughness={0.4}
          metalness={0.1}
          transmission={0.6}
          thickness={1.5}
          clearcoat={0.5}
          side={THREE.DoubleSide}
          flatShading={false}
        />
      </mesh>

      {/* Floor Visual */}
      <mesh position={[0, -2.51, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#1a1a1a" transparent opacity={0.5} />
      </mesh>
    </group>
  );
};

export const DigitalFabric = () => {
  return (
    <div className="w-full h-[600px] relative rounded-2xl overflow-hidden border border-white/10 bg-white/5">
      <Canvas dpr={[1, 2]} shadows camera={{ position: [0, 0, 8], fov: 45 }}>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />

        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -5, -10]} intensity={0.5} color="#ffb2b2" />

        <Environment preset="city" />

        {/* Disable pan/zoom to avoid conflict with drag, but allow rotation if not dragging? 
            Actually, let's just allow rotation. The drag logic handles the cloth. 
        */}
        <OrbitControls enablePan={false} enableZoom={true} minDistance={4} maxDistance={15} />

        <ClothSimulation />
      </Canvas>

      <div className="absolute bottom-4 right-4 pointer-events-none">
        <span className="font-mono text-xs text-liquid-chrome/50">
          INTERACTIVE // DRAG TO MOVE
        </span>
      </div>
    </div>
  );
};
