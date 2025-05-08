"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const genai_1 = require("@google/genai");
require("dotenv/config");
const googleAPIKEY = process.env.GEMINI_API_KEY;
const genAI = new genai_1.GoogleGenAI({ apiKey: googleAPIKEY });
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
exports.default = genAI;
