"use strict";
// import express from 'express';
// import cors from 'cors';
// import { generateText } from './models/google';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// const app = express();
// const PORT = process.env.PORT || 3000;
// app.use(express.json());
// app.use(cors());
// app.post('/api/message', async (req, res) => {
//     const message = req.body;
//     console.log(message);
//     if (!message) {
//         res.status(400).json({ error: 'Message is required' });
//         return;
//     }
//     res.setHeader('Content-Type', 'text/plain; charset=utf-8');
//     res.setHeader('Transfer-Encoding', 'chunked');
//     const stream = generateText(message.content);
//     for await (const text of stream) {
//         console.log("Chunk:", text);
//         res.write(text); // ✅ write instead of send
//     }
//     res.end(); // ✅ end after the loop
// });
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });
// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import ai from './models/google';
// dotenv.config();
// const app = express();
// const PORT = process.env.PORT || 3000;
// app.use(cors());
// app.use(express.json());
// app.post('/api/chat', async (req, res) => {
//   const body = req.body;
//   const messages = body.messages;
//   console.log("Received messages:", messages);
//   if (!messages || !Array.isArray(messages)) {
//     res.status(400).json({ error: 'Invalid messages' });
//     return;
//   }
//   res.setHeader('Content-Type', 'text/event-stream');
//   res.setHeader('Cache-Control', 'no-cache');
//   res.setHeader('Connection', 'keep-alive');
//   res.flushHeaders();
//   try {
//     const result = await ai.models.generateContentStream({
//         model : "gemini-2.0-flash",
//         contents: {
//             role: "user",
//             parts: messages.map((message) => ({ text: message.content })),
//         },
//     });
//     for await (const chunk of result) {
//       const text = chunk.text;
//       if (text) {
//         res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`);
//       }
//     }
//     res.write(`data: [DONE]\n\n`);
//     res.end();
//   } catch (err) {
//     console.error("Error:", err);
//     res.write(`data: ${JSON.stringify({ error: 'Streaming error' })}\n\n`);
//     res.end();
//   }
// });
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });
// index.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const google_1 = __importDefault(require("./models/google"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.post('/api/chat', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    //   const { messages, model = "gemini-2.0-flash" } = req.body;
    const { messages } = req.body;
    console.log(messages);
    const modelName = "gemini-2.0-flash"; // Default model
    if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: 'Invalid messages format' });
        return;
    }
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    try {
        // Format messages for Gemini API
        const formattedMessages = messages.map((msg) => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }));
        // Select appropriate model based on request
        // let modelName = "gemini-2.0-flash"; // Default model
        // Map frontend model names to Gemini model names
        // if (model === "gemini-2.0-flash" || model === "gemini-pro") {
        //   modelName = "gemini-2.0-flash";
        // } else if (model === "gemini-ultra") {
        //   modelName = "gemini-2.0-pro";
        // } else {
        //   // For non-Gemini models, we'll fall back to default
        //   console.log(`Model ${model} not available, using ${modelName} instead`);
        // }
        const result = yield google_1.default.models.generateContentStream({
            model: modelName,
            contents: formattedMessages,
        });
        try {
            for (var _d = true, result_1 = __asyncValues(result), result_1_1; result_1_1 = yield result_1.next(), _a = result_1_1.done, !_a; _d = true) {
                _c = result_1_1.value;
                _d = false;
                const chunk = _c;
                const text = chunk.text;
                if (text) {
                    res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = result_1.return)) yield _b.call(result_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        res.write(`data: [DONE]\n\n`);
        res.end();
    }
    catch (err) {
        console.error("Error:", err);
        res.write(`data: ${JSON.stringify({ error: 'Streaming error', message: err.message })}\n\n`);
        res.end();
    }
}));
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
