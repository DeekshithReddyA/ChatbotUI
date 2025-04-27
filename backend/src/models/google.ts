import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

const googleAPIKEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey:  googleAPIKEY});

export async function generateText(input: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: input,
  });
  console.log(response.text);
  return response.text;
}
