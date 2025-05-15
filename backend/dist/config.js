"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prompt = exports.streamText = void 0;
const client_1 = require("@prisma/client");
const ai_1 = require("ai");
Object.defineProperty(exports, "streamText", { enumerable: true, get: function () { return ai_1.streamText; } });
const primsa = new client_1.PrismaClient();
const ModelMetadata = {
    "gpt-4o": { name: "OpenAI GPT-4o" },
    "gemini-2.0-flash": { name: "Google Gemini 2.0 Flash" },
    "gemini-2.0-flash-lite": { name: "Google Gemini 2.0 Flash Lite" },
};
const modelName = "gpt-4o";
let prompt = `You are TARS AI Chat, an AI assistant powered by the ${ModelMetadata[modelName].name} model. You are here to help and engage in conversation. 
Feel free to mention that you're using the ${ModelMetadata[modelName].name} model if asked.`;
exports.prompt = prompt;
exports.prompt = prompt += ` If you are generating responses with math, you should use markdown only.`;
exports.prompt = prompt += ` If you are generating code, you should make it Prettier formatted and print width should be 80 characters.`;
exports.prompt = prompt += ` Always strive to be helpful, respectful, and engaging in your interactions.`;
exports.default = primsa;
