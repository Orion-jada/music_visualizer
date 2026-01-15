import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAudio } from '../../context/AudioContext';

const COUNT = 3000;

export const BlackHole = ({ color1 = "#ffaa00", color2 = "#ffffff", reactivity = 1.0 }) => {
  const pointsRef = useRef();
  const { getAudioMetrics } = useAudio();

  // Use a ref for mutable particle state to satisfy linter and React purity
  const particlesRef = useRef([]);

  useEffect(() => {
      const data = [];
      for(let i=0; i<COUNT; i++) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 2 + Math.random() * 3;
          const speed = 0.5 + Math.random() * 0.5;
          const y = (Math.random() - 0.5) * 0.5;
          data.push({ angle, radius, speed, y, initialRadius: radius });
      }
      particlesRef.current = data;
  }, []);

  const positions = useMemo(() => new Float32Array(COUNT * 3), []);
  const colors = useMemo(() => new Float32Array(COUNT * 3), []);

  const c1 = useMemo(() => new THREE.Color(color1), [color1]);
  const c2 = useMemo(() => new THREE.Color(color2), [color2]);

  useFrame(({ clock }) => {
      if (!pointsRef.current || particlesRef.current.length === 0) return;

      const { bass, mid, high } = getAudioMetrics();
      const positionsAttr = pointsRef.current.geometry.attributes.position;
      const colorsAttr = pointsRef.current.geometry.attributes.color;

      const expansion = bass * 0.2 * reactivity;
      const spinSpeed = 1 + (high * 3 * reactivity);
      const dt = 0.016;

      const particles = particlesRef.current;

      for(let i=0; i<COUNT; i++) {
          const p = particles[i];

          // Rotate
          p.angle += p.speed * dt * spinSpeed;

          // Spiral dynamics
          let currentRadius = p.radius + expansion;
          p.radius -= 0.005; // Gravity

          if (p.radius < 0.5) {
              p.radius = 4 + Math.random();
          }

          const wobble = Math.sin(clock.elapsedTime * 2 + p.angle * 3) * (mid * 0.5 * reactivity);

          const x = Math.cos(p.angle) * currentRadius;
          const z = Math.sin(p.angle) * currentRadius;

          positionsAttr.setXYZ(i, x, p.y + wobble, z);

          // Color Gradient
          const t = Math.min(1, Math.max(0, (currentRadius - 1) / 4));
          const c = new THREE.Color().copy(c1).lerp(c2, t);

          if (bass > 0.5) {
             c.multiplyScalar(1 + (bass * 0.5 * reactivity));
          }

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
            size={0.06}
            vertexColors
            transparent
            opacity={0.8}
            blending={THREE.AdditiveBlending}
        />
    </points>
  );
};
