import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAudio } from '../../context/AudioContext';

const COUNT = 360; // Denser bars for a ring look
const RADIUS = 3;

export const CircularSpectrum = ({ color, midColor, lowColor }) => {
  const meshRef = useRef();
  const { getFrequencyData, getAudioMetrics } = useAudio();

  const dummy = useMemo(() => new THREE.Object3D(), []);
  // Pre-allocate colors array for instance coloring
  const colors = useMemo(() => new Float32Array(COUNT * 3), []);

  const color1 = useMemo(() => new THREE.Color(lowColor || "#ff0000"), [lowColor]);
  const color2 = useMemo(() => new THREE.Color(midColor || "#00ff00"), [midColor]);
  const color3 = useMemo(() => new THREE.Color(color || "#0000ff"), [color]);

  useFrame(() => {
    if (!meshRef.current) return;

    const data = getFrequencyData();
    const { bass } = getAudioMetrics();

    // Smooth bass factor for global pump
    const pump = 1 + bass * 0.2;

    for (let i = 0; i < COUNT; i++) {
        // Mirrored mapping:
        // 0 (Top) -> Low Freqs
        // COUNT/2 (Bottom) -> High Freqs -> Low Freqs?
        // Actually typically Top is Highs or Lows.
        // Let's do: 0 (Right) -> Lows, COUNT/2 (Left) -> Highs.
        // Or 0 is Top.

        // Let's make it symmetrical: 0 and COUNT are Top (Highs), COUNT/2 is Bottom (Lows).
        // Or Center Top (Lows) mirroring down to Bottom (Highs).

        // Let's do: Top (index 0) is Bass. Bottom (index 180) is Treble.
        // It's a mirrored half-circle.

        const distFromTop = Math.abs(i - COUNT / 2); // 0 at bottom, 180 at top
        // Remap to 0..1
        const normalizedIndex = Math.abs((i - COUNT/4 * 3) % (COUNT/2)) / (COUNT/2);

        // Simpler Mirror:
        // i goes 0 -> 360.
        // spectrumIndex needs to go 0 -> 100 -> 0.
        let spectrumIndex = i <= COUNT / 2 ? i : COUNT - i; // 0..180

        // Map 0..180 to 0..100 (frequency bin subset)
        // We use first 120 bins mostly
        const dataIndex = Math.floor(spectrumIndex * (120 / (COUNT / 2)));

        const val = data[dataIndex] || 0;
        const nVal = val / 255;

        const scale = 0.5 + Math.pow(nVal, 2) * 8 * pump; // Exponential curve for punchiness

        const angle = (i / COUNT) * Math.PI * 2;

        dummy.position.set(Math.cos(angle) * RADIUS * pump, Math.sin(angle) * RADIUS * pump, 0);
        dummy.rotation.z = angle;

        dummy.scale.set(scale, 0.2, 0.1);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);

        // Color Interpolation
        // Low index (bass) -> color1
        // High index -> color3
        const mixedColor = new THREE.Color().copy(color1).lerp(color3, nVal);
        // Add brightness based on intensity
        mixedColor.multiplyScalar(1 + nVal * 2);

        meshRef.current.setColorAt(i, mixedColor);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={meshRef} args={[null, null, COUNT]}>
        <boxGeometry args={[0.1, 0.4, 0.05]} />
        <meshStandardMaterial
            toneMapped={false}
            vertexColors
            transparent
            opacity={0.9}
        />
      </instancedMesh>

      {/* Inner Glow Ring */}
      <InnerRing color={color1} />
    </group>
  );
};

const InnerRing = ({ color }) => {
    const mesh = useRef();
    const { getAudioMetrics } = useAudio();

    useFrame(() => {
        const { bass } = getAudioMetrics();
        const s = 2.8 + (bass * 0.5);
        mesh.current.scale.setScalar(s);
        mesh.current.rotation.z -= 0.005;
    });

    return (
        <mesh ref={mesh}>
            <torusGeometry args={[1, 0.02, 16, 100]} />
            <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.5} />
        </mesh>
    );
};
