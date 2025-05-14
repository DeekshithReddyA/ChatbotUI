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
const models_1 = require("./models/models");
const config_1 = __importDefault(require("./config"));
const user_1 = __importDefault(require("./routes/user"));
const convo_1 = __importStar(require("./routes/convo"));
const client_s3_1 = require("@aws-sdk/client-s3");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
// Increase JSON body size limit to 50MB for image uploads
app.use(express_1.default.json({ limit: '50mb' }));
// Also increase URL-encoded data limit
app.use(express_1.default.urlencoded({ limit: '50mb', extended: true }));
app.use('/api/user', user_1.default);
app.use('/api/convo', convo_1.default);
// Function to convert a readable stream to string
function streamToString(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });
}
// Function to fix all welcome conversations for existing users
function migrateWelcomeConversations() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Starting migration of Welcome to TARS Chat conversations...");
        try {
            // Find all conversations with title "Welcome to TARS Chat"
            const welcomeConversations = yield config_1.default.conversation.findMany({
                where: { title: "Welcome to TARS Chat" }
            });
            console.log(`Found ${welcomeConversations.length} welcome conversations to migrate`);
            let successCount = 0;
            let errorCount = 0;
            for (const convo of welcomeConversations) {
                try {
                    // Extract bucket and key from fileUrl
                    const url = new URL(convo.fileUrl);
                    const temp = url.pathname.split('/');
                    const bucket = temp[4];
                    const key = temp[5] + '/' + temp[6];
                    // Get current content
                    let currentMessages = [];
                    const getCommand = new client_s3_1.GetObjectCommand({
                        Bucket: bucket,
                        Key: key
                    });
                    const response = yield convo_1.client.send(getCommand);
                    if (response.Body) {
                        const bodyContents = yield streamToString(response.Body);
                        const parsed = JSON.parse(bodyContents);
                        // Check if the messages are in the expected format
                        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].messages) {
                            // This is the old format with nested messages
                            const oldFormat = parsed[0];
                            currentMessages = oldFormat.messages;
                            // Fix message IDs to use conversation ID
                            currentMessages = currentMessages.map((msg, index) => (Object.assign(Object.assign({}, msg), { id: `${convo.id}-${index + 1}` })));
                            // Store the fixed messages
                            const putCommand = new client_s3_1.PutObjectCommand({
                                Bucket: bucket,
                                Key: key,
                                Body: JSON.stringify(currentMessages),
                                ContentType: 'application/json',
                            });
                            yield convo_1.client.send(putCommand);
                            successCount++;
                            console.log(`Migrated conversation ${convo.id} successfully`);
                        }
                        else if (Array.isArray(parsed)) {
                            // Already in the correct format
                            console.log(`Conversation ${convo.id} already in correct format`);
                            successCount++;
                        }
                        else {
                            throw new Error("Unexpected format");
                        }
                    }
                }
                catch (error) {
                    console.error(`Error migrating conversation ${convo.id}:`, error);
                    errorCount++;
                    try {
                        // Create new default messages as a fallback
                        const defaultMessages = [
                            {
                                id: `${convo.id}-1`,
                                content: "What is TARS Chat?",
                                sender: "user",
                                timestamp: new Date("2023-06-15T14:28:00").toISOString(),
                            },
                            {
                                id: `${convo.id}-2`,
                                content: `### TARS Chat is the all in one AI Chat. 

1. **Blazing Fast, Model-Packed.**  
    We're not just fast — we're **2x faster than ChatGPT**, **10x faster than DeepSeek**. With **20+ models** (Claude, DeepSeek, ChatGPT-4o, and more), you'll always have the right AI for the job — and new ones arrive *within hours* of launch.

2. **Flexible Payments.**  
   Tired of rigid subscriptions? TARS Chat lets you choose *your* way to pay.  
   • Just want occasional access? Buy credits that last a full **year**.  
   • Want unlimited vibes? Subscribe for **$10/month** and get **2,000+ messages**.

3. **No Credit Card? No Problem.**  
   Unlike others, we welcome everyone.  
   **UPI, debit cards, net banking, credit cards — all accepted.**  
   Students, you're not locked out anymore.

Reply here to get started, or click the little "chat" icon up top to make a new chat. Or you can [check out the FAQ](/chat/faq)`,
                                sender: "ai",
                                timestamp: new Date("2023-06-15T14:29:00").toISOString(),
                                model: "gpt-4",
                            },
                        ];
                        // Extract bucket and key from fileUrl
                        const url = new URL(convo.fileUrl);
                        const temp = url.pathname.split('/');
                        const bucket = temp[4];
                        const key = temp[5] + '/' + temp[6];
                        // Save new default messages
                        const putCommand = new client_s3_1.PutObjectCommand({
                            Bucket: bucket,
                            Key: key,
                            Body: JSON.stringify(defaultMessages),
                            ContentType: 'application/json',
                        });
                        yield convo_1.client.send(putCommand);
                        console.log(`Recreated messages for conversation ${convo.id}`);
                        successCount++;
                    }
                    catch (fallbackError) {
                        console.error(`Failed to recreate messages for conversation ${convo.id}:`, fallbackError);
                    }
                }
            }
            console.log(`Migration completed. Success: ${successCount}, Errors: ${errorCount}`);
        }
        catch (error) {
            console.error("Error during welcome conversations migration:", error);
        }
    });
}
// Run the migration when the server starts
migrateWelcomeConversations();
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
    const { messages, model, files } = req.body;
    console.log("Request", req.body);
    const userId = req.headers['userid'];
    // Track the conversation if ID is provided
    const conversationId = req.headers['conversationid'];
    console.log(`Chat request received for conversation ID: ${conversationId || 'none'}`);
    console.log(`Model selected: ${model}`);
    console.log(`Messages in request: ${messages.length}`);
    console.log(`Files in request: ${files ? files.length : 0}`);
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
                console.log(`User message content: ${lastMessage.content.substring ? lastMessage.content.substring(0, 50) + (lastMessage.content.length > 50 ? '...' : '') : 'Multimodal content'}`);
                const result = yield (0, convo_1.appendMessage)(conversationId, typeof lastMessage.content === 'string' ? lastMessage.content : JSON.stringify(lastMessage.content), 'user', new Date(), '');
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
        // Format messages for API
        const formattedMessages = messages.map((msg) => {
            // If the message content is already in the proper format (array of content parts)
            if (Array.isArray(msg.content)) {
                return {
                    role: msg.role,
                    content: msg.content
                };
            }
            // Otherwise, convert string content to proper format
            return {
                role: msg.role,
                content: [{ type: "text", text: msg.content }]
            };
        });
        // Check if this is one of the image-compatible models
        const isImageIncompatibleModel = [
            'gpt-4', 'o3-mini', 'o3', 'o4-mini', 'o1-preview'
        ].includes(model);
        const textStream = (0, models_1.generateStreamText)(formattedMessages, model);
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
                console.log(`AI response length: ${responseText.length} characters`);
                console.log(`AI response preview: ${responseText.substring(0, 50)}${responseText.length > 50 ? '...' : ''}`);
                const result = yield (0, convo_1.appendMessage)(conversationId, responseText, 'ai', new Date(), model);
                console.log('AI response save result:', result.success ? 'Success' : 'Failed');
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
// Add endpoint to save stopped messages
app.post('/api/chat/save-stopped', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { conversationId, content, model } = req.body;
    const userId = req.headers['userid'];
    if (!conversationId || !content) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }
    try {
        // Save the stopped AI response to the conversation
        const result = yield (0, convo_1.appendMessage)(conversationId, content, 'ai', new Date(), model || 'gpt-4o', true // Indicate this message was stopped early
        );
        console.log(`Saved stopped message for conversation ${conversationId}`);
        res.status(200).json({ success: true, result });
    }
    catch (error) {
        console.error('Error saving stopped message:', error);
        res.status(500).json({
            error: 'Failed to save stopped message',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
