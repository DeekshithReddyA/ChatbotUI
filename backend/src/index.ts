import express from 'express';
import cors from 'cors';
import { generateText } from './models/google';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.post('/api/message', async (req, res) => {
    const message = req.body;
    console.log(message);
    if (!message) {
        res.status(400).json({ error: 'Message is required' });
        return;
    }
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const stream = generateText(message.content);

    for await (const text of stream) {
        console.log("Chunk:", text);
        res.write(text); // ✅ write instead of send
    }

    res.end(); // ✅ end after the loop
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});