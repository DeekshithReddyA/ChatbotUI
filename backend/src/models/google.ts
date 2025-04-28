import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

const googleAPIKEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey:  googleAPIKEY });

export async function* generateText(input: string) {
  const response = await ai.models.generateContentStream({
    model: "gemini-2.0-flash-lite",
    contents: input,
  });

  for await (const chunk of response) {
    yield chunk.text; // yield, not return
  }
}
