// backend/server.js
// 1) Imports + ESM __dirname shim
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { OpenAI } from "openai";

import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

dotenv.config();

// 2) App + middleware
const app = express();
app.use(cors());
app.use(express.json());
// Serve your built frontend (including real.mp4 in /frontend)
app.use(express.static(path.join(__dirname, "../frontend")));

// 3) Validate keys
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ Missing OPENAI_API_KEY"); process.exit(1);
}
if (!process.env.CENSUS_API_KEY) {
  console.error("❌ Missing CENSUS_API_KEY"); process.exit(1);
}

// 4) OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 5) Health-check
app.get("/api/test", (_req, res) => {
  res.json({ ok: true, msg: "Backend is live!" });
});

// 6) Median endpoint (B25077_001E from acs5 summary)
app.get("/api/median/:zip", async (req, res) => {
  const zip = req.params.zip;
  const url = new URL("https://api.census.gov/data/2022/acs/acs5");
  url.searchParams.set("get", "NAME,B25077_001E");                // B25077_001E = Median home value
  url.searchParams.set("for", `zip code tabulation area:${zip}`);
  url.searchParams.set("key", process.env.CENSUS_API_KEY);

  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Census ${r.status}`);
    const data = await r.json();
    console.log("Census raw:", data);
    const medianRaw = data[1]?.[1];
    const median = medianRaw ? Number(medianRaw) : null;
    if (!median) throw new Error("No median returned");
    res.json({ zip, median });
  } catch (e) {
    console.error("⚠️  Census error:", e);
    res.status(500).json({ error: e.message });
  }
});

// 7) AI + chart data endpoint
app.post("/api/ask", async (req, res) => {
  const { zip, prompt, price } = req.body;
  if (!zip || !prompt || price == null) {
    return res.status(400).json({
      error: "Please include `zip`, `prompt`, and `price` in request body."
    });
  }

  // 7a) fetch median
  let median = null;
  try {
    const mRes = await fetch(`http://localhost:${process.env.PORT||10000}/api/median/${zip}`);
    const mJson = await mRes.json();
    median = mJson.median;
  } catch (e) {
    console.warn("Could not fetch median, proceeding without it:", e);
  }

  // 7b) build system message
  const systemMsg = median
    ? `You are a real-estate AI. ZIP ${zip} has a median home value of $${median.toLocaleString()}.`
    : "You are a real-estate AI.";

  try {
    // 7c) call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemMsg },
        { role: "user", content: `ZIP: ${zip}\nAsking: ${prompt}\nMy Price: $${price}` }
      ],
    });
    const answer = completion.choices[0]?.message?.content || "";

    // 7d) return both answer + prices array for charting
    res.json({
      answer,
      prices: [
        { label: "Median", value: median || 0 },
        { label: "You",    value: Number(price) }
      ]
    });
  } catch (err) {
    console.error("❌ AI error:", err);
    res.status(500).json({ error: "OpenAI request failed." });
  }
});

// 8) All other GETs → index.html
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// 9) Start
const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});