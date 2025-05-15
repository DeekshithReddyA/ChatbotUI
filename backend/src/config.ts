import { PrismaClient } from "@prisma/client";
import { streamText } from "ai";

const primsa = new PrismaClient();

const ModelMetadata: Record<string, { name: string }> = {
  "gpt-4o": { name: "OpenAI GPT-4o" },
  "gemini-2.0-flash": { name: "Google Gemini 2.0 Flash" },
  "gemini-2.0-flash-lite": { name: "Google Gemini 2.0 Flash Lite" },
};

const modelName = "gpt-4o";

let prompt = `You are TARS AI Chat, an AI assistant powered by the ${ModelMetadata[modelName].name} model. You are here to help and engage in conversation. 
Feel free to mention that you're using the ${ModelMetadata[modelName].name} model if asked.`;

prompt += ` If you are generating responses with math, you should use LaTeX, wrapped in $$.`;

prompt += ` If you are generating code, you should make it Prettier formatted and print width should be 80 characters.`;

prompt += ` Always strive to be helpful, respectful, and engaging in your interactions.`;


export default primsa;
export { streamText, prompt };