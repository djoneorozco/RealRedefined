// backend/server.js
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

// 1) load process.env.OPENAI_API_KEY from .env
dotenv.config();

// __dirname workaround in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// 2) instantiate OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();

// 3) let us parse JSON bodies
app.use(express.json());

// 4) serve all files in ../frontend as static assets
app.use(express.static(path.join(__dirname, '../frontend')));

// 5) a simple “test connection” endpoint
app.get('/api/test', (req, res) => {
  res.json({ ok: true, message: 'Backend is live!' });
});

// 6) your AI proxy endpoint
app.post('/api/ask', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'No prompt provided' });
  }
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });
    const aiText = completion.choices?.[0]?.message.content;
    res.json({ response: aiText });
  } catch (err) {
    console.error('OpenAI error', err);
    res.status(500).json({ error: 'AI request failed' });
  }
});

// 7) fallback: always send index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 8) start up
const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
});