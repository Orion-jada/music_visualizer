import { useState, useRef, useCallback } from 'react';
import { useAudio } from '../context/AudioContext';

export const useRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamDestRef = useRef(null);

  const { audioContext, connectToDestination, disconnectFromDestination } = useAudio();

  const startRecording = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      console.error("Canvas not found");
      return;
    }

    // 1. Setup Audio Stream
    if (!audioContext.current) {
        console.error("Audio Context not ready");
        return;
    }

    const dest = audioContext.current.createMediaStreamDestination();
    streamDestRef.current = dest;
    connectToDestination(dest);

    // 2. Setup Video Stream
    // 60 FPS, high quality
    const canvasStream = canvas.captureStream(60);

    // 3. Combine
    const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks()
    ]);

    // 4. Init Recorder
    const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4' // Experimental in some browsers
    ];

    let selectedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';

    if (!selectedMimeType) {
        alert('MediaRecorder not supported in this browser.');
        return;
    }

    const recorder = new MediaRecorder(combinedStream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: 8000000 // 8 Mbps
    });

    recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
            chunksRef.current.push(e.data);
        }
    };

    recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: selectedMimeType });
        chunksRef.current = [];

        // Download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const ext = selectedMimeType.includes('mp4') ? 'mp4' : 'webm';
        a.download = `visualization-${Date.now()}.${ext}`;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);

        // Cleanup Audio
        if (streamDestRef.current) {
            disconnectFromDestination(streamDestRef.current);
            streamDestRef.current = null;
        }
    };

    recorder.start();
    setIsRecording(true);
    mediaRecorderRef.current = recorder;

  }, [audioContext, connectToDestination, disconnectFromDestination]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
    }
  }, []);

  return { isRecording, startRecording, stopRecording };
};
