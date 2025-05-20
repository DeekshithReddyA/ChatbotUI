// index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateStreamText } from './models/models';
import prisma from './config';
import userRouter from './routes/user';
import convoRouter, { appendMessage, client, BUCKET_NAME } from './routes/convo';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
// Increase JSON body size limit to 50MB for image uploads
app.use(express.json({ limit: '50mb' }));
// Also increase URL-encoded data limit
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/user', userRouter);
app.use('/api/convo', convoRouter);

// Function to convert a readable stream to string
function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

// Function to fix all welcome conversations for existing users
async function migrateWelcomeConversations() {
  console.log("Starting migration of Welcome to TARS Chat conversations...");
  
  try {
    // Find all conversations with title "Welcome to TARS Chat"
    const welcomeConversations = await prisma.conversation.findMany({
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
              id: `${convo.id}-${index + 1}`
            }));
            
            // Store the fixed messages
            const putCommand = new PutObjectCommand({
              Bucket: bucket,
              Key: key,
              Body: JSON.stringify(currentMessages),
              ContentType: 'application/json',
            });
            
            await client.send(putCommand);
            successCount++;
            console.log(`Migrated conversation ${convo.id} successfully`);
          } else if (Array.isArray(parsed)) {
            // Already in the correct format
            console.log(`Conversation ${convo.id} already in correct format`);
            successCount++;
          } else {
            throw new Error("Unexpected format");
          }
        }
      } catch (error) {
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
          const putCommand = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: JSON.stringify(defaultMessages),
            ContentType: 'application/json',
          });
          
          await client.send(putCommand);
          console.log(`Recreated messages for conversation ${convo.id}`);
          successCount++;
        } catch (fallbackError) {
          console.error(`Failed to recreate messages for conversation ${convo.id}:`, fallbackError);
        }
      }
    }
    
    console.log(`Migration completed. Success: ${successCount}, Errors: ${errorCount}`);
  } catch (error) {
    console.error("Error during welcome conversations migration:", error);
  }
}

// Run the migration when the server starts
migrateWelcomeConversations();

// Has to be converted to return these models along with the user data.
// Have to add another endpoint where only pinned models are returned.
app.get('/api/models', async (req, res) => {
  const userId = req.headers['userid'] as string;
  try{

    const user = await prisma.user.findUnique({
      where: {
        userId: userId
      }
    });

    const isPro = user?.isPro;
    const models = await prisma.model.findMany();
    const pinned = await prisma.userPinnedModels.findUnique({
      where: {
        userId: user?.id
      }
    });
    let pinnedModels: string[] = [];
    if(pinned !== null){
      pinnedModels = pinned.models;
    } 
    const modelsinRender = models.map(model => ({
      ...model,
      isLocked: model.isPro && !isPro,
      isPinned: pinnedModels.includes(model.id)
    }));
    res.status(200).json(modelsinRender);
    
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }

  
});

app.post('/api/pinnedModels' , async (req, res) => {
  let { pinnedModels } = req.body;
  if (!Array.isArray(pinnedModels)) {
    res.status(400).json({ error: 'pinnedModels must be an array' });
    return;
  } 
  const userId = req.headers['userid'] as string;

  const user = await prisma.user.update({
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
});

app.post('/api/chat', async (req, res) => {
  const { messages, model, files, search } = req.body;

  console.log("Request", req.body);
  const userId = req.headers['userid'] as string;

  // Track the conversation if ID is provided
  const conversationId = req.headers['conversationid'] as string;
  console.log(`Chat request received for conversation ID: ${conversationId || 'none'}`);
  console.log(`Model selected: ${model}`);
  console.log(`Messages in request: ${messages.length}`);
  console.log(`Files in request: ${files ? files.length : 0}`);

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: 'Invalid messages format' });
    return;
  }

  // Check if user has access to the requested model
  try {
    const user = await prisma.user.findUnique({
      where: { userId }
    });

    if (!user) {
      res.status(401).json({ error: 'User not found or unauthorized' });
      return;
    }

    // Get model details
    const modelInfo = await prisma.model.findUnique({
      where: { id: model }
    });

    if (!modelInfo) {
      console.log(`Invalid model requested: ${model}, falling back to default`);
      // We'll continue but with default model
    } else if (modelInfo.isPro && !user.isPro) {
      console.log(`User ${userId} attempted to use pro model ${model} without pro access`);
      // Send a friendly error message
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();
      
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: "This model requires a Pro subscription. Using gemini-2.0-flash model instead." } }] })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
      return;
    }

    // Determine which model to actually use (requested model if authorized, or fallback)
    let actualModel = model;
    if (modelInfo?.isPro && !user.isPro) {
      actualModel = "gemini-2.0-flash"; // Default non-pro model
    }

    // Save the user message first if we have a conversation ID
    if (conversationId && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        try {
          console.log(`Saving user message to conversation ${conversationId}`);
          console.log(`User message content: ${lastMessage.content.substring ? lastMessage.content.substring(0, 50) + (lastMessage.content.length > 50 ? '...' : '') : 'Multimodal content'}`);
          
          const result = await appendMessage(
            conversationId,
            typeof lastMessage.content === 'string' ? lastMessage.content : JSON.stringify(lastMessage.content),
            'user',
            new Date(),
            ''
          );
          console.log('User message save result:', result);
        } catch (error) {
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
      const formattedMessages = messages.map((msg: any) => {
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
          content: [{type: "text", text: msg.content }]
        };
      });

      // Check if this is one of the image-compatible models
      const isImageIncompatibleModel = [
        'gpt-4', 'o3-mini', 'o3', 'o4-mini', 'o1-preview'
      ].includes(actualModel);

      if(search === true){
        actualModel = "gpt-4o-mini-search-preview";
      }

      console.log(`Using model: ${actualModel}`);
      const textStream = generateStreamText(formattedMessages, actualModel);
      let responseText = ''; // Accumulate the full response

      for await (const text of textStream) {
        if (text) {
          responseText += text;
          res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`);
        }
      }

      res.write(`data: [DONE]\n\n`);
      
      // If we have a conversation ID, update that conversation with the AI's response
      if (conversationId && responseText) {
        try {
          console.log(`Saving AI response to conversation ${conversationId}`);
          console.log(`AI response length: ${responseText.length} characters`);
          console.log(`AI response preview: ${responseText.substring(0, 50)}${responseText.length > 50 ? '...' : ''}`);
          
          const result = await appendMessage(
            conversationId,
            responseText,
            'ai',
            new Date(),
            actualModel
          );
          console.log('AI response save result:', result.success ? 'Success' : 'Failed');
        } catch (error) {
          console.error('Error saving AI response to conversation:', error);
        }
      }
      
      res.end();
    } catch (err) {
      console.error("Error:", err);
      res.write(`data: ${JSON.stringify({ error: 'Streaming error', message: (err as Error).message })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error("Error checking user authorization:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add endpoint to save stopped messages
app.post('/api/chat/save-stopped', async (req, res) => {
  const { conversationId, content, model } = req.body;
  const userId = req.headers['userid'] as string;

  if (!conversationId || !content) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    // Save the stopped AI response to the conversation
    const result = await appendMessage(
      conversationId,
      content,
      'ai',
      new Date(),
      model || 'gpt-4o',
      true // Indicate this message was stopped early
    );

    console.log(`Saved stopped message for conversation ${conversationId}`);
    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('Error saving stopped message:', error);
    res.status(500).json({ 
      error: 'Failed to save stopped message', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});