import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';
import { useAudio } from '../../context/AudioContext';

const ROWS = 60;
const COLS = 60;
const COUNT = ROWS * COLS;
const SPACING = 0.35;

export const ParticleWave = ({ color1, color2, reactivity = 1.0, speed = 0.5 }) => {
  const pointsRef = useRef();
  const { getAudioMetrics } = useAudio();
  const noise3D = useMemo(() => createNoise3D(), []);

  const { positions, colors } = useMemo(() => {
      const pos = new Float32Array(COUNT * 3);
      const col = new Float32Array(COUNT * 3);
      let i = 0;
      for (let x = 0; x < COLS; x++) {
          for (let z = 0; z < ROWS; z++) {
              pos[i] = (x - COLS / 2) * SPACING;
              pos[i + 1] = 0;
              pos[i + 2] = (z - ROWS / 2) * SPACING;

              col[i] = 1; col[i+1] = 1; col[i+2] = 1;
              i += 3;
          }
      }
      return { positions: pos, colors: col };
  }, []);

  const baseColor = useMemo(() => new THREE.Color(color1 || "#00ffff"), [color1]);
  const highColor = useMemo(() => new THREE.Color(color2 || "#ff00ff"), [color2]);

  useFrame(({ clock }) => {
      if (!pointsRef.current) return;

      const { bass, mid, high } = getAudioMetrics();
      const time = clock.getElapsedTime();

      const positionsAttribute = pointsRef.current.geometry.attributes.position;
      const colorsAttribute = pointsRef.current.geometry.attributes.color;

      let idx = 0;

      // Dynamic parameters scaled by reactivity
      const waveHeight = (2 + (bass * 8)) * reactivity;
      // Speed controls the Z-axis movement (horizontal flow)
      // We scale time by 'speed' in the noise function
      const flowSpeed = speed * (1 + high * 0.2);

      for (let x = 0; x < COLS; x++) {
          for (let z = 0; z < ROWS; z++) {

              // Simplex Noise
              // Use 'speed' to control how fast the noise field moves through the Z axis
              const noiseVal = noise3D(x * 0.1, z * 0.1 + time * flowSpeed, time * 0.2);

              // Secondary ripple from mids
              const ripple = Math.sin(Math.sqrt(x*x + z*z) * 0.5 - time * 5) * mid * 2 * reactivity;

              const y = (noiseVal * waveHeight) + ripple;

              positionsAttribute.setY(idx, y);

              // Color mapping
              const t = (y / (waveHeight || 1) + 1) / 2;
              const c = new THREE.Color().copy(baseColor).lerp(highColor, t);

              if (y > waveHeight * 0.5) c.multiplyScalar(1.5);

              colorsAttribute.setXYZ(idx, c.r, c.g, c.b);

              idx++;
          }
      }
      positionsAttribute.needsUpdate = true;
      colorsAttribute.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
        <bufferGeometry>
            <bufferAttribute
                attach="attributes-position"
                count={COUNT}
                array={positions}
                itemSize={3}
            />
            <bufferAttribute
                attach="attributes-color"
                count={COUNT}
                array={colors}
                itemSize={3}
            />
        </bufferGeometry>
        <pointsMaterial
            size={0.12}
            vertexColors
            sizeAttenuation
            transparent
            opacity={0.8}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
        />
    </points>
  );
};
