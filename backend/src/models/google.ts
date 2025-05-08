import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

const googleAPIKEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenAI({ apiKey:  googleAPIKEY });

// export async function* generateText(input: string) {
//   const response = await ai.models.generateContentStream({
//     model: "gemini-2.0-flash",
//     contents: {
//       role: "user",
//       parts: [{text: input}]
//     }
//   });

//   for await (const chunk of response) {
//     yield chunk.text; 
//   }
// }
export default genAI;