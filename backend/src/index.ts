import express from 'express';
import cors from 'cors';
import { generateText } from './models/google';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.post('/api/message', (req, res) => {
    const message = req.body;
    console.log(message);
    if (!message) {
        res.status(400).json({ error: 'Message is required' });
        return;
    }
    
    // Call the Google GenAI model to generate a response
    generateText(message.content)
        .then((response) => {
            console.log('Generated response:', response);
            res.json({ response });
        })
        .catch((error) => {
            console.error('Error generating response:', error);
            res.status(500).json({ error: 'Failed to generate response' });
        });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});