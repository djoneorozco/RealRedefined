// Import required packages
import OpenAI from 'openai';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

// Load environment variables from .env
dotenv.config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create Express app
const app = express();
const port = process.env.PORT || 5050; // ✅ Use Render's dynamic PORT

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Root route for quick sanity-check
app.get('/', (req, res) => {
  res.send('✅ Backend is live! Hello from RealRedefined server.');
});

// ✅ POST endpoint (match frontend!)
app.post('/api/ask', async (req, res) => {
  try {
    const prompt = req.body.prompt;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // or 'gpt-4'
      messages: [{ role: 'user', content: prompt }],
    });

    res.json({ response: completion.choices[0].message.content });
  } catch (error) {
    console.error('❌ OpenAI API Error:', error);
    res.status(500).json({ error: 'Failed to generate response from AI.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});
