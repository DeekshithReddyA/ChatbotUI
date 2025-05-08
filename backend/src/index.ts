// import express from 'express';
// import cors from 'cors';
// import { generateText } from './models/google';

// const app = express();
// const PORT = process.env.PORT || 3000;

// app.use(express.json());
// app.use(cors());

// app.post('/api/message', async (req, res) => {
//     const message = req.body;
//     console.log(message);
//     if (!message) {
//         res.status(400).json({ error: 'Message is required' });
//         return;
//     }
//     res.setHeader('Content-Type', 'text/plain; charset=utf-8');
//     res.setHeader('Transfer-Encoding', 'chunked');

//     const stream = generateText(message.content);

//     for await (const text of stream) {
//         console.log("Chunk:", text);
//         res.write(text); // ✅ write instead of send
//     }

//     res.end(); // ✅ end after the loop
// });

// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });

// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import ai from './models/google';

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 3000;

// app.use(cors());
// app.use(express.json());


// app.post('/api/chat', async (req, res) => {
//   const body = req.body;
//   const messages = body.messages;

//   console.log("Received messages:", messages);

//   if (!messages || !Array.isArray(messages)) {
//     res.status(400).json({ error: 'Invalid messages' });
//     return;
//   }

//   res.setHeader('Content-Type', 'text/event-stream');
//   res.setHeader('Cache-Control', 'no-cache');
//   res.setHeader('Connection', 'keep-alive');
//   res.flushHeaders();

//   try {
//     const result = await ai.models.generateContentStream({
//         model : "gemini-2.0-flash",
//         contents: {
//             role: "user",
//             parts: messages.map((message) => ({ text: message.content })),
//         },
//     });


//     for await (const chunk of result) {
//       const text = chunk.text;
//       if (text) {
//         res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`);
//       }
//     }

//     res.write(`data: [DONE]\n\n`);
//     res.end();
//   } catch (err) {
//     console.error("Error:", err);
//     res.write(`data: ${JSON.stringify({ error: 'Streaming error' })}\n\n`);
//     res.end();
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });



// index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import ai from './models/google';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
//   const { messages, model = "gemini-2.0-flash" } = req.body;
    const {messages} = req.body;

    const model = "gemini-2.0-flash"; // Default model

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

    // Select appropriate model based on request
    let modelName = "gemini-2.0-flash"; // Default model
    
    // Map frontend model names to Gemini model names
    if (model === "gemini-2.0-flash" || model === "gemini-pro") {
      modelName = "gemini-2.0-flash";
    } else if (model === "gemini-ultra") {
      modelName = "gemini-2.0-pro";
    } else {
      // For non-Gemini models, we'll fall back to default
      console.log(`Model ${model} not available, using ${modelName} instead`);
    }

    const result = await ai.models.generateContentStream({
      model: modelName,
      contents: formattedMessages,
    });

    for await (const chunk of result) {
      const text = chunk.text;
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