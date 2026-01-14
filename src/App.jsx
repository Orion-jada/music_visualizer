import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Leva } from 'leva';
import { AudioProvider } from './context/AudioContext';
import { UI } from './components/UI';
import { VisualizerManager } from './components/VisualizerManager';

function App() {
  return (
    <AudioProvider>
      <UI />
      <Leva
        theme={{ colors: { accent: '#ff005b', elevation1: '#181818' } }}
        collapsed={false}
      />

      <Canvas
        camera={{ position: [0, 4, 8], fov: 60 }} // Adjusted camera for better view
        style={{ background: '#000000', width: '100vw', height: '100vh' }}
        dpr={[1, 2]}
        gl={{ preserveDrawingBuffer: true }}
      >
        <color attach="background" args={['#000']} />

        <Suspense fallback={null}>
           <VisualizerManager />
        </Suspense>
      </Canvas>
    </AudioProvider>
  );
}

export default App;
