import { GoogleGenAI, Type, FunctionDeclaration, Modality, Schema } from "@google/genai";
import { UserProfile, InterviewType, JobRecommendation } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// --- Text Generation Services ---

export const enhanceDescription = async (text: string, lang: string): Promise<string> => {
  if (!text) return "";
  try {
    const model = "gemini-3-flash-preview";
    const prompt = `Rewrite the following professional experience description to be more impactful, using action verbs and quantifying results where possible. Keep it concise. Language: ${lang}. Text: "${text}"`;
    
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || text;
  } catch (error) {
    console.error("Enhance error:", error);
    return text;
  }
};

export const analyzeProfileForJobs = async (profile: UserProfile, lang: string): Promise<JobRecommendation[]> => {
  try {
    const model = "gemini-3-flash-preview";
    const prompt = `
      Analyze this resume data and suggest 3 suitable job roles.
      Resume: ${JSON.stringify(profile)}
      Language of output: ${lang} (Provide titles in English but description in target language).
      Return JSON only.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              matchScore: { type: Type.NUMBER },
              missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
              avgSalary: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["title", "matchScore", "missingSkills", "avgSalary", "description"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as JobRecommendation[];
  } catch (error) {
    console.error("Job analysis error:", error);
    return [];
  }
};

export const generateInterviewFeedback = async (history: {sender: string, text: string}[], jobTitle: string): Promise<any> => {
    const model = "gemini-3-flash-preview";
    const prompt = `
      Analyze this interview transcript for the role of ${jobTitle}.
      Provide scores (0-100) and feedback.
      Transcript: ${JSON.stringify(history)}
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER },
            technicalScore: { type: Type.NUMBER },
            communicationScore: { type: Type.NUMBER },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            tips: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });
    
    return JSON.parse(response.text || "{}");
}

// --- Live API Helper ---
// Note: This is a simplified client-side implementation. 

export const connectLiveSession = async (
  jobTitle: string, 
  interviewType: string,
  onAudioData: (base64: string) => void,
  onTextData: (text: string) => void,
  onClose: () => void
) => {
  const model = 'gemini-2.5-flash-native-audio-preview-09-2025';
  
  const config = {
    model,
    callbacks: {
      onopen: () => console.log('Live session opened'),
      onmessage: (message: any) => {
        // Handle Audio Output
        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          onAudioData(base64Audio);
        }
        
        // Handle Transcript (if available in future or via specific config)
        if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
             onTextData(message.serverContent?.modelTurn?.parts?.[0]?.text);
        }
        
        // Handle Interruption
        if (message.serverContent?.interrupted) {
          console.log("Model interrupted");
        }
      },
      onclose: () => onClose(),
      onerror: (e: any) => console.error("Live Error", e)
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

// --- Audio Utils (from guide) ---
export function createPCM16Blob(data: Float32Array): { data: string, mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = Math.max(-1, Math.min(1, data[i])) * 32767; // Clamp and scale
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
    
    // We need to treat this as raw PCM data, not a file format
    // Basic PCM decoding (assuming 16-bit mono 24kHz from Gemini default)
    const dataInt16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(dataInt16.length);
    for (let i = 0; i < dataInt16.length; i++) {
        float32[i] = dataInt16[i] / 32768.0;
    }

    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);
    return buffer;
}
