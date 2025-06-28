// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { OpenAI } from "openai";

// Node ESM __dirname shim:
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// 1) Serve your frontend assets
app.use(express.static(path.join(__dirname, "../frontend")));

// 2) Enable CORS & JSON body parsing
app.use(cors());
app.use(express.json());

// 3) Verify the API key is set
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ Missing OPENAI_API_KEY in environment");
  process.exit(1);
}

// 4) Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 5) Health-check endpoint
app.get("/api/test", (_req, res) => {
  res.json({ ok: true, msg: "Backend is live!" });
});

// 6) AI endpoint
app.post("/api/ask", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Missing `prompt` in request body." });
    }
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user",   content: prompt },
      ],
    });
    const answer = completion.choices[0]?.message?.content || "";
    res.json({ answer });
  } catch (err) {
    console.error("AI error:", err);
    res.status(500).json({ error: "OpenAI request failed." });
  }
});

// 7) All other GETs should return your frontend's index.html
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// 8) Start the server
const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});