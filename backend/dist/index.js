"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const google_1 = require("./models/google");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.post('/api/message', (req, res) => {
    const message = req.body;
    console.log(message);
    if (!message) {
        res.status(400).json({ error: 'Message is required' });
        return;
    }
    // Call the Google GenAI model to generate a response
    (0, google_1.generateText)(message.content)
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
