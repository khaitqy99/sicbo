import { GoogleGenAI } from "@google/genai";
import { RollResult } from "../types";

const initGenAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const analyzeHistory = async (history: RollResult[]) => {
  const ai = initGenAI();
  if (!ai) return "AI unavailable. Configure API_KEY.";

  const recent = history.slice(0, 20).map(h => {
    let type = "Mix";
    if (h.sum >= 11 && h.sum <= 17) type = "BIG";
    if (h.sum >= 4 && h.sum <= 10) type = "SMALL";
    if (h.isTriple) type = "TRIPLE";
    return `[${h.dice.join(',')}=${h.sum} (${type})]`;
  }).join(", ");

  const prompt = `
    You are a superstitious casino expert watching a Sic Bo (Tai Xiu) table.
    Here are the last 20 results (oldest to newest): ${recent}.
    
    Provide a witty, short (under 30 words) commentary on the trend. 
    Mention if there is a "dragon" (long streak) or if it looks "choppy".
    Do NOT give financial advice. Just superstitious fun.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The spirits are silent right now. Try again later.";
  }
};