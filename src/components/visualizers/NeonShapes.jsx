import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useAudio } from '../../context/AudioContext';

export const NeonShapes = ({ color1 = "#ff00ff", color2 = "#00ffff", reactivity = 1.0 }) => {
  return (
    <group>
      <Stars radius={200} depth={100} count={3000} factor={6} saturation={0} fade speed={1} />
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <CentralShape color={color1} reactivity={reactivity} />
      </Float>
      <Satellites color={color2} count={12} reactivity={reactivity} />
    </group>
  );
};

const CentralShape = ({ color, reactivity }) => {
  const mesh = useRef();
  const { getAudioMetrics } = useAudio();

  useFrame((state, delta) => {
    const { bass, mid, high } = getAudioMetrics();

    // Scale on bass
    const scale = 1 + (bass * 1.5 * reactivity);
    mesh.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.2);

    // Rotate on mid/high
    mesh.current.rotation.x += delta * (0.2 + (mid * reactivity));
    mesh.current.rotation.y += delta * (0.2 + (high * reactivity));

    // Color pulsing
    mesh.current.material.color.lerp(new THREE.Color(color).multiplyScalar(1 + (bass * reactivity)), 0.1);
  });

  return (
    <mesh ref={mesh}>
      <icosahedronGeometry args={[1.5, 1]} />
      <meshBasicMaterial color={color} wireframe toneMapped={false} />
    </mesh>
  );
};

const Satellites = ({ color, count, reactivity }) => {
    const group = useRef();
    const { getAudioMetrics } = useAudio();

    // Use useState initializer for stable random data
    const [satellites] = useState(() => {
        return new Array(count).fill(0).map((_, i) => {
            const angle = (i / count) * Math.PI * 2;
            const r = 4;
            return {
                position: [Math.cos(angle) * r, Math.sin(angle) * r, 0],
                phase: Math.random() * Math.PI
            };
        });
    });

    useFrame((state) => {
        const { level } = getAudioMetrics();
        const t = state.clock.getElapsedTime();

        // Rotate the whole group
        group.current.rotation.z = t * 0.2 + (level * reactivity);
    });

    return (
        <group ref={group}>
            {satellites.map((d, i) => (
                <Satellite key={i} position={d.position} color={color} index={i} reactivity={reactivity} />
            ))}
        </group>
    );
};

const Satellite = ({ position, color, index, reactivity }) => {
    const mesh = useRef();
    const { getAudioMetrics } = useAudio();

    useFrame((state) => {
        const { high } = getAudioMetrics();
        const t = state.clock.getElapsedTime();

        // Individual rotation
        mesh.current.rotation.x = t * 2 + index;
        mesh.current.rotation.y = t * 3;

        // Punch scale on high
        const s = 0.4 + (high * 0.8 * reactivity);
        mesh.current.scale.setScalar(s);
    });

    return (
        <mesh ref={mesh} position={position}>
            <octahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color={color} wireframe toneMapped={false} />
        </mesh>
    );
}
