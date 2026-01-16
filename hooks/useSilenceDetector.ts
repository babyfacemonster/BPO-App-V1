import { useState, useEffect, useRef } from 'react';

export function useSilenceDetector(stream: MediaStream | null, isActive: boolean, threshold = 10, silenceDelay = 3000) {
  const [isSilent, setIsSilent] = useState(false);
  const [volume, setVolume] = useState(0);
  const lastSoundTime = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>();
  
  useEffect(() => {
    if (!stream || !isActive) {
      setIsSilent(false);
      setVolume(0);
      return;
    }

    // Initialize AudioContext
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContext();
    audioContextRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.5;
    
    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Reset timer when activating
    lastSoundTime.current = Date.now();
    
    const detect = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for(let i=0; i<bufferLength; i++) sum += dataArray[i];
      const avg = sum / bufferLength;
      
      setVolume(avg);

      const now = Date.now();

      // If sound detected
      if (avg > threshold) {
        lastSoundTime.current = now;
        setIsSilent(false);
      } else {
        // If silence duration exceeded
        if (now - lastSoundTime.current > silenceDelay) {
          setIsSilent(true);
        }
      }
      
      rafRef.current = requestAnimationFrame(detect);
    };

    detect();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [stream, isActive, threshold, silenceDelay]);

  return { isSilent, volume };
}