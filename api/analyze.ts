import { getGeminiClient } from "./utils.js";
import { Type } from "@google/genai";

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const { profile, lang } = await req.json();
    const ai = getGeminiClient();
    const model = "gemini-3-flash-preview";
    const prompt = `
      Analyze this resume data and suggest 6 suitable job roles (mix of junior/senior if applicable).
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

    return new Response(response.text, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}