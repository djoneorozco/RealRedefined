// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { OpenAI } from "openai";

// Node ESM __dirname shim:
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

dotenv.config();

const app = express();

// 1) Serve your frontend assets
app.use(express.static(path.join(__dirname, "../frontend")));

// 2) Enable CORS & JSON body parsing
app.use(cors());
app.use(express.json());

// 3) Verify the API keys are set
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ Missing OPENAI_API_KEY in environment");
  process.exit(1);
}
if (!process.env.CENSUS_API_KEY) {
  console.error("❌ Missing CENSUS_API_KEY in environment");
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

// 6) Census-median endpoint
app.get("/api/median/:zip", async (req, res) => {
  const zip = req.params.zip;
  const key = process.env.CENSUS_API_KEY;
  const url = new URL("https://api.census.gov/data/2022/acs/acs5/subject");
  url.searchParams.set("get", "NAME,S2503_C02_001E");
  url.searchParams.set("for", `zip code tabulation area:${zip}`);
  url.searchParams.set("key", key);

  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Status ${r.status}`);
    const data = await r.json();
    const median = data[1]?.[1];
    if (!median) throw new Error("No median in response");
    res.json({ zip, median: Number(median) });
  } catch (e) {
    console.error("Census fetch error:", e);
    res.status(500).json({ error: e.message });
  }
});

// 7) AI + chart-data endpoint
app.post("/api/ask", async (req, res) => {
  const { zip, price, prompt } = req.body;

  if (!zip || !price || !prompt) {
    return res
      .status(400)
      .json({ error: "Please include `zip`, `price`, and `prompt` in your request." });
  }

  // 7a) Fetch the median price
  let median = null;
  try {
    const mRes = await fetch(`http://localhost:${process.env.PORT || 10000}/api/median/${zip}`);
    const mJson = await mRes.json();
    median = Number(mJson.median);
  } catch (e) {
    console.warn("Could not fetch median:", e);
  }

  // 7b) System message uses median if available
  const systemMsg = median
    ? `You are a real-estate assistant. The ZIP code ${zip} has a median sale price of $${median.toLocaleString()}.`
    : "You are a real-estate assistant.";

  try {
    // 7c) Ask OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemMsg },
        { role: "user",   content: `ZIP: ${zip}\nDetails: ${prompt}` },
      ],
    });
    const answer = completion.choices[0]?.message?.content || "";

    // 7d) Return both the text answer and the chart data
    res.json({
      answer,
      charts: {
        prices: [ median ?? 0, Number(price) ]
      }
    });

  } catch (err) {
    console.error("AI error:", err);
    res.status(500).json({ error: "OpenAI request failed." });
  }
});

// 8) All other GETs should return your frontend's index.html
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// 9) Start the server
const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});