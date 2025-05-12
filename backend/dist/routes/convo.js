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
exports.appendMessage = exports.createDefaultChat = exports.createFolder = void 0;
exports.fetchMessagesFromS3 = fetchMessagesFromS3;
const express_1 = require("express");
const config_1 = __importDefault(require("../config"));
require("dotenv/config");
const uuid_1 = require("uuid");
const convoRouter = (0, express_1.Router)();
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const supabaseUrl = process.env.endpoint_url;
const accessKey = process.env.aws_access_key_id;
const secretKey = process.env.aws_secret_access_key;
const region = process.env.region;
const client = new client_s3_1.S3Client({
    forcePathStyle: true,
    region: region,
    endpoint: supabaseUrl,
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
    }
});
const BUCKET_NAME = 'tarsai.convo';
const getPresignedUrl = (bucketName, fileName) => __awaiter(void 0, void 0, void 0, function* () {
    const getObjectCommand = new client_s3_1.GetObjectCommand({
        Bucket: bucketName,
        Key: fileName,
    });
    // URL expires in 6 days (3600 seconds × 24 hours × 6 days)
    return yield (0, s3_request_presigner_1.getSignedUrl)(client, getObjectCommand, { expiresIn: 6 * 24 * 3600 });
});
// Helper to convert stream to string (NodeJS Readable)
function streamToString(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });
}
function fetchMessagesFromS3(conversations) {
    return __awaiter(this, void 0, void 0, function* () {
        const conversationsWithMessages = yield Promise.all(conversations.map((convo) => __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`Processing conversation: ${convo.id} - ${convo.title}`);
                // Extract bucket and key from fileUrl
                const url = new URL(convo.fileUrl);
                const temp = url.pathname.split('/');
                const bucket = temp[4];
                const key = temp[5] + '/' + temp[6];
                console.log(`Getting object from bucket: ${bucket}, key: ${key}`);
                // Fetch messages from S3
                const getObjectCommand = new client_s3_1.GetObjectCommand({
                    Bucket: bucket,
                    Key: key
                });
                const response = yield client.send(getObjectCommand);
                if (!response.Body) {
                    throw new Error('Empty file content');
                }
                const bodyContents = yield streamToString(response.Body);
                console.log(`Retrieved content of length: ${bodyContents.length}`);
                // Parse messages safely
                let messages = [];
                try {
                    messages = JSON.parse(bodyContents);
                    if (!Array.isArray(messages)) {
                        console.error(`File content is not an array: ${bodyContents.substring(0, 100)}...`);
                        messages = []; // Reset to empty array if not valid
                    }
                }
                catch (error) {
                    console.error(`Error parsing messages JSON: ${error}, content: ${bodyContents.substring(0, 100)}...`);
                    messages = []; // Reset to empty array if parsing failed
                }
                console.log(`Parsed ${messages.length} messages for conversation ${convo.id}`);
                // Generate a new presigned URL if needed
                const fileUrl = yield getPresignedUrl(bucket, key);
                // Update the URL in the database if it changed
                if (fileUrl !== convo.fileUrl) {
                    console.log(`Updating fileUrl for conversation ${convo.id}`);
                    yield config_1.default.conversation.update({
                        where: { id: convo.id },
                        data: { fileUrl }
                    });
                }
                // Get last message for preview
                const lastMessage = messages.length > 0
                    ? messages[messages.length - 1]
                    : null;
                // Find the model from most recent AI message
                const aiMessages = messages.filter((msg) => msg.sender === "ai");
                const model = aiMessages.length > 0
                    ? aiMessages[aiMessages.length - 1].model
                    : "gpt-4o"; // Default model
                console.log(`Successfully processed conversation ${convo.id}`);
                return Object.assign(Object.assign({}, convo), { fileUrl,
                    messages, lastMessage: lastMessage
                        ? { content: lastMessage.content, sender: lastMessage.sender }
                        : null, model });
            }
            catch (error) {
                console.error(`Error fetching messages for conversation ${convo.id}:`, error);
                // Return the conversation without messages if there's an error
                return Object.assign(Object.assign({}, convo), { messages: [], lastMessage: null, model: "gpt-4o", error: `Failed to fetch messages: ${error instanceof Error ? error.message : 'Unknown error'}` });
            }
        })));
        return conversationsWithMessages;
    });
}
// Function which adds a folder in the bucket with the userId as the name
const createFolder = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const putCommand = new client_s3_1.PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: `${userId}/`,
        Body: 'application/json',
    });
    yield client.send(putCommand);
    console.log(`Successfully created folder in S3: ${BUCKET_NAME}/${userId}`);
});
exports.createFolder = createFolder;
const createDefaultChat = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const chatId = (0, uuid_1.v4)(); // generates a unique ID
    const messageId = (0, uuid_1.v4)();
    const key = `${userId}/${chatId}.json`;
    const defaultChat = [
        {
            id: messageId,
            title: "Welcome to TARS Chat",
            lastMessage: "What about a recipe app that uses AI to suggest meals based on ingredients?",
            timestamp: new Date("2023-06-15T14:30:00").toISOString(),
            model: "gpt-4",
            messages: [
                {
                    id: `${messageId}-1`,
                    content: "What is TARS Chat?",
                    sender: "user",
                    timestamp: new Date("2023-06-15T14:28:00").toISOString(),
                },
                {
                    id: `${messageId}-2`,
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
            ],
        },
    ];
    const command = new client_s3_1.PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: JSON.stringify(defaultChat),
        ContentType: "application/json",
    });
    yield client.send(command);
    console.log(`Default chat created at: ${BUCKET_NAME}/${key}`);
    const fileUrl = yield getPresignedUrl(BUCKET_NAME, key);
    return { fileUrl, chatId };
});
exports.createDefaultChat = createDefaultChat;
// Get all conversations for a user with recent messages
convoRouter.get('/list', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.headers['userid'];
    console.log(`Fetching conversations for user: ${userId}`);
    if (!userId) {
        console.log('Missing userId in request');
        res.status(400).json({ error: 'User ID is required' });
        return;
    }
    try {
        // First find the user's ID in the database
        const user = yield config_1.default.user.findUnique({
            where: { userId }
        });
        if (!user) {
            console.log(`User not found: ${userId}`);
            res.status(404).json({ error: 'User not found' });
            return;
        }
        console.log(`Found user: ${user.id} (${user.name})`);
        // Get the most recent 15 conversations for the user
        const conversations = yield config_1.default.conversation.findMany({
            where: { userId: user.id },
            orderBy: { updatedAt: 'desc' },
            take: 15 // Limit to recent 15 conversations
        });
        console.log(`Found ${conversations.length} conversations for user ${userId}`);
        // For each conversation, fetch messages from S3
        const conversationsWithMessages = yield Promise.all(conversations.map((convo) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                console.log(`Processing conversation: ${convo.id} - ${convo.title}`);
                // Extract bucket and key from fileUrl
                const url = new URL(convo.fileUrl);
                const temp = url.pathname.split('/');
                const bucket = temp[4];
                const key = temp[5];
                console.log(`Getting object from bucket: ${bucket}, key: ${key}`);
                // Fetch messages from S3
                const getObjectCommand = new client_s3_1.GetObjectCommand({
                    Bucket: bucket,
                    Key: key
                });
                const response = yield client.send(getObjectCommand);
                if (!response.Body) {
                    throw new Error('Empty file content');
                }
                const bodyContents = yield streamToString(response.Body);
                console.log(`Retrieved content of length: ${bodyContents.length}`);
                // Parse messages safely
                let messages = [];
                try {
                    messages = JSON.parse(bodyContents);
                    if (!Array.isArray(messages)) {
                        console.error(`File content is not an array: ${bodyContents.substring(0, 100)}...`);
                        messages = []; // Reset to empty array if not valid
                    }
                }
                catch (error) {
                    console.error(`Error parsing messages JSON: ${error}, content: ${bodyContents.substring(0, 100)}...`);
                    messages = []; // Reset to empty array if parsing failed
                }
                console.log(`Parsed ${messages.length} messages for conversation ${convo.id}`);
                // Generate a new presigned URL if needed
                const fileUrl = yield getPresignedUrl(bucket, key);
                // Update the URL in the database if it changed
                if (fileUrl !== convo.fileUrl) {
                    console.log(`Updating fileUrl for conversation ${convo.id}`);
                    yield config_1.default.conversation.update({
                        where: { id: convo.id },
                        data: { fileUrl }
                    });
                }
                // Get last message for preview
                const lastMessage = messages.length > 0
                    ? messages[messages.length - 1]
                    : null;
                // Find the model from most recent AI message
                const aiMessages = messages.filter((msg) => msg.sender === "ai");
                const model = aiMessages.length > 0
                    ? aiMessages[aiMessages.length - 1].model
                    : "gpt-4o"; // Default model
                console.log(`Successfully processed conversation ${convo.id}`);
                return Object.assign(Object.assign({}, convo), { fileUrl,
                    messages, lastMessage: lastMessage
                        ? { content: lastMessage.content, sender: lastMessage.sender }
                        : null, model });
            }
            catch (error) {
                console.error(`Error fetching messages for conversation ${convo.id}:`, error);
                // Return the conversation without messages if there's an error
                return Object.assign(Object.assign({}, convo), { messages: [], lastMessage: null, model: "gpt-4o", error: `Failed to fetch messages: ${error instanceof Error ? error.message : 'Unknown error'}` });
            }
        })));
        console.log(`Returning ${conversationsWithMessages.length} conversations with messages`);
        res.status(200).json(conversationsWithMessages);
    }
    catch (error) {
        console.error('Error getting conversations:', error);
        res.status(500).json({ error: 'Failed to get conversations', details: error instanceof Error ? error.message : error });
    }
}));
// // Get a single conversation and its messages
// convoRouter.get('/:id', async (req, res) => {
//     const { id } = req.params;
//     console.log(`Fetching conversation: ${id}`);
//     try {
//         // Get the conversation
//         const conversation = await prisma.conversation.findUnique({
//             where: { id }
//         });
//         if (!conversation) {
//             console.log(`Conversation ${id} not found`);
//             res.status(404).json({ error: 'Conversation not found' });
//             return;
//         }
//         console.log(`Found conversation: ${JSON.stringify(conversation)}`);
//         try {
//             // Extract bucket and key from fileUrl
//             const url = new URL(conversation.fileUrl);
//             const bucket = url.pathname.split('/')[1];
//             const key = decodeURIComponent(url.pathname.split('/').slice(2).join('/'));
//             console.log(`Retrieving S3 file from bucket: ${bucket}, key: ${key}`);
//             // Fetch messages from S3
//             const getObjectCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
//             const response = await client.send(getObjectCommand);
//             if (!response.Body) {
//                 console.error(`No body in S3 response for ${bucket}/${key}`);
//                 throw new Error('Empty file content');
//             }
//             const bodyContents = await streamToString(response.Body as NodeJS.ReadableStream);
//             console.log(`Received file contents of length: ${bodyContents.length}`);
//             // Parse the messages array safely
//             let messages = [];
//             try {
//                 messages = JSON.parse(bodyContents);
//                 if (!Array.isArray(messages)) {
//                     console.error(`File content is not an array: ${bodyContents.substring(0, 100)}...`);
//                     messages = []; // Reset to empty array if not valid
//                 }
//             } catch (error) {
//                 console.error(`Error parsing messages JSON: ${error}, content: ${bodyContents.substring(0, 100)}...`);
//                 messages = []; // Reset to empty array if parsing failed
//             }
//             console.log(`Parsed ${messages.length} messages for conversation ${id}`);
//             // Refresh the URL and update if needed
//             const fileUrl = await getPresignedUrl(bucket, key);
//             if (fileUrl !== conversation.fileUrl) {
//                 console.log(`Updating fileUrl for conversation ${id}`);
//                 await prisma.conversation.update({
//                     where: { id },
//                     data: { fileUrl }
//                 });
//                 conversation.fileUrl = fileUrl;
//             }
//             // Get last message for preview
//             const lastMessage = messages.length > 0 
//                 ? messages[messages.length - 1] 
//                 : null;
//             // Find the model from most recent AI message
//             const aiMessages = messages.filter((msg: any) => msg.sender === "ai");
//             const model = aiMessages.length > 0 
//                 ? aiMessages[aiMessages.length - 1].model 
//                 : "gpt-4o"; // Default model
//             res.status(200).json({
//                 ...conversation,
//                 messages,
//                 lastMessage: lastMessage 
//                     ? { content: lastMessage.content, sender: lastMessage.sender }
//                     : null,
//                 model
//             });
//         } catch (error) {
//             console.error(`Error getting messages for conversation ${id}:`, error);
//             // Return the conversation at least, even if we couldn't get the messages
//             res.status(200).json({
//                 ...conversation,
//                 messages: [],
//                 error: `Failed to get messages: ${error instanceof Error ? error.message : 'Unknown error'}`,
//                 lastMessage: null,
//                 model: "gpt-4o" // Default model
//             });
//         }
//     } catch (error) {
//         console.error(`Error getting conversation ${id}:`, error);
//         res.status(500).json({ error: 'Failed to get conversation', details: error instanceof Error ? error.message : error });
//     }
// });
convoRouter.post('/create', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, title } = req.body;
    if (!userId || !title) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }
    try {
        // Ensure user exists before creating conversation to avoid foreign key violation
        const user = yield config_1.default.user.findUnique({
            where: { userId }
        });
        if (!user) {
            res.status(400).json({ error: 'User does not exist' });
            return;
        }
        const chatId = (0, uuid_1.v4)();
        // 1. Upload empty array as JSON to S3 with the convo title as filename
        const fileName = `${user.id}/${chatId}.json`;
        const fileContent = JSON.stringify([]); // empty array
        console.log(`Creating new conversation file: ${fileName} with content: ${fileContent}`);
        const putCommand = new client_s3_1.PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileName,
            Body: fileContent,
            ContentType: 'application/json',
        });
        yield client.send(putCommand);
        console.log(`Successfully created file in S3: ${BUCKET_NAME}/${fileName}`);
        // Generate a presigned URL for access
        const fileUrl = yield getPresignedUrl(BUCKET_NAME, fileName);
        console.log(`Generated presigned URL: ${fileUrl}`);
        // Create the conversation with the fileUrl
        const conversation = yield config_1.default.conversation.create({
            data: {
                userId: user.id,
                title: title,
                fileUrl
            }
        });
        console.log(`Created conversation in database: ${JSON.stringify(conversation)}`);
        res.status(201).json(conversation);
    }
    catch (error) {
        console.error(`Error creating conversation: ${error instanceof Error ? error.message : error}`);
        res.status(500).json({ error: 'Failed to create conversation', details: error instanceof Error ? error.message : error });
    }
}));
// Delete a conversation
convoRouter.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    console.log(`Deleting conversation: ${id}`);
    try {
        // Find the conversation
        const conversation = yield config_1.default.conversation.findUnique({
            where: { id }
        });
        if (!conversation) {
            console.log(`Conversation ${id} not found for deletion`);
            res.status(404).json({ error: 'Conversation not found' });
            return;
        }
        console.log(`Found conversation to delete: ${JSON.stringify(conversation)}`);
        // Delete the S3 file first (url : userId/chatId.json)
        try {
            const url = new URL(conversation.fileUrl);
            const bucket = url.pathname.split('/')[1];
            const key = decodeURIComponent(url.pathname.split('/').slice(2).join('/'));
            console.log(`Deleting S3 file at bucket: ${bucket}, key: ${key}`);
            const deleteCommand = new client_s3_1.DeleteObjectCommand({
                Bucket: bucket,
                Key: key
            });
            yield client.send(deleteCommand);
            console.log(`Successfully deleted S3 file: ${bucket}/${key}`);
        }
        catch (error) {
            console.error(`Error deleting S3 file for conversation ${id}:`, error);
            // Continue with database deletion even if S3 deletion fails
        }
        // Delete the conversation from the database
        yield config_1.default.conversation.delete({
            where: { id }
        });
        console.log(`Successfully deleted conversation ${id} from database`);
        res.status(200).json({ success: true, message: 'Conversation deleted' });
    }
    catch (error) {
        console.error(`Error deleting conversation ${id}:`, error);
        res.status(500).json({ error: 'Failed to delete conversation', details: error instanceof Error ? error.message : error });
    }
}));
exports.default = convoRouter;
// Append a message to a conversation (replace file)
const appendMessage = (id, content, sender, timestamp, model) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Starting appendMessage for conversation ${id}`);
    try {
        // Find the conversation
        const convo = yield config_1.default.conversation.findUnique({ where: { id } });
        if (!convo) {
            console.error(`Conversation ${id} not found`);
            return { error: 'Conversation not found' };
        }
        console.log(`Found conversation: ${JSON.stringify(convo)}`);
        try {
            // Extract bucket and key from fileUrl
            const url = new URL(convo.fileUrl);
            const bucket = url.pathname.split('/')[1];
            const key = decodeURIComponent(url.pathname.split('/').slice(2).join('/'));
            console.log(`Extracted bucket: ${bucket}, key: ${key}`);
            // 1. Fetch current messages
            const getObjectCommand = new client_s3_1.GetObjectCommand({ Bucket: bucket, Key: key });
            const response = yield client.send(getObjectCommand);
            const bodyContents = yield streamToString(response.Body);
            console.log(`Retrieved file contents of length: ${bodyContents.length}`);
            // Parse the messages array
            let messages = [];
            try {
                messages = JSON.parse(bodyContents);
                if (!Array.isArray(messages)) {
                    console.error(`File content is not an array: ${bodyContents.substring(0, 100)}...`);
                    messages = []; // Reset to empty array if not valid
                }
            }
            catch (error) {
                console.error(`Error parsing messages JSON: ${error}, content: ${bodyContents.substring(0, 100)}...`);
                messages = []; // Reset to empty array if parsing failed
            }
            console.log(`Parsed ${messages.length} existing messages`);
            // 2. Append new message
            const messageId = `${id}-${messages.length + 1}`;
            const newMessage = {
                id: messageId,
                content,
                sender,
                timestamp: timestamp.toISOString(),
                model
            };
            messages.push(newMessage);
            console.log(`Added new message with ID ${messageId}, total messages: ${messages.length}`);
            // 3. Upload updated array
            const messagesJson = JSON.stringify(messages);
            const putCommand = new client_s3_1.PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: messagesJson,
                ContentType: 'application/json',
            });
            yield client.send(putCommand);
            console.log(`Successfully uploaded updated messages to ${bucket}/${key}`);
            // 4. Update the conversation's updatedAt field
            yield config_1.default.conversation.update({
                where: { id },
                data: { updatedAt: timestamp }
            });
            console.log(`Updated conversation timestamp in database`);
            return { success: true, message: newMessage, fileUrl: convo.fileUrl };
        }
        catch (error) {
            console.error(`Error in appendMessage inner try block: ${(error === null || error === void 0 ? void 0 : error.message) || error}`);
            return { error: 'Failed to append message', details: (error === null || error === void 0 ? void 0 : error.message) || error };
        }
    }
    catch (error) {
        console.error(`Error in appendMessage outer try block: ${(error === null || error === void 0 ? void 0 : error.message) || error}`);
        return { error: 'Failed to process message', details: (error === null || error === void 0 ? void 0 : error.message) || error };
    }
});
exports.appendMessage = appendMessage;
