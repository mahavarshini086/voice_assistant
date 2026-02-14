// server.js
import { GoogleGenAI } from '@google/genai';
import express from 'express';
import cors from 'cors';

// Initialize Gemini Client - it automatically uses the GEMINI_API_KEY env variable
const ai = new GoogleGenAI({});
const chat = ai.chats.create({ model: "gemini-2.5-flash" }); // Use a chat session for memory

const app = express();
const port = 3000;

app.use(cors()); // Allows your HTML/JS to call this server
app.use(express.json()); // To parse JSON request body
app.use(express.static('.')); // Serve the index.html and script.js files

app.post('/ask', async (req, res) => {
    const userMessage = req.body.message;

    try {
        const response = await chat.sendMessage({ message: userMessage });
        res.json({ text: response.text });
    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ text: "Sorry, I ran into an error." });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Voice Assistant ready. Open your browser to the URL above.');
});