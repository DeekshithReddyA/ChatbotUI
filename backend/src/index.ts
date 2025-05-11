// index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateText } from './models/google';
import { modifyPinnedModels } from './models/models';
import prisma from './config';
import userRouter from './routes/user';
import convoRouter, { appendMessage } from './routes/convo';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/user', userRouter);
app.use('/api/convo', convoRouter);

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
  const { messages, model = "gemini-2.0-flash" } = req.body;
  const userId = req.headers['userid'] as string;

  // Track the conversation if ID is provided
  const conversationId = req.headers['conversationid'] as string;

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
        const result = await appendMessage(
          conversationId,
          lastMessage.content,
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
    // Format messages for Gemini API
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));

    const textStream = generateText("gemini-2.0-flash", formattedMessages);
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
        const result = await appendMessage(
          conversationId,
          responseText,
          'ai',
          new Date(),
          model
        );
        console.log('AI response save result:', result);
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
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});