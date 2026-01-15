import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAudio } from '../../context/AudioContext';

const COUNT = 360;
const RADIUS = 3;
const BAR_WIDTH = 0.1;
const BAR_DEPTH = 0.05;

export const CircularSpectrum = ({ color, lowColor, reactivity = 1.0 }) => {
  const meshRef = useRef();
  const { getFrequencyData, getAudioMetrics } = useAudio();

  // Use Ref for scratchpad object to avoid linter warnings about mutating memoized values
  const dummy = useRef(new THREE.Object3D());

  const color1 = useMemo(() => new THREE.Color(lowColor || "#ff0000"), [lowColor]);
  const color3 = useMemo(() => new THREE.Color(color || "#0000ff"), [color]);

  useFrame(() => {
    if (!meshRef.current) return;

    const data = getFrequencyData();
    const { bass } = getAudioMetrics();

    const pump = 1 + (bass * 0.2 * reactivity);
    const helper = dummy.current;

    for (let i = 0; i < COUNT; i++) {
        let spectrumIndex = i <= COUNT / 2 ? i : COUNT - i;
        const dataIndex = Math.floor(spectrumIndex * (120 / (COUNT / 2)));

        const val = data[dataIndex] || 0;
        const nVal = val / 255;

        const height = (0.5 + Math.pow(nVal, 2) * 8 * reactivity) * pump;

        const angle = (i / COUNT) * Math.PI * 2;
        const dist = RADIUS * pump + (height / 2);

        helper.position.set(Math.cos(angle) * dist, Math.sin(angle) * dist, 0);
        helper.rotation.z = angle;
        helper.scale.set(1, height, 1);

        helper.updateMatrix();
        meshRef.current.setMatrixAt(i, helper.matrix);

        const mixedColor = new THREE.Color().copy(color1).lerp(color3, nVal);
        mixedColor.multiplyScalar(1 + nVal * 2);

        meshRef.current.setColorAt(i, mixedColor);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={meshRef} args={[null, null, COUNT]}>
        <boxGeometry args={[BAR_WIDTH, 1, BAR_DEPTH]} />
        <meshStandardMaterial
            toneMapped={false}
            vertexColors
            transparent
            opacity={0.9}
        />
      </instancedMesh>

      <InnerRing color={color1} reactivity={reactivity} />
    </group>
  );
};

const InnerRing = ({ color, reactivity }) => {
    const mesh = useRef();
    const { getAudioMetrics } = useAudio();

    useFrame(() => {
        const { bass } = getAudioMetrics();
        const s = 2.8 + (bass * 0.5 * reactivity);
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
