
// index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateText } from './models/google';
import {  modifyPinnedModels } from './models/models';
import prisma from './config';
import userRouter from './routes/user';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/user', userRouter);

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
      console.log(pinned.models);
    } 
    console.log(pinnedModels);
    const modelsinRender = models.map(model => ({
      ...model,
      isLocked: model.isPro && !isPro,
      isPinned: pinnedModels.includes(model.id)
    }));

    console.log(modelsinRender);
    res.status(200).json(modelsinRender);
    
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }

  
});

app.post('/api/pinnedModels' , async (req, res) => {
  let { pinnedModels } = req.body;
  console.log(pinnedModels);
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
//   const { messages, model = "gemini-2.0-flash" } = req.body;
    const {messages, model} = req.body;

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
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));

    const textStream = generateText(modelName, formattedMessages);

    for await (const text of textStream) {
      if (text) {
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`);
      }
    }

    res.write(`data: [DONE]\n\n`);
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