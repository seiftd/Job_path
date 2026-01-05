import { getGeminiClient } from "./utils.js";

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const { message, history, systemInstruction } = await req.json();
    const ai = getGeminiClient();
    const model = "gemini-2.5-flash";

    // Transform history for Gemini API
    // The SDK chat format expects an array of contents with role 'user' or 'model'
    const contents = history.map((msg: any) => ({
      role: msg.sender === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));
    
    // Add the new message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction
      }
    });

    return new Response(JSON.stringify({ text: response.text }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}