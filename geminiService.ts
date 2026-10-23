import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
// In a real app, we would initialize this properly. For now, we handle the case if key is missing gently or assume it's there.
let ai: GoogleGenAI | null = null;
if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
}

export const checkContentSafety = async (text: string): Promise<{ safe: boolean; reason?: string }> => {
  if (!ai) {
    console.warn("Gemini API Key not found. Skipping safety check.");
    return { safe: true };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the following text for safety in a social dating app context. 
      It should not contain violence, hate speech, severe harassment, or explicit sexual solicitation. 
      Text: "${text}"
      
      Return a JSON object with:
      {
        "safe": boolean,
        "reason": "short explanation if unsafe"
      }
      Do not use markdown formatting.`,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      safe: result.safe ?? true,
      reason: result.reason
    };

  } catch (error) {
    console.error("Error checking content safety:", error);
    // Fail open for prototype if API fails, but log it
    return { safe: true };
  }
};
