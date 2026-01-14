# Waveform.viz

A stunning 3D music visualizer web application built with React, Three.js, and the Web Audio API.

## Features

- **Real-time Audio Analysis**: Visualizes frequency data from uploaded audio files.
- **Two Visualizer Modes**:
  - **Spectrum Ring**: A circular array of bars reacting to frequency, with a pulsing center.
  - **Particle Wave**: A flowing grid of particles animated by Simplex noise and bass frequencies.
- **Post-Processing Effects**: Configurable Bloom (glow) and Vignette for a cinematic look.
- **Drag & Drop**: Simply drag an MP3 or WAV file onto the screen to play.
- **Export to Video**: Record your visualization directly from the browser to a `.webm` or `.mp4` video file.
- **Customizable**: Use the control panel to tweak colors, bloom intensity, and more.

## Prerequisites

- Node.js (v16 or higher recommended)
- npm (usually comes with Node.js)

## How to Run Locally

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Start Development Server**
    ```bash
    npm run dev
    ```
    Open your browser to the URL shown (usually `http://localhost:5173`).

3.  **Build for Production**
    ```bash
    npm run build
    npm run preview
    ```

## Usage

1.  **Upload Music**: Click the "Select File" button or drag and drop an audio file (MP3/WAV) anywhere on the window.
2.  **Controls**:
    - **Play/Pause**: Toggle playback.
    - **Record**: Click the video icon to start recording the canvas and audio. Click stop to save the file.
    - **Settings**: Use the floating panel (Leva) on the right to change visualizer modes, colors, and effect intensity.
