import { getGeminiClient } from "./utils.js";
import { Type } from "@google/genai";

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const { history, jobTitle } = await req.json();
    const ai = getGeminiClient();
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

    return new Response(response.text, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}