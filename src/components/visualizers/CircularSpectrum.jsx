import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAudio } from '../../context/AudioContext';

const COUNT = 120; // Number of bars
const RADIUS = 2; // Radius of the circle

export const CircularSpectrum = ({ color, midColor, lowColor }) => {
  const meshRef = useRef();
  const { getFrequencyData } = useAudio();

  // Dummy object for calculating matrix
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Initial positions
  useEffect(() => {
    if (!meshRef.current) return;

    for (let i = 0; i < COUNT; i++) {
      const angle = (i / COUNT) * Math.PI * 2;
      const x = Math.cos(angle) * RADIUS;
      const y = Math.sin(angle) * RADIUS;

      dummy.position.set(x, y, 0);
      dummy.rotation.z = angle;
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [dummy]);

  useFrame(() => {
    if (!meshRef.current) return;

    const data = getFrequencyData();
    // data is typically 1024 length
    // We map our 120 bars to the data
    // We want bass (low index) to be significant.
    // Let's wrap: index 0 is at bottom (3*PI/2) or top.

    // We'll map the 120 bars to the first ~200-300 bins where most music energy is.
    const step = Math.floor(data.length / COUNT); // linear sampling is okay for now

    for (let i = 0; i < COUNT; i++) {
        // Mirrored spectrum logic
        // 0 -> COUNT/2 -> 0
        // adjustedIndex maps i (0..120) to spectrum (0..60..0)
        let spectrumIndex = i < COUNT / 2 ? i : COUNT - i;
        spectrumIndex = Math.floor(spectrumIndex * (data.length * 0.4) / (COUNT / 2));
        // using 40% of the frequency range (bass/mids)

        const value = data[spectrumIndex] || 0;
        const scale = 1 + (value / 255) * 4; // Scale 1 to 5

        const angle = (i / COUNT) * Math.PI * 2;

        dummy.position.set(Math.cos(angle) * RADIUS, Math.sin(angle) * RADIUS, 0);
        dummy.rotation.z = angle;

        // Scale along the local X (which points outwards due to rotation)
        dummy.scale.set(scale, 0.4 + (scale * 0.1), 0.2);

        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);

        // Dynamic Coloring logic could go here if using instanceColor
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={meshRef} args={[null, null, COUNT]}>
        <boxGeometry args={[0.1, 0.5, 0.1]} /> {/* Base size */}
        <meshStandardMaterial
            color={color}
            toneMapped={false} // Important for Bloom!
            emissive={color}
            emissiveIntensity={2}
        />
      </instancedMesh>

      {/* Center Pulse Circle */}
      <CenterPulse />
    </group>
  );
};

const CenterPulse = () => {
    const mesh = useRef();
    const { getFrequencyData } = useAudio();

    useFrame(() => {
        const data = getFrequencyData();
        // Average bass frequencies (0-20)
        let sum = 0;
        for(let i=0; i<20; i++) sum += data[i];
        const avg = sum / 20;

        const scale = 1 + (avg / 255) * 1.5;
        mesh.current.scale.setScalar(scale);
    });

    return (
        <mesh ref={mesh}>
            <circleGeometry args={[1, 32]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.1} />
        </mesh>
    );
}
