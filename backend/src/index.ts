
// index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateText } from './models/google';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
//   const { messages, model = "gemini-2.0-flash" } = req.body;
    const {messages} = req.body;

    console.log(messages);

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