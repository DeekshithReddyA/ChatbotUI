import { Router } from "express";
import prisma from "../config";
import { createDefaultChat, fetchMessagesFromS3, client, BUCKET_NAME } from "./convo";
import { v4 as uuidv4 } from "uuid";
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
const userRouter = Router();

// Add S3 client configuration
const supabaseUrl = process.env.endpoint_url!;
const accessKey = process.env.aws_access_key_id!;
const secretKey = process.env.aws_secret_access_key!;
const region = process.env.region!;

// Function to convert a readable stream to string
function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });
}

userRouter.post('/signup', async (req, res) => {
    const { userId, name } = req.body;

    if (!userId || !name) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }

    try{
        const existingUser = await prisma.user.findUnique({
            where: { userId }
        })

        if (existingUser) {
            res.status(200).json({ message: 'User already exists' });
            return;
        }

        const user = await prisma.user.create({
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

        const {fileUrl, chatId} = await createDefaultChat(user.id);

        const conversation = await prisma.conversation.create({
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
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
});

userRouter.get('/get', async (req, res) => {
    const userId = req.headers['userid'] as string;
    console.log("userID:",userId);

    if (!userId) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }

    try{
        const user = await prisma.user.findUnique({
            where: { userId }
        });

        console.log("user:",user);

        const conversations = await prisma.conversation.findMany({
            where: { userId: user?.id }
        });

        console.log("conversations:",conversations);

        //fetch messages from s3
        const conversationsWithMessages = await fetchMessagesFromS3(conversations);

        console.log("conversationsWithMessages:",conversationsWithMessages);

        const models = await prisma.userPinnedModels.findUnique({
            where: { userId: user?.id }
        }); 

        console.log("models:",models);
        res.status(200).json({ user, conversations, models, conversationsWithMessages });

    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error });
        return;
    }
})

// Add a new route to fix the Welcome to TARS Chat conversation
userRouter.post('/fix-welcome-chat', async (req, res) => {
    const userId = req.headers['userid'] as string;
    
    if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
    }
    
    try {
        // Find the user
        const user = await prisma.user.findUnique({
            where: { userId }
        });
        
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        
        // Find the Welcome conversation
        const welcomeConversation = await prisma.conversation.findFirst({
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
            const getCommand = new GetObjectCommand({
                Bucket: bucket,
                Key: key
            });
            
            const response = await client.send(getCommand);
            if (response.Body) {
                const bodyContents = await streamToString(response.Body as NodeJS.ReadableStream);
                const parsed = JSON.parse(bodyContents);
                
                // Check if the messages are in the expected format
                if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].messages) {
                    // This is the old format with nested messages
                    const oldFormat = parsed[0];
                    currentMessages = oldFormat.messages;
                    
                    // Fix message IDs to use conversation ID
                    currentMessages = currentMessages.map((msg: any, index: number) => ({
                        ...msg,
                        id: `${welcomeConversation.id}-${index + 1}`
                    }));
                    
                    // Store the fixed messages
                    const putCommand = new PutObjectCommand({
                        Bucket: bucket,
                        Key: key,
                        Body: JSON.stringify(currentMessages),
                        ContentType: 'application/json',
                    });
                    
                    await client.send(putCommand);
                    
                    res.status(200).json({ 
                        success: true, 
                        message: 'Welcome conversation fixed' 
                    });
                    return;
                } else if (Array.isArray(parsed)) {
                    // Already in the correct format
                    res.status(200).json({ 
                        success: true, 
                        message: 'Welcome conversation already in correct format' 
                    });
                    return;
                }
            }
        } catch (error) {
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
        const putCommand = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: JSON.stringify(defaultMessages),
            ContentType: 'application/json',
        });
        
        await client.send(putCommand);
        
        res.status(200).json({ 
            success: true, 
            message: 'Welcome conversation recreated' 
        });
        
    } catch (error) {
        console.error('Error fixing welcome conversation:', error);
        res.status(500).json({ 
            error: 'Failed to fix welcome conversation', 
            details: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
});

export default userRouter;