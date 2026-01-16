
import { useState, useCallback, useEffect } from 'react';
import { ttsService, TTSVoice } from '../services/ttsService';

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<TTSVoice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | undefined>(undefined);

  // Initialize Service
  useEffect(() => {
    ttsService.init().then(async () => {
      const voices = await ttsService.getVoices();
      setAvailableVoices(voices);
      const defaultVoice = voices.find(v => v.default);
      if (defaultVoice) setSelectedVoiceId(defaultVoice.id);
    });
  }, []);

  // Updated signature to include promptId
  const speak = useCallback(async (text: string, promptId?: string) => {
    setIsSpeaking(true);
    
    // Use text as ID if no ID provided (not ideal for caching but functional fallback)
    const effectiveId = promptId || btoa(text.substring(0, 32)); 

    await ttsService.speak({
      text,
      promptId: effectiveId,
      voiceId: selectedVoiceId,
      rate: 0.96,
      pitch: 1.02,
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false)
    });
  }, [selectedVoiceId]);

  const stop = useCallback(() => {
    ttsService.stop();
    setIsSpeaking(false);
  }, []);

  const testVoice = useCallback((voiceId: string) => {
    ttsService.stop();
    ttsService.speak({
      text: "Hello! I am Serenity. I'm looking forward to speaking with you.",
      voiceId: voiceId,
      promptId: 'test_voice_prompt',
      rate: 0.96,
      pitch: 1.02
    });
  }, []);

  return { 
    speak, 
    stop, 
    isSpeaking, 
    availableVoices, 
    selectedVoiceId, 
    setSelectedVoiceId,
    testVoice
  };
}
