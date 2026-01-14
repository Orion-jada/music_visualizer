import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';
import { useAudio } from '../../context/AudioContext';

const ROWS = 50;
const COLS = 50;
const COUNT = ROWS * COLS;
const SPACING = 0.4;

export const ParticleWave = ({ color1, color2 }) => {
  const meshRef = useRef();
  const { getFrequencyData } = useAudio();
  const noise3D = useMemo(() => createNoise3D(), []);

  // Buffers for positions and colors
  // But wait, changing 2500 instance matrices every frame is heavy but doable.
  // Using Points might be faster and cooler for "Particles".
  // Let's stick to InstancedMesh (cubes or spheres) for a "retro" look, or Points for "starfield" look.
  // The user prompt image 2 is "Points/Lines". Points is efficient.

  // Let's use Points.
  const pointsRef = useRef();

  const positions = useMemo(() => {
      const pos = new Float32Array(COUNT * 3);
      let i = 0;
      for (let x = 0; x < COLS; x++) {
          for (let z = 0; z < ROWS; z++) {
              pos[i] = (x - COLS / 2) * SPACING;
              pos[i + 1] = 0;
              pos[i + 2] = (z - ROWS / 2) * SPACING;
              i += 3;
          }
      }
      return pos;
  }, []);

  useFrame(({ clock }) => {
      if (!pointsRef.current) return;

      const data = getFrequencyData();
      // Calculate a "bass" value for overall wave height
      let bass = 0;
      for(let k=0; k<10; k++) bass += data[k];
      bass = bass / 10 / 255; // 0..1

      const time = clock.getElapsedTime();
      const positionsAttribute = pointsRef.current.geometry.attributes.position;

      let i = 0;
      for (let x = 0; x < COLS; x++) {
          for (let z = 0; z < ROWS; z++) {
              // x and z indices map to frequency?
              // Or just noise animated by time + frequency punch.

              // Let's use noise for the wave
              const xPos = (x - COLS / 2) * SPACING;
              const zPos = (z - ROWS / 2) * SPACING;

              // Noise input scaling
              const noiseAmp = 2 + (bass * 3); // Bass makes waves higher
              const noiseFreq = 0.15;
              const speed = 0.5;

              const y = noise3D(x * noiseFreq, z * noiseFreq + time * speed, time * 0.1) * noiseAmp;

              // Add some high freq spikes based on x index?
              // Map X to frequency bins
              const freqIndex = Math.floor((x / COLS) * 100);
              const freqVal = (data[freqIndex] || 0) / 255;

              const finalY = y + (freqVal * 2);

              // Update Y
              positionsAttribute.setY(i, finalY);

              i++;
          }
      }
      positionsAttribute.needsUpdate = true;
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
        </bufferGeometry>
        <pointsMaterial
            size={0.15}
            color={color1}
            sizeAttenuation
            transparent
            opacity={0.8}
            blending={THREE.AdditiveBlending}
        />
    </points>
  );
};
