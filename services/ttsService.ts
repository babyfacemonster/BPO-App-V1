
import { googleTTS } from './ttsGoogle';

export interface TTSVoice {
  id: string;
  name: string;
  lang: string;
  provider: 'browser' | 'cloud';
  default?: boolean;
}

export interface TTSOptions {
  text: string;
  promptId?: string; // Needed for Cloud Caching
  voiceId?: string;
  rate?: number; 
  pitch?: number; 
  volume?: number; 
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (e: any) => void;
}

class TTSService {
  private provider: 'browser' | 'cloud' = 'browser';
  private isBrowserSpeaking: boolean = false;
  private preferredVoice: SpeechSynthesisVoice | null = null;
  
  // Browser fallback defaults
  private defaultRate = 0.96;
  private defaultPitch = 1.02;

  constructor() {
    this.detectProvider();
  }

  private detectProvider() {
    let hasKey = false;
    try {
      // Robust check for Vite environment variable
      const env = import.meta.env;
      if (env && typeof env.VITE_GOOGLE_TTS_API_KEY === 'string' && env.VITE_GOOGLE_TTS_API_KEY.trim() !== '') {
        hasKey = true;
      }
    } catch (e) {
      // Ignore errors accessing environment variables
    }

    if (hasKey) {
      this.provider = 'cloud';
    } else {
      this.provider = 'browser';
    }
  }

  async init(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    if ('speechSynthesis' in window) {
      if (window.speechSynthesis.getVoices().length === 0) {
        await new Promise<void>(resolve => {
          window.speechSynthesis.onvoiceschanged = () => resolve();
        });
      }
      this.selectBestBrowserVoice();
    }
  }

  private selectBestBrowserVoice() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    const voices = window.speechSynthesis.getVoices();
    
    // Priority: Google GB -> Other GB -> Google US -> Other US
    let best = voices.find(v => v.lang.includes('GB') && (v.name.includes('Google') || v.name.includes('Neural')));
    
    if (!best) {
      best = voices.find(v => v.lang.includes('GB'));
    }

    if (!best) {
      best = voices.find(v => v.lang.includes('US') && (v.name.includes('Google') || v.name.includes('Samantha')));
    }

    this.preferredVoice = best || voices[0];
  }

  async getVoices(): Promise<TTSVoice[]> {
    if (typeof window === 'undefined') return [];
    
    // Simply return browser voices for now as "Cloud" is a single managed voice in this MVP
    return window.speechSynthesis.getVoices().map(v => ({
      id: v.name,
      name: v.name,
      lang: v.lang,
      provider: 'browser' as const,
      default: v.name === this.preferredVoice?.name
    }));
  }

  async speak(options: TTSOptions): Promise<void> {
    this.stop(); 

    // Try Cloud First
    if (this.provider === 'cloud' && options.promptId) {
      try {
        options.onStart?.();
        await googleTTS.speak(options.promptId, options.text);
        options.onEnd?.();
        return;
      } catch (e) {
        console.warn("Cloud TTS failed, falling back to browser.", e);
        // Fallthrough to browser
      }
    }

    this.speakBrowser(options);
  }

  stop() {
    // Stop Cloud
    if (this.provider === 'cloud') {
      googleTTS.stop();
    }

    // Stop Browser
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      this.isBrowserSpeaking = false;
    }
  }

  isSpeaking(): boolean {
    if (this.provider === 'cloud' && googleTTS.isSpeaking()) return true;
    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) return true;
    return false;
  }

  private speakBrowser(options: TTSOptions) {
    if (!('speechSynthesis' in window)) return;

    const utter = new SpeechSynthesisUtterance(options.text);
    
    // Voice Selection
    if (options.voiceId) {
      const v = window.speechSynthesis.getVoices().find(v => v.name === options.voiceId);
      if (v) utter.voice = v;
    } else if (this.preferredVoice) {
      utter.voice = this.preferredVoice;
    }

    utter.rate = options.rate ?? this.defaultRate;
    utter.pitch = options.pitch ?? this.defaultPitch;
    utter.volume = options.volume ?? 1.0;

    utter.onstart = () => {
      this.isBrowserSpeaking = true;
      options.onStart?.();
    };
    utter.onend = () => {
      this.isBrowserSpeaking = false;
      options.onEnd?.();
    };
    utter.onerror = (e) => {
      this.isBrowserSpeaking = false;
      
      // Ignore errors caused by manual cancellation/interruption
      if (e.error === 'canceled' || e.error === 'interrupted') {
        return;
      }
      
      console.error(`Browser TTS Error: ${e.error}`);
      options.onEnd?.(); 
    };

    window.speechSynthesis.speak(utter);
  }
}

export const ttsService = new TTSService();
