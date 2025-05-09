import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

const googleAPIKEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenAI({ apiKey:  googleAPIKEY });

export async function* generateText(modelName: string, formattedMessages: any) {
  const response = await genAI.models.generateContentStream({
    model: modelName,
    contents: formattedMessages,
  });

  for await (const chunk of response) {
    const text = chunk.text;
    if (text) {
      yield text;
    }
  }
}
export default generateText;