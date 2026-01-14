import React, { useState } from 'react';
import { useControls, folder } from 'leva';
import { CircularSpectrum } from './visualizers/CircularSpectrum';
import { ParticleWave } from './visualizers/ParticleWave';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { OrbitControls } from '@react-three/drei';

export const VisualizerManager = () => {
  const { mode, bloomIntensity, bloomThreshold } = useControls('Visualizer Settings', {
    mode: { options: ['Spectrum Ring', 'Particle Wave'] },
    bloomIntensity: { value: 1.5, min: 0, max: 5 },
    bloomThreshold: { value: 0.2, min: 0, max: 1 },
  });

  const spectrumControls = useControls('Spectrum Colors', {
     primary: '#00d0ff',
     secondary: '#ff005b',
     render: (get) => get('Visualizer Settings.mode') === 'Spectrum Ring'
  });

  const waveControls = useControls('Wave Colors', {
     particles: '#ea00ff',
     render: (get) => get('Visualizer Settings.mode') === 'Particle Wave'
  });

  return (
    <>
      {/* Interactive Camera */}
      <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} />

      {/* Lighting */}
      <ambientLight intensity={0.5} />

      {/* Scenes */}
      {mode === 'Spectrum Ring' && (
         <CircularSpectrum
            color={spectrumControls.primary}
         />
      )}

      {mode === 'Particle Wave' && (
         <ParticleWave
            color1={waveControls.particles}
         />
      )}

      {/* Post Processing */}
      <EffectComposer disableNormalPass>
        <Bloom
            luminanceThreshold={bloomThreshold}
            mipmapBlur
            intensity={bloomIntensity}
            radius={0.7}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  );
};
