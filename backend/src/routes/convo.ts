import { Router } from "express";
import prisma from "../config";
import 'dotenv/config';
import { v4 as uuidv4 } from "uuid";

const convoRouter = Router();

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Conversation } from "@prisma/client";

const supabaseUrl = process.env.endpoint_url!;
const accessKey = process.env.aws_access_key_id!;
const secretKey = process.env.aws_secret_access_key!;
const region = process.env.region!;

export const client = new S3Client({
  forcePathStyle: true,
  region: region,
  endpoint: supabaseUrl,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  }
});

export const BUCKET_NAME = process.env.BUCKET!;

const getPresignedUrl = async (bucketName: string, fileName: string) => {
    const getObjectCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: fileName,
    });
    // URL expires in 6 days (3600 seconds × 24 hours × 6 days)
    return await getSignedUrl(client, getObjectCommand, { expiresIn: 6 * 24 * 3600 });
};

// Helper to convert stream to string (NodeJS Readable)
function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });
}
export async function fetchMessagesFromS3(conversations: Conversation[]) {
    const conversationsWithMessages = await Promise.all(conversations.map(async (convo) => {
        try {
            console.log(`Processing conversation: ${convo.id} - ${convo.title}`);
        
        // Extract bucket and key from fileUrl
        const url = new URL(convo.fileUrl);
        const temp = url.pathname.split('/');
        const bucket = temp[4];
        const key = temp[5] + '/' + temp[6];
        
        console.log(`Getting object from bucket: ${bucket}, key: ${key}`);
        
        // Fetch messages from S3
        const getObjectCommand = new GetObjectCommand({ 
            Bucket: bucket, 
            Key: key 
        });
        
        const response = await client.send(getObjectCommand);
        if (!response.Body) {
            throw new Error('Empty file content');
        }
        
        const bodyContents = await streamToString(response.Body as NodeJS.ReadableStream);
        console.log(`Retrieved content of length: ${bodyContents.length}`);
        
        // Parse messages safely
        let messages = [];
        try {
            messages = JSON.parse(bodyContents);
            if (!Array.isArray(messages)) {
                console.error(`File content is not an array: ${bodyContents.substring(0, 100)}...`);
                messages = []; // Reset to empty array if not valid
            }
        } catch (error) {
            console.error(`Error parsing messages JSON: ${error}, content: ${bodyContents.substring(0, 100)}...`);
            messages = []; // Reset to empty array if parsing failed
        }
        
        console.log(`Parsed ${messages.length} messages for conversation ${convo.id}`);
        
        // Generate a new presigned URL if needed
        const fileUrl = await getPresignedUrl(bucket, key);
        
        // Update the URL in the database if it changed
        if (fileUrl !== convo.fileUrl) {
            console.log(`Updating fileUrl for conversation ${convo.id}`);
            await prisma.conversation.update({
                where: { id: convo.id },
                data: { fileUrl }
            });
        }

        // Get last message for preview
        const lastMessage = messages.length > 0 
            ? messages[messages.length - 1] 
            : null;
        
        // Find the model from most recent AI message
        const aiMessages = messages.filter((msg: any) => msg.sender === "ai");
        const model = aiMessages.length > 0 
            ? aiMessages[aiMessages.length - 1].model 
            : "gpt-4o"; // Default model

        console.log(`Successfully processed conversation ${convo.id}`);
        
        return {
            ...convo,
            fileUrl,
            messages: {
                id: convo.id,
                title: convo.title,
                messages: messages
            },
            lastMessage: lastMessage 
                ? { content: lastMessage.content, sender: lastMessage.sender }
                : null,
            model
        };
    } catch (error) {
        console.error(`Error fetching messages for conversation ${convo.id}:`, error);
        // Return the conversation without messages if there's an error
        return {
            ...convo,
            messages: {
                id: convo.id,
                title: convo.title,
                messages: []
            },
            lastMessage: null,
            model: "gpt-4o", // Default model
            error: `Failed to fetch messages: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
    }));
    return conversationsWithMessages;
}


// Function which adds a folder in the bucket with the userId as the name
export const createFolder = async (userId: string) => {
    const putCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key:`${userId}/`,
        Body: 'application/json',
    });

    await client.send(putCommand);
    console.log(`Successfully created folder in S3: ${BUCKET_NAME}/${userId}`);
}

export const createDefaultChat = async (userId: string) => {
    const chatId = uuidv4(); // generates a unique ID
    const messageId = uuidv4();

    const key = `${userId}/${chatId}.json`;
  
    // Create the messages array directly instead of wrapping it in another object
    const defaultMessages = [
      {
        id: `${chatId}-1`,
            content: "What is TARS Chat?",
            sender: "user",
            timestamp: new Date("2023-06-15T14:28:00").toISOString(),
          },
          {
        id: `${chatId}-2`,
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
  
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(defaultMessages),
      ContentType: "application/json",
    });
  
    await client.send(command);
    console.log(`Default chat created at: ${BUCKET_NAME}/${key}`);

    const fileUrl = await getPresignedUrl(BUCKET_NAME, key);

    return {fileUrl, chatId};
  };


// Get all conversations for a user with recent messages
convoRouter.get('/list', async (req, res) => {
    const userId = req.headers['userid'] as string;
    const limit = parseInt(req.query.limit as string) || 10;
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * limit;
    
    console.log(`Fetching conversations for user: ${userId}, page: ${page}, limit: ${limit}`);
    
    if (!userId) {
        console.log('Missing userId in request');
        res.status(400).json({ error: 'User ID is required' });
        return;
    }

    try {
        // First find the user's ID in the database
        const user = await prisma.user.findUnique({
            where: { userId }
        });

        if (!user) {
            console.log(`User not found: ${userId}`);
            res.status(404).json({ error: 'User not found' });
            return;
        }

        console.log(`Found user: ${user.id} (${user.name})`);

        // Get paginated conversations for the user
        const conversations = await prisma.conversation.findMany({
            where: { userId: user.id },
            orderBy: { updatedAt: 'desc' },
            skip,
            take: limit
        });

        // Get total count for pagination info
        const totalCount = await prisma.conversation.count({
            where: { userId: user.id }
        });

        console.log(`Found ${conversations.length} conversations for user ${userId} (page ${page}/${Math.ceil(totalCount / limit)})`);

        // For each conversation, fetch messages from S3
        const conversationsWithMessages = await fetchMessagesFromS3(conversations);

        console.log(`Returning ${conversationsWithMessages.length} conversations with messages`);
        res.status(200).json(conversationsWithMessages);
    } catch (error) {
        console.error('Error getting conversations:', error);
        res.status(500).json({ error: 'Failed to get conversations', details: error instanceof Error ? error.message : error });
    }
});

// Get a single conversation and its messages
convoRouter.get('/:id', async (req, res) => {
    const { id } = req.params;
    const userId = req.headers['userid'] as string;
    
    console.log(`Fetching conversation: ${id}`);
    
    if (!userId) {
        console.log('Missing userId in request');
        res.status(400).json({ error: 'User ID is required' });
        return;
    }

    try {
        // First find the user in the database
        const user = await prisma.user.findUnique({
            where: { userId }
        });

        if (!user) {
            console.log(`User not found: ${userId}`);
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Get the conversation and verify it belongs to the user
        const conversation = await prisma.conversation.findFirst({
            where: { 
                id,
                userId: user.id 
            }
        });

        if (!conversation) {
            console.log(`Conversation ${id} not found or doesn't belong to user ${userId}`);
            res.status(404).json({ error: 'Conversation not found or not authorized' });
            return;
        }

        console.log(`Found conversation: ${id} - ${conversation.title}`);

        // Fetch messages from S3
        try {
            const [conversationWithMessages] = await fetchMessagesFromS3([conversation]);
            console.log(`Successfully fetched messages for conversation ${id}`);
            
            res.status(200).json(conversationWithMessages);
        } catch (error) {
            console.error(`Error fetching messages for conversation ${id}:`, error);
            
            // Return the conversation at least, even if we couldn't get the messages
            res.status(200).json({
                ...conversation,
                messages: {
                    id: conversation.id,
                    title: conversation.title,
                    messages: []
                },
                error: `Failed to get messages: ${error instanceof Error ? error.message : 'Unknown error'}`,
                lastMessage: null,
                model: "gpt-4o" // Default model
            });
        }
    } catch (error) {
        console.error(`Error getting conversation ${id}:`, error);
        res.status(500).json({ error: 'Failed to get conversation', details: error instanceof Error ? error.message : error });
    }
});

convoRouter.post('/create', async (req, res) => {
    const { userId, title, firstMessage, aiResponse, model } = req.body;

    if (!userId || !title) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }

    try {
        // Find or create the user
        let user = await prisma.user.findUnique({
            where: { userId }
        });
        
        // If the user doesn't exist, create them
        if (!user) {
            console.log(`User ${userId} not found, creating a new user`);
            try {
                user = await prisma.user.create({
                    data: { 
                        userId,
                        name: 'Anonymous User',
                        isPro: false,
                        messagesLeft: 5,
                        pinnedModels: { 
                            create: {
                                models: []
                            }
                        }
                    }
                });
                console.log(`User created with ID: ${user.id}`);
            } catch (userCreateError) {
                console.error("Error creating user:", userCreateError);
                res.status(500).json({ error: 'Failed to create user', details: userCreateError instanceof Error ? userCreateError.message : userCreateError });
            return;
            }
        }
        
        const chatId = uuidv4();
        
        // Prepare initial messages if provided
        let initialMessages = [];
        
        if (firstMessage) {
            // Create message objects for first message and AI response
            const userMessageId = `${chatId}-1`;
            const userMessage = {
                id: userMessageId,
                content: firstMessage,
                sender: "user",
                timestamp: new Date().toISOString()
            };
            
            initialMessages.push(userMessage);
            
            // Add AI response if provided
            if (aiResponse) {
                const aiMessageId = `${chatId}-2`;
                const aiMessage = {
                    id: aiMessageId,
                    content: aiResponse,
                    sender: "ai",
                    timestamp: new Date().toISOString(),
                    model: model || "gpt-4o"
                };
                
                initialMessages.push(aiMessage);
            }
        }
        
        // 1. Upload conversation data to S3
        try {
            const fileName = `${user.id}/${chatId}.json`;
            const fileContent = JSON.stringify(initialMessages);
            console.log(`Creating new conversation file: ${fileName} with content length: ${fileContent.length}`);
            console.log(`Using bucket: ${BUCKET_NAME}`);
        
        const putCommand = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileName,
            Body: fileContent,
            ContentType: 'application/json',
        });
        
        await client.send(putCommand);
        console.log(`Successfully created file in S3: ${BUCKET_NAME}/${fileName}`);

        // Generate a presigned URL for access
        const fileUrl = await getPresignedUrl(BUCKET_NAME, fileName);
        console.log(`Generated presigned URL: ${fileUrl}`);

        // Create the conversation with the fileUrl
        const conversation = await prisma.conversation.create({
            data: {
                id: chatId,
                userId: user.id,
                title: title as string,
                    fileUrl,
                    createdAt: new Date(),
                    updatedAt: new Date()
            }
        });
        
        console.log(`Created conversation in database: ${JSON.stringify(conversation)}`);

            // Return the complete conversation data including messages
            const conversationWithMessages = {
                ...conversation,
                messages: {
                    id: chatId,
                    title: title,
                    messages: initialMessages
                },
                lastMessage: aiResponse ? aiResponse.substring(0, 50) + (aiResponse.length > 50 ? "..." : "") : firstMessage,
                model: model || "gpt-4o"
            };

            res.status(201).json(conversationWithMessages);
        } catch (s3Error) {
            console.error("Error with S3 operation:", s3Error);
            res.status(500).json({ error: 'S3 Storage Error', details: s3Error instanceof Error ? s3Error.message : s3Error });
        }
    } catch (error) {
        console.error(`Error creating conversation: ${error instanceof Error ? error.message : error}`);
        res.status(500).json({ error: 'Failed to create conversation', details: error instanceof Error ? error.message : error });
    }
});

