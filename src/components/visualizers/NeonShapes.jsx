import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useAudio } from '../../context/AudioContext';

export const NeonShapes = ({ color1 = "#ff00ff", color2 = "#00ffff" }) => {
  return (
    <group>
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <CentralShape color={color1} />
      </Float>
      <Satellites color={color2} count={12} />
    </group>
  );
};

const CentralShape = ({ color }) => {
  const mesh = useRef();
  const { getAudioMetrics } = useAudio();

  useFrame((state, delta) => {
    const { bass, mid, high } = getAudioMetrics();

    // Scale on bass
    const scale = 1 + bass * 1.5;
    mesh.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.2);

    // Rotate on mid/high
    mesh.current.rotation.x += delta * (0.2 + mid);
    mesh.current.rotation.y += delta * (0.2 + high);

    // Color pulsing?
    mesh.current.material.color.lerp(new THREE.Color(color).multiplyScalar(1 + bass), 0.1);
  });

  return (
    <mesh ref={mesh}>
      <icosahedronGeometry args={[1.5, 1]} />
      <meshBasicMaterial color={color} wireframe toneMapped={false} />
    </mesh>
  );
};

const Satellites = ({ color, count }) => {
    const group = useRef();
    const { getAudioMetrics } = useAudio();

    const dummies = useMemo(() => {
        return new Array(count).fill(0).map((_, i) => {
            const angle = (i / count) * Math.PI * 2;
            const r = 4;
            return {
                position: [Math.cos(angle) * r, Math.sin(angle) * r, 0],
                phase: Math.random() * Math.PI
            };
        });
    }, [count]);

    useFrame((state) => {
        const { bass, level } = getAudioMetrics();
        const t = state.clock.getElapsedTime();

        // Rotate the whole group
        group.current.rotation.z = t * 0.2 + level; // Spin faster with volume

        // Children are static relative to group, but we could animate them if they were meshes.
        // But here I'll just let the group spin.
    });

    return (
        <group ref={group}>
            {dummies.map((d, i) => (
                <Satellite key={i} position={d.position} color={color} index={i} />
            ))}
        </group>
    );
};

const Satellite = ({ position, color, index }) => {
    const mesh = useRef();
    const { getAudioMetrics } = useAudio();

    useFrame((state) => {
        const { high } = getAudioMetrics();
        const t = state.clock.getElapsedTime();

        // Individual rotation
        mesh.current.rotation.x = t * 2 + index;
        mesh.current.rotation.y = t * 3;

        // Punch scale on high
        const s = 0.4 + high * 0.8;
        mesh.current.scale.setScalar(s);
    });

    return (
        <mesh ref={mesh} position={position}>
            <octahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color={color} wireframe toneMapped={false} />
        </mesh>
    );
}
