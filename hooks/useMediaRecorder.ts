
import { useState, useRef, useCallback, useEffect } from 'react';

export function useMediaRecorder() {
  const [status, setStatus] = useState<'idle' | 'previewing' | 'recording' | 'stopped'>('idle');
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  // 1. Initialize Camera/Mic (Preview only, no recording)
  const initializeStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setPreviewStream(stream);
      setStatus('previewing');
      return true;
    } catch (e) {
      console.error("Failed to access media devices", e);
      return false;
    }
  }, []);

  // 2. Start Actual Recording
  const startRecording = useCallback(async () => {
    if (!previewStream) {
      // Auto-initialize if not done yet
      const success = await initializeStream();
      if (!success) return false;
    }
    
    // We need to use the existing stream (which might be in state) 
    // If initializeStream was just called, state might not update immediately in this closure
    // So we fetch it again if needed or use the state reference if available.
    // For safety in this hook pattern, we re-verify stream existence.
    
    // Note: In React, using state immediately after setting it is tricky. 
    // Ideally, the component calls init, waits for user, then calls start.
    
    if (!previewStream && status === 'idle') {
       // Fallback for direct start
       const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
       setPreviewStream(stream);
       startRecorderLogic(stream);
       return true;
    } else if (previewStream) {
       startRecorderLogic(previewStream);
       return true;
    }
    
    return false;
  }, [previewStream, status, initializeStream]);

  const startRecorderLogic = (stream: MediaStream) => {
    try {
      // Prefer standard webm/mp4 codecs
      const options = MediaRecorder.isTypeSupported('video/webm; codecs=vp9') 
        ? { mimeType: 'video/webm; codecs=vp9' } 
        : MediaRecorder.isTypeSupported('video/webm')
          ? { mimeType: 'video/webm' }
          : undefined;

      const recorder = new MediaRecorder(stream, options);
      mediaRecorder.current = recorder;
      chunks.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'video/webm' });
        setMediaBlob(blob);
        // Don't stop tracks here if we want to keep previewing, 
        // but for this app, stopping usually means end of session.
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start(1000); // chunk every second
      setStatus('recording');
    } catch (e) {
      console.error("Recorder error", e);
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      setStatus('stopped');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewStream && status === 'idle') {
        previewStream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return { status, initializeStream, startRecording, stopRecording, mediaBlob, previewStream };
}
