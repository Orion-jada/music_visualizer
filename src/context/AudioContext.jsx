import React, { createContext, useContext, useRef, useState, useEffect } from 'react';

const AudioContextState = createContext(null);

export const useAudio = () => {
  const context = useContext(AudioContextState);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

export const AudioProvider = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [fileName, setFileName] = useState(null);

  // Audio API refs
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const audioBufferRef = useRef(null);
  const gainNodeRef = useRef(null);
  const startTimeRef = useRef(0);
  const pauseTimeRef = useRef(0);

  // Data buffer for visualizers
  const dataArrayRef = useRef(new Uint8Array(0));

  useEffect(() => {
    // Initialize AudioContext on user interaction if needed,
    // but usually we wait for the file upload.
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioCtx();

      // Create Analyser
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 2048; // Good balance for resolution
      analyserRef.current = analyser;

      // Create Buffer for data
      const bufferLength = analyser.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      // Create Gain Node (volume)
      const gainNode = audioContextRef.current.createGain();
      gainNode.connect(audioContextRef.current.destination); // Connect to speakers
      gainNodeRef.current = gainNode;
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const loadFile = async (file) => {
    initAudioContext();

    // Stop previous
    stop();

    setFileName(file.name);
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
    audioBufferRef.current = audioBuffer;

    setHasAudio(true);
    play(); // Auto play on load
  };

  const play = () => {
    if (!audioBufferRef.current || isPlaying) return;

    const ctx = audioContextRef.current;
    const source = ctx.createBufferSource();
    source.buffer = audioBufferRef.current;

    source.connect(analyserRef.current);
    analyserRef.current.connect(gainNodeRef.current); // Analyzer -> Gain -> Destination

    // Handle resume from pause
    const offset = pauseTimeRef.current % audioBufferRef.current.duration;
    source.start(0, offset);

    startTimeRef.current = ctx.currentTime - offset;
    sourceRef.current = source;

    source.onended = () => {
      // Simple loop or stop logic could go here
      // For screensaver, looping is probably good
      // But standard 'onended' fires when stopped manually too
    };

    setIsPlaying(true);
  };

  const pause = () => {
    if (!sourceRef.current || !isPlaying) return;

    const ctx = audioContextRef.current;
    const elapsed = ctx.currentTime - startTimeRef.current;
    pauseTimeRef.current = elapsed;

    sourceRef.current.stop();
    sourceRef.current = null;
    setIsPlaying(false);
  };

  const stop = () => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current = null;
    }
    pauseTimeRef.current = 0;
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) pause();
    else play();
  };

  // Used by the Visualizer loop (r3f useFrame)
  const getFrequencyData = () => {
    if (analyserRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    }
    return dataArrayRef.current;
  };

  const getAudioMetrics = () => {
    if (!analyserRef.current) return { bass: 0, mid: 0, high: 0, level: 0 };

    // We rely on getFrequencyData being called or we call it here.
    // Usually it's cheap to read the array again if it was just updated,
    // but getByteFrequencyData copies data.
    // Let's assume the loop calls getFrequencyData or this one.
    // To be safe, we refresh it.
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    const data = dataArrayRef.current;

    // Bass: ~20Hz - 200Hz (Bins 0-10 roughly with default FFT)
    let bassSum = 0;
    const bassCount = 10;
    for (let i = 0; i < bassCount; i++) bassSum += data[i];
    const bass = bassSum / bassCount / 255;

    // Mid: ~200Hz - 2.5kHz (Bins 10-100)
    let midSum = 0;
    const midCount = 90;
    for (let i = 10; i < 100; i++) midSum += data[i];
    const mid = midSum / midCount / 255;

    // High: 2.5kHz+ (Bins 100-300)
    let highSum = 0;
    let highCount = 0;
    for (let i = 100; i < 300; i++) {
        highSum += data[i];
        highCount++;
    }
    const high = highSum / highCount / 255;

    const level = (bass + mid + high) / 3;

    return { bass, mid, high, level };
  };

  // For Exporting: We need to expose the destination node (or create a stream destination)
  // But for now, let's keep it simple. The recorder will likely need to hook into this.
  const connectToDestination = (destinationNode) => {
     if(gainNodeRef.current) {
        gainNodeRef.current.connect(destinationNode);
     }
  };

  const disconnectFromDestination = (destinationNode) => {
      if(gainNodeRef.current) {
        gainNodeRef.current.disconnect(destinationNode);
      }
  };

  return (
    <AudioContextState.Provider value={{
      loadFile,
      togglePlay,
      isPlaying,
      hasAudio,
      fileName,
      getFrequencyData,
      getAudioMetrics,
      audioContext: audioContextRef, // Expose ref if needed
      connectToDestination,
      disconnectFromDestination
    }}>
      {children}
    </AudioContextState.Provider>
  );
};
