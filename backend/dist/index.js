"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const config_1 = __importDefault(require("./config"));
const user_1 = __importDefault(require("./routes/user"));
const convo_1 = __importStar(require("./routes/convo"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api/user', user_1.default);
app.use('/api/convo', convo_1.default);
// Has to be converted to return these models along with the user data.
// Have to add another endpoint where only pinned models are returned.
app.get('/api/models', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.headers['userid'];
    try {
        const user = yield config_1.default.user.findUnique({
            where: {
                userId: userId
            }
        });
        const isPro = user === null || user === void 0 ? void 0 : user.isPro;
        const models = yield config_1.default.model.findMany();
        const pinned = yield config_1.default.userPinnedModels.findUnique({
            where: {
                userId: user === null || user === void 0 ? void 0 : user.id
            }
        });
        let pinnedModels = [];
        if (pinned !== null) {
            pinnedModels = pinned.models;
        }
        const modelsinRender = models.map(model => (Object.assign(Object.assign({}, model), { isLocked: model.isPro && !isPro, isPinned: pinnedModels.includes(model.id) })));
        res.status(200).json(modelsinRender);
    }
    catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}));
app.post('/api/pinnedModels', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { pinnedModels } = req.body;
    if (!Array.isArray(pinnedModels)) {
        res.status(400).json({ error: 'pinnedModels must be an array' });
        return;
    }
    const userId = req.headers['userid'];
    const user = yield config_1.default.user.update({
        where: {
            userId: userId
        },
        data: {
            pinnedModels: {
                update: {
                    models: pinnedModels
                }
            }
        }
    });
    res.status(200).json({ message: 'Pinned models updated' });
}));
app.post('/api/chat', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    const { messages, model = "gemini-2.0-flash" } = req.body;
    const userId = req.headers['userid'];
    // Track the conversation if ID is provided
    const conversationId = req.headers['conversationid'];
    if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: 'Invalid messages format' });
        return;
    }
    // Save the user message first if we have a conversation ID
    if (conversationId && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === 'user') {
            try {
                console.log(`Saving user message to conversation ${conversationId}`);
                const result = yield (0, convo_1.appendMessage)(conversationId, lastMessage.content, 'user', new Date(), '');
                console.log('User message save result:', result);
            }
            catch (error) {
                console.error('Error saving user message to conversation:', error);
            }
        }
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
        const textStream = (0, google_1.generateText)("gemini-2.0-flash", formattedMessages);
        let responseText = ''; // Accumulate the full response
        try {
            for (var _d = true, textStream_1 = __asyncValues(textStream), textStream_1_1; textStream_1_1 = yield textStream_1.next(), _a = textStream_1_1.done, !_a; _d = true) {
                _c = textStream_1_1.value;
                _d = false;
                const text = _c;
                if (text) {
                    responseText += text;
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
        // If we have a conversation ID, update that conversation with the AI's response
        if (conversationId && responseText) {
            try {
                console.log(`Saving AI response to conversation ${conversationId}`);
                const result = yield (0, convo_1.appendMessage)(conversationId, responseText, 'ai', new Date(), model);
                console.log('AI response save result:', result);
            }
            catch (error) {
                console.error('Error saving AI response to conversation:', error);
            }
        }
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
