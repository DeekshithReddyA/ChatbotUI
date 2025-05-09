"use strict";
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
// index.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const google_1 = require("./models/google");
const models_1 = require("./models/models");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/api/models', (req, res) => {
    res.json(models_1.models);
});
app.post('/api/pinnedModels', (req, res) => {
    const { pinnedModels } = req.body;
    console.log(pinnedModels);
    const updatedModels = (0, models_1.modifyPinnedModels)(pinnedModels);
    res.json(updatedModels);
});
app.post('/api/chat', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    //   const { messages, model = "gemini-2.0-flash" } = req.body;
    const { messages, model } = req.body;
    // console.log(messages);
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
        const textStream = (0, google_1.generateText)(modelName, formattedMessages);
        try {
            for (var _d = true, textStream_1 = __asyncValues(textStream), textStream_1_1; textStream_1_1 = yield textStream_1.next(), _a = textStream_1_1.done, !_a; _d = true) {
                _c = textStream_1_1.value;
                _d = false;
                const text = _c;
                if (text) {
                    res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = textStream_1.return)) yield _b.call(textStream_1);
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