// Delete a conversation
convoRouter.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const userId = req.headers['userid'] as string;
    
    console.log(`Request to delete conversation: ${id}`);
    
    if (!userId) {
        console.log('Missing userId in delete request');
        res.status(400).json({ error: 'User ID is required' });
        return;
    }
    
    try {
        // First verify the user exists
        const user = await prisma.user.findUnique({
            where: { userId }
        });
        
        if (!user) {
            console.log(`User not found: ${userId}`);
            res.status(404).json({ error: 'User not found' });
            return;
        }
        
        // Find the conversation and make sure it belongs to the user
        const conversation = await prisma.conversation.findFirst({
            where: { 
                id,
                userId: user.id
            }
        });

        if (!conversation) {
            console.log(`Conversation ${id} not found for deletion or doesn't belong to user ${userId}`);
            res.status(404).json({ error: 'Conversation not found or not authorized' });
            return;
        }

        console.log(`Found conversation to delete: ${conversation.id} (${conversation.title})`);

        // Delete the S3 file first
        let fileDeleted = false;
        
        try {
            if (!conversation.fileUrl) {
                console.error(`Missing fileUrl for conversation ${id}`);
                throw new Error('Missing fileUrl');
            }
            
            // Extract bucket and key from fileUrl using the same approach as fetchMessagesFromS3
            const url = new URL(conversation.fileUrl);
            if (!url || !url.pathname) {
                console.error(`Invalid fileUrl for conversation ${id}: ${conversation.fileUrl}`);
                throw new Error('Invalid fileUrl');
            }
            
            const temp = url.pathname.split('/');
            if (temp.length < 7) {
                console.error(`Unexpected fileUrl format for conversation ${id}: ${conversation.fileUrl}`);
                throw new Error('Unexpected fileUrl format');
            }
            
            const bucket = temp[4]; // Match format used in fetchMessagesFromS3
            const key = temp[5] + '/' + temp[6]; // Match format used in fetchMessagesFromS3
            
            if (!bucket || !key) {
                console.error(`Could not extract bucket or key from fileUrl: ${conversation.fileUrl}`);
                throw new Error('Could not extract bucket or key');
            }
            
            console.log(`Deleting S3 file at bucket: ${bucket}, key: ${key}`);
            
            const deleteCommand = new DeleteObjectCommand({
                Bucket: bucket,
                Key: key
            });
            
            await client.send(deleteCommand);
            console.log(`Successfully deleted S3 file: ${bucket}/${key}`);
            fileDeleted = true;
        } catch (error) {
            console.error(`Error deleting S3 file for conversation ${id}:`, error);
            // Continue with database deletion even if S3 deletion fails
        }

        // Delete the conversation from the database
        await prisma.conversation.delete({
            where: { id: conversation.id }
        });
        console.log(`Successfully deleted conversation ${id} from database`);

        res.status(200).json({ 
            success: true, 
            message: 'Conversation deleted', 
            fileDeleted 
        });
    } catch (error) {
        console.error(`Error deleting conversation ${id}:`, error);
        res.status(500).json({ 
            error: 'Failed to delete conversation', 
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default convoRouter;


// Append a message to a conversation (replace file)
export const appendMessage = async (id: string, content: string, sender: string, timestamp: Date, model: string) => {
    console.log(`Starting appendMessage for conversation ${id}`);
    try {
        // Find the conversation
        const convo = await prisma.conversation.findUnique({ where: { id } });
        if (!convo){
            console.error(`Conversation ${id} not found`);
            return { error: 'Conversation not found' };
        }

        console.log(`Found conversation: ${JSON.stringify(convo)}`);
        
        try {
            // Extract bucket and key from fileUrl using the same parsing approach as other functions
            const url = new URL(convo.fileUrl);
            const temp = url.pathname.split('/');
            const bucket = temp[4]; // Match format used in fetchMessagesFromS3
            const key = temp[5] + '/' + temp[6]; // Match format used in fetchMessagesFromS3
            
            console.log(`Extracted bucket: ${bucket}, key: ${key}`);
            
            // 1. Fetch current messages
            const getObjectCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
            const response = await client.send(getObjectCommand);
            const bodyContents = await streamToString(response.Body as NodeJS.ReadableStream);
            
            console.log(`Retrieved file contents of length: ${bodyContents.length}`);
            
            // Parse the messages array
            let messages = [];
            try {
                messages = JSON.parse(bodyContents);
                if (!Array.isArray(messages)) {
                    console.error(`File content is not an array: ${bodyContents.substring(0, 100)}...`);
                    messages = []; // Reset to empty array if not valid
                }
            } catch (error) {
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
            const putCommand = new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: messagesJson,
                ContentType: 'application/json',
            });
            
            await client.send(putCommand);
            console.log(`Successfully uploaded updated messages to ${bucket}/${key}`);
            
            // 4. Update the conversation's updatedAt field
            await prisma.conversation.update({
                where: { id },
                data: { updatedAt: timestamp }
            });
            
            console.log(`Updated conversation timestamp in database`);
            
            return { success: true, message: newMessage, fileUrl: convo.fileUrl };
        } catch (error: any) {
            console.error(`Error in appendMessage inner try block: ${error?.message || error}`);
            return { error: 'Failed to append message', details: error?.message || error };
        }
    } catch (error: any) {
        console.error(`Error in appendMessage outer try block: ${error?.message || error}`);
        return { error: 'Failed to process message', details: error?.message || error };
    }
};

// Debug endpoint to check if a conversation file exists in S3
convoRouter.get('/:id/check-file', async (req, res) => {
    const { id } = req.params;
    const userId = req.headers['userid'] as string;
    
    console.log(`Checking file existence for conversation: ${id}`);
    
    if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
    }
    
    try {
        // Verify the user exists
        const user = await prisma.user.findUnique({
            where: { userId }
        });
        
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        
        // Find the conversation
        const conversation = await prisma.conversation.findFirst({
            where: { 
                id,
                userId: user.id
            }
        });

        if (!conversation) {
            res.status(404).json({ error: 'Conversation not found or not authorized' });
            return;
        }
        
        // Check the file in S3
        try {
            if (!conversation.fileUrl) {
                res.status(400).json({ error: 'Missing fileUrl', conversation });
                return;
            }
            
            const url = new URL(conversation.fileUrl);
            if (!url || !url.pathname) {
                res.status(400).json({ error: 'Invalid fileUrl', fileUrl: conversation.fileUrl, conversation });
                return;
            }
            
            const temp = url.pathname.split('/');
            if (temp.length < 7) {
                res.status(400).json({ error: 'Unexpected fileUrl format', fileUrl: conversation.fileUrl, pathParts: temp });
                return;
            }
            
            const bucket = temp[4];
            const key = temp[5] + '/' + temp[6];
            
            if (!bucket || !key) {
                res.status(400).json({ error: 'Could not extract bucket or key', fileUrl: conversation.fileUrl });
                return;
            }
            
            // Check if the file exists
            try {
                const headCommand = new GetObjectCommand({
                    Bucket: bucket,
                    Key: key
                });
                
                const response = await client.send(headCommand);
                
                res.status(200).json({
                    exists: true,
                    conversation,
                    bucket,
                    key,
                    contentLength: response.ContentLength,
                    contentType: response.ContentType
                });
                
            } catch (error) {
                res.status(404).json({
                    exists: false,
                    conversation,
                    bucket,
                    key,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
            
        } catch (error) {
            res.status(500).json({
                error: 'Error processing fileUrl',
                fileUrl: conversation.fileUrl,
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
        
    } catch (error) {
        res.status(500).json({
            error: 'Server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Helper function to parse S3 file path from fileUrl
function parseS3PathFromFileUrl(fileUrl: string): { bucket: string, key: string } | null {
    try {
        console.log(`Parsing S3 path from fileUrl: ${fileUrl}`);
        
        const url = new URL(fileUrl);
        console.log(`Parsed URL: ${url.toString()}`);
        console.log(`URL pathname: ${url.pathname}`);
        
        const temp = url.pathname.split('/');
        console.log(`Path parts: ${JSON.stringify(temp)}`);
        
        if (temp.length < 7) {
            console.error(`URL path does not have enough segments: ${url.pathname}`);
            return null;
        }
        
        const bucket = temp[4];
        const key = temp[5] + '/' + temp[6];
        
        console.log(`Extracted bucket: ${bucket}, key: ${key}`);
        
        if (!bucket || !key) {
            console.error(`Failed to extract bucket or key from path parts: ${JSON.stringify(temp)}`);
            return null;
        }
        
        return { bucket, key };
    } catch (error) {
        console.error(`Error parsing S3 path from fileUrl: ${error}`);
        return null;
    }
}