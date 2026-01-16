
// Google Cloud TTS Service
// Implements "Warm Coach" persona using Neural2 voices

const getApiKey = () => {
  try {
    // Safe access: import.meta.env might be undefined in some contexts
    const env = import.meta.env;
    return env?.VITE_GOOGLE_TTS_API_KEY || '';
  } catch (e) {
    console.warn("Error reading environment variable:", e);
    return '';
  }
};

const API_KEY = getApiKey();
const API_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';

if (!API_KEY) {
  console.warn("Google TTS disabled: using browser voice fallback (missing VITE_GOOGLE_TTS_API_KEY).");
}

// Persona Configuration
const PREFERRED_VOICE = { languageCode: 'en-GB', name: 'en-GB-Neural2-F' }; // Warm, female, British
const FALLBACK_VOICE = { languageCode: 'en-GB', name: 'en-GB-Standard-A' }; 

interface GoogleTTSRequest {
  input: { ssml: string };
  voice: { languageCode: string; name: string };
  audioConfig: { audioEncoding: 'MP3' };
}

class GoogleTTSService {
  private audioCache: Map<string, string> = new Map(); // promptId -> blobUrl
  private currentAudio: HTMLAudioElement | null = null;
  private _isSpeaking: boolean = false;

  constructor() {
    // Pre-warm cache with common static prompts if needed in future
  }

  isSpeaking(): boolean {
    return this._isSpeaking;
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this._isSpeaking = false;
    }
  }

  async speak(promptId: string, text: string): Promise<void> {
    this.stop(); // Ensure no overlap

    // 1. Check Cache
    if (this.audioCache.has(promptId)) {
      await this.playBlob(this.audioCache.get(promptId)!);
      return;
    }

    // 2. Prepare SSML
    const ssml = this.formatSSML(text);

    // 3. Fetch from Google
    if (!API_KEY) {
      // Fail gracefully so service falls back to browser
      throw new Error("Missing Google TTS API Key");
    }

    try {
      const payload: GoogleTTSRequest = {
        input: { ssml },
        voice: PREFERRED_VOICE,
        audioConfig: { audioEncoding: 'MP3' }
      };

      const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        // Retry with fallback voice if Neural2 fails (sometimes requires specific billing/region)
        console.warn("Google TTS Neural2 failed, retrying with standard voice...");
        payload.voice = FALLBACK_VOICE;
        const retryResponse = await fetch(`${API_URL}?key=${API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!retryResponse.ok) throw new Error(`Google TTS API Error: ${retryResponse.statusText}`);
        
        const data = await retryResponse.json();
        this.processAndPlay(promptId, data.audioContent);
        return;
      }

      const data = await response.json();
      await this.processAndPlay(promptId, data.audioContent);

    } catch (error) {
      console.error("Google TTS failed:", error);
      throw error; // Propagate to trigger browser fallback
    }
  }

  private formatSSML(text: string): string {
    // Sanitization
    const safeText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    // "Warm Coach" Prosody
    // rate="96%" -> slightly measured/calm
    // pitch="+1st" -> slightly higher/brighter/warmer
    return `
      <speak>
        <prosody rate="96%" pitch="+1st">
          ${safeText}
        </prosody>
      </speak>
    `.trim();
  }

  private async processAndPlay(id: string, base64Audio: string) {
    // Convert base64 to Blob
    const binaryString = window.atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'audio/mp3' });
    const url = URL.createObjectURL(blob);

    // Cache it
    this.audioCache.set(id, url);

    // Play it
    await this.playBlob(url);
  }

  private playBlob(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.currentAudio = new Audio(url);
      this._isSpeaking = true;

      this.currentAudio.onended = () => {
        this._isSpeaking = false;
        this.currentAudio = null;
        resolve();
      };

      this.currentAudio.onerror = (e) => {
        this._isSpeaking = false;
        this.currentAudio = null;
        reject(e);
      };

      this.currentAudio.play().catch(reject);
    });
  }
}

export const googleTTS = new GoogleTTSService();
