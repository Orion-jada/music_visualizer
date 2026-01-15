import React from 'react';
import { useControls } from 'leva';
import { CircularSpectrum } from './visualizers/CircularSpectrum';
import { ParticleWave } from './visualizers/ParticleWave';
import { NeonShapes } from './visualizers/NeonShapes';
import { BlackHole } from './visualizers/BlackHole';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { OrbitControls } from '@react-three/drei';

export const VisualizerManager = () => {
  const { mode, bloomIntensity, bloomThreshold, autoRotate, vignetteDarkness, reactivity, waveSpeed } = useControls('Settings', {
    mode: { options: ['Spectrum Ring', 'Particle Wave', 'Neon Shapes', 'Black Hole'] },
    reactivity: { value: 1.0, min: 0.1, max: 3.0, label: 'Audio Reactivity' },
    bloomIntensity: { value: 2.0, min: 0, max: 10 },
    bloomThreshold: { value: 0.15, min: 0, max: 1 },
    autoRotate: true,
    vignetteDarkness: { value: 1.1, min: 0, max: 2 },
    waveSpeed: { value: 0.5, min: 0, max: 2.0, render: (get) => get('Settings.mode') === 'Particle Wave' },
  });

  const { color1, color2 } = useControls('Colors', {
     color1: { value: '#00e0ff', label: 'Primary Color' },
     color2: { value: '#ff0077', label: 'Secondary Color' }
  });

  return (
    <>
      {/* Interactive Camera */}
      <OrbitControls makeDefault autoRotate={autoRotate} autoRotateSpeed={0.5} />

      {/* Lighting - minimal, we rely on emissive materials mostly */}
      <ambientLight intensity={0.2} />

      {/* Scenes */}
      {mode === 'Spectrum Ring' && (
         <CircularSpectrum
            color={color1}
            midColor={color2}
            lowColor={color1}
            reactivity={reactivity}
         />
      )}

      {mode === 'Particle Wave' && (
         <ParticleWave
            color1={color1}
            color2={color2}
            reactivity={reactivity}
            speed={waveSpeed}
         />
      )}

      {mode === 'Neon Shapes' && (
         <NeonShapes
            color1={color1}
            color2={color2}
            reactivity={reactivity}
         />
      )}

      {mode === 'Black Hole' && (
         <BlackHole
            color1={color1}
            color2={color2}
            reactivity={reactivity}
         />
      )}

      {/* Post Processing */}
      <EffectComposer disableNormalPass>
        <Bloom
            luminanceThreshold={bloomThreshold}
            mipmapBlur
            intensity={bloomIntensity}
            radius={0.6}
        />
        <Vignette eskil={false} offset={0.1} darkness={vignetteDarkness} />
        {/* Subtle noise adds realism */}
        <Noise opacity={0.05} />
      </EffectComposer>
    </>
  );
};
