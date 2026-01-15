import React, { useCallback, useState, useEffect } from 'react';
import { useAudio } from '../context/AudioContext';
import { useRecorder } from '../hooks/useRecorder';
import { Upload, Play, Pause, FileAudio, Video, StopCircle } from 'lucide-react';

export const UI = () => {
  const { loadFile, isPlaying, togglePlay, hasAudio, fileName } = useAudio();
  const { isRecording, startRecording, stopRecording } = useRecorder();
  const [isDragging, setIsDragging] = useState(false);

  const onFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      loadFile(file);
    }
  }, [loadFile]);

  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e) => {
      e.preventDefault();
      dragCounter++;
      if (dragCounter > 0) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        setIsDragging(false);
        dragCounter = 0;
      }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
      e.preventDefault();
      dragCounter = 0;
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('audio/')) {
        loadFile(file);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [loadFile]);

  const toggleRecording = () => {
      if (isRecording) {
          stopRecording();
      } else {
          startRecording();
      }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 100,
        pointerEvents: isDragging ? 'auto' : 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: isDragging ? 'center' : 'flex-start',
        alignItems: isDragging ? 'center' : 'flex-start',
        background: isDragging ? 'rgba(0,0,0,0.8)' : 'transparent',
        transition: 'background 0.3s'
      }}
    >
      {/* Drag Overlay */}
      {isDragging && (
          <div style={{ color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Upload size={64} />
              <h1>Drop Audio File Here</h1>
          </div>
      )}

      {/* Control Panel */}
      {!isDragging && (
        <div style={{
            pointerEvents: 'auto',
            background: 'rgba(20, 20, 20, 0.8)',
            backdropFilter: 'blur(10px)',
            padding: '20px',
            margin: '20px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            minWidth: '300px'
        }}>
            <h1 style={{ margin: '0 0 15px 0', fontSize: '1.5rem', color: '#fff', fontWeight: '800', letterSpacing: '-0.02em' }}>
                Waveform<span style={{ color: '#ff005b' }}>.viz</span>
            </h1>

            {!hasAudio && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ color: '#888', marginBottom: '15px' }}>Upload an MP3 or WAV file to start.</p>
                <label style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#ff005b',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '50px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 15px rgba(255, 0, 91, 0.4)',
                    transition: 'transform 0.2s'
                }}>
                    <Upload size={18} />
                    Select File
                    <input type="file" accept="audio/*" onChange={onFileChange} style={{ display: 'none' }} />
                </label>
            </div>
            )}

            {hasAudio && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ccc', fontSize: '0.9rem', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px' }}>
                    <FileAudio size={20} color="#ff005b" />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                        {fileName}
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {/* Play/Pause */}
                    <button onClick={togglePlay} style={{
                        background: 'white',
                        border: 'none',
                        color: 'black',
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 0 15px rgba(255,255,255,0.2)'
                    }}>
                        {isPlaying ? <Pause size={24} fill="black" /> : <Play size={24} fill="black" />}
                    </button>

                    {/* Record Button */}
                    <button
                        onClick={toggleRecording}
                        title={isRecording ? "Stop Recording" : "Start Recording"}
                        style={{
                            background: isRecording ? '#ff005b' : '#333',
                            border: 'none',
                            color: 'white',
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                        }}
                    >
                        {isRecording ? <StopCircle size={24} /> : <Video size={24} />}
                    </button>

                    <label style={{
                        marginLeft: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: 'transparent',
                        border: '1px solid #444',
                        color: '#aaa',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                    }}>
                        Change Song
                        <input type="file" accept="audio/*" onChange={onFileChange} style={{ display: 'none' }} />
                    </label>
                </div>
                {isRecording && (
                    <div style={{ fontSize: '0.8rem', color: '#ff005b', fontWeight: 'bold', textAlign: 'center' }}>
                        Recording... (Audio + Video)
                    </div>
                )}
            </div>
            )}
        </div>
      )}
    </div>
  );
};
