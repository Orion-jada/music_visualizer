import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAudio } from '../../context/AudioContext';

const COUNT = 3000;

export const BlackHole = ({ color1 = "#ffaa00", color2 = "#ffffff" }) => {
  const pointsRef = useRef();
  const { getAudioMetrics } = useAudio();

  // Initial random positions (Disk)
  // Store { angle, radius, speed, y } in a custom array or just use buffer attributes
  // To avoid re-calc every frame in JS, we usually use shaders.
  // But for <5000 points, JS loop is fine.

  const particles = useMemo(() => {
      const data = [];
      for(let i=0; i<COUNT; i++) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 2 + Math.random() * 3; // 2 to 5
          const speed = 0.5 + Math.random() * 0.5;
          const y = (Math.random() - 0.5) * 0.5; // Flattened disk
          data.push({ angle, radius, speed, y, initialRadius: radius });
      }
      return data;
  }, []);

  const positions = useMemo(() => new Float32Array(COUNT * 3), []);
  const colors = useMemo(() => new Float32Array(COUNT * 3), []);

  const c1 = new THREE.Color(color1); // Inner/Core color
  const c2 = new THREE.Color(color2); // Outer color

  useFrame(({ clock }) => {
      if (!pointsRef.current) return;

      const { bass, high } = getAudioMetrics();
      const positionsAttr = pointsRef.current.geometry.attributes.position;
      const colorsAttr = pointsRef.current.geometry.attributes.color;

      // Expansion force from bass
      const expansion = bass * 0.1;
      const dt = 0.016; // Approx 60fps

      for(let i=0; i<COUNT; i++) {
          const p = particles[i];

          // Rotate
          p.angle += p.speed * dt * (1 + high * 2); // Spin faster on highs

          // Spiral in defaults, but push out on bass
          p.radius -= 0.01;
          p.radius += expansion;

          // Reset if sucked in too much
          if (p.radius < 0.5) {
              p.radius = 4 + Math.random();
          }
          if (p.radius > 6) {
              p.radius = 6;
          }

          const x = Math.cos(p.angle) * p.radius;
          const z = Math.sin(p.angle) * p.radius;

          positionsAttr.setXYZ(i, x, p.y + (Math.sin(clock.elapsedTime + p.angle)*0.2), z);

          // Color Gradient based on radius
          // Inner (small radius) -> Hot/White?
          // Let's say Inner = Color1, Outer = Color2
          const t = Math.min(1, Math.max(0, (p.radius - 1) / 4));
          const c = new THREE.Color().copy(c1).lerp(c2, t);

          // Boost brightness near center
          if (p.radius < 1.5) c.multiplyScalar(2);

          colorsAttr.setXYZ(i, c.r, c.g, c.b);
      }

      positionsAttr.needsUpdate = true;
      colorsAttr.needsUpdate = true;
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
            size={0.05}
            vertexColors
            transparent
            opacity={0.8}
            blending={THREE.AdditiveBlending}
        />
    </points>
  );
};
