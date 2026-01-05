import { getGeminiClient } from "./utils.js";

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const { text, lang } = await req.json();
    const ai = getGeminiClient();
    const model = "gemini-3-flash-preview";
    const prompt = `Rewrite the following professional experience description to be more impactful, using action verbs and quantifying results where possible. Keep it concise. Language: ${lang}. Text: "${text}"`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return new Response(JSON.stringify({ text: response.text }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}