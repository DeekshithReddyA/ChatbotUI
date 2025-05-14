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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const config_1 = __importDefault(require("../config"));
const convo_1 = require("./convo");
const client_s3_1 = require("@aws-sdk/client-s3");
const userRouter = (0, express_1.Router)();
// Function to convert a readable stream to string
function streamToString(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });
}
userRouter.post('/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, name } = req.body;
    if (!userId || !name) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }
    try {
        const existingUser = yield config_1.default.user.findUnique({
            where: { userId }
        });
        if (existingUser) {
            res.status(200).json({ message: 'User already exists' });
            return;
        }
        const user = yield config_1.default.user.create({
            data: {
                userId,
                name,
                isPro: false,
                messagesLeft: 5,
                pinnedModels: {
                    create: {
                        models: []
                    }
                }
            }
        });
        const { fileUrl, chatId } = yield (0, convo_1.createDefaultChat)(user.id);
        const conversation = yield config_1.default.conversation.create({
            data: {
                id: chatId,
                userId: user.id,
                fileUrl: fileUrl,
                title: "Welcome to TARS Chat",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });
        console.log("conversation created:");
        res.status(201).json({ user, conversation });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}));
userRouter.get('/get', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.headers['userid'];
    console.log("userID:", userId);
    if (!userId) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }
    try {
        const user = yield config_1.default.user.findUnique({
            where: { userId }
        });
        console.log("user:", user);
        const conversations = yield config_1.default.conversation.findMany({
            where: { userId: user === null || user === void 0 ? void 0 : user.id }
        });
        console.log("conversations:", conversations);
        //fetch messages from s3
        const conversationsWithMessages = yield (0, convo_1.fetchMessagesFromS3)(conversations);
        console.log("conversationsWithMessages:", conversationsWithMessages);
        const models = yield config_1.default.userPinnedModels.findUnique({
            where: { userId: user === null || user === void 0 ? void 0 : user.id }
        });
        console.log("models:", models);
        res.status(200).json({ user, conversations, models, conversationsWithMessages });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error });
        return;
    }
}));
// Add a new route to fix the Welcome to TARS Chat conversation
userRouter.post('/fix-welcome-chat', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.headers['userid'];
    if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
    }
    try {
        // Find the user
        const user = yield config_1.default.user.findUnique({
            where: { userId }
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        // Find the Welcome conversation
        const welcomeConversation = yield config_1.default.conversation.findFirst({
            where: {
                userId: user.id,
                title: "Welcome to TARS Chat"
            }
        });
        if (!welcomeConversation) {
            res.status(404).json({ error: 'Welcome conversation not found' });
            return;
        }
        // Extract bucket and key from fileUrl
        const url = new URL(welcomeConversation.fileUrl);
        const temp = url.pathname.split('/');
        const bucket = temp[4];
        const key = temp[5] + '/' + temp[6];
        // Get current content
        let currentMessages = [];
        try {
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
                    currentMessages = currentMessages.map((msg, index) => (Object.assign(Object.assign({}, msg), { id: `${welcomeConversation.id}-${index + 1}` })));
                    // Store the fixed messages
                    const putCommand = new client_s3_1.PutObjectCommand({
                        Bucket: bucket,
                        Key: key,
                        Body: JSON.stringify(currentMessages),
                        ContentType: 'application/json',
                    });
                    yield convo_1.client.send(putCommand);
                    res.status(200).json({
                        success: true,
                        message: 'Welcome conversation fixed'
                    });
                    return;
                }
                else if (Array.isArray(parsed)) {
                    // Already in the correct format
                    res.status(200).json({
                        success: true,
                        message: 'Welcome conversation already in correct format'
                    });
                    return;
                }
            }
        }
        catch (error) {
            console.error('Error fixing welcome conversation:', error);
        }
        // If we get here, either we couldn't read the file or the content wasn't as expected
        // Create new default messages
        const defaultMessages = [
            {
                id: `${welcomeConversation.id}-1`,
                content: "What is TARS Chat?",
                sender: "user",
                timestamp: new Date("2023-06-15T14:28:00").toISOString(),
            },
            {
                id: `${welcomeConversation.id}-2`,
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
        // Save new default messages
        const putCommand = new client_s3_1.PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: JSON.stringify(defaultMessages),
            ContentType: 'application/json',
        });
        yield convo_1.client.send(putCommand);
        res.status(200).json({
            success: true,
            message: 'Welcome conversation recreated'
        });
    }
    catch (error) {
        console.error('Error fixing welcome conversation:', error);
        res.status(500).json({
            error: 'Failed to fix welcome conversation',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
exports.default = userRouter;
