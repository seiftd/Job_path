import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { UserProfile, JobRecommendation } from "../types";

// Helper to call backend APIs
async function postToApi<T>(endpoint: string, body: any): Promise<T> {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error);
    throw error;
  }
}

export const enhanceDescription = async (text: string, lang: string): Promise<string> => {
  if (!text) return "";
  try {
    const data = await postToApi<{text: string}>('/api/enhance', { text, lang });
    return data.text || text;
  } catch (error) {
    return text;
  }
};

export const analyzeProfileForJobs = async (profile: UserProfile, lang: string): Promise<JobRecommendation[]> => {
  try {
    const data = await postToApi<JobRecommendation[]>('/api/analyze', { profile, lang });
    return data || [];
  } catch (error) {
    console.error("Job analysis error:", error);
    return [];
  }
};

export const generateInterviewFeedback = async (history: {sender: string, text: string}[], jobTitle: string): Promise<any> => {
  try {
    const data = await postToApi<any>('/api/feedback', { history, jobTitle });
    return data || {};
  } catch (error) {
    console.error("Feedback error:", error);
    return {};
  }
};

export const sendChatMessage = async (
  message: string, 
  history: {sender: 'user'|'ai', text: string}[],
  systemInstruction: string
): Promise<string> => {
  try {
    const data = await postToApi<{text: string}>('/api/chat', { message, history, systemInstruction });
    return data.text || "";
  } catch (error) {
    console.error("Chat error:", error);
    return "I apologize, but I am having trouble connecting to the server. Please try again.";
  }
};

export const connectLiveSession = async (
  jobTitle: string, 
  interviewType: string,
  onAudioData: (base64: string) => void,
  onTextData: (text: string) => void,
  onClose: () => void
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-2.5-flash-native-audio-preview-09-2025';
  
  const config = {
    model,
    callbacks: {
      onopen: () => console.log('Live session opened'),
      onmessage: (message: LiveServerMessage) => {
        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          onAudioData(base64Audio);
        }
        
        if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
             onTextData(message.serverContent?.modelTurn?.parts?.[0]?.text);
        }
        
        if (message.serverContent?.interrupted) {
          console.log("Model interrupted");
        }
      },
      onclose: () => onClose(),
      onerror: (e: any) => {
        console.error("Live Error", e);
        onClose();
      }
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
      },
      systemInstruction: `You are a professional interviewer conducting a ${interviewType} interview for the position of ${jobTitle}. Be professional, concise, and ask one question at a time. Start by welcoming the candidate.`,
    }
  };

  return ai.live.connect(config);
};

export function createPCM16Blob(data: Float32Array): { data: string, mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = Math.max(-1, Math.min(1, data[i])) * 32767;
  }
  const uint8 = new Uint8Array(int16.buffer);
  let binary = '';
  const len = uint8.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return {
    data: btoa(binary),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export async function decodeAudioData(
    base64: string,
    ctx: AudioContext,
): Promise<AudioBuffer> {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const dataInt16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(dataInt16.length);
    for (let i = 0; i < dataInt16.length; i++) {
        float32[i] = dataInt16[i] / 32768.0;
    }
    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);
    return buffer;
}