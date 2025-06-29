// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { OpenAI } from "openai";

// __dirname shim for ESM
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

dotenv.config();

const app = express();

// 1) Serve frontend assets
app.use(express.static(path.join(__dirname, "../frontend")));

// 2) CORS + JSON
app.use(cors());
app.use(express.json());

// 3) Ensure keys
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ Missing OPENAI_API_KEY");
  process.exit(1);
}
if (!process.env.CENSUS_API_KEY) {
  console.error("❌ Missing CENSUS_API_KEY");
  process.exit(1);
}

// 4) Init OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 5) Health-check
app.get("/api/test", (_req, res) => {
  res.json({ ok: true, msg: "Backend is live!" });
});

// 6) Median endpoint
app.get("/api/median/:zip", async (req, res) => {
  const zip = req.params.zip;
  const key = process.env.CENSUS_API_KEY;

  const url = new URL("https://api.census.gov/data/2022/acs/acs5/subject");
  url.searchParams.set("get", "NAME,S2503_C02_001E");            // S2503_C02_001E = Median Sales Price
  url.searchParams.set("for", `zip code tabulation area:${zip}`);
  url.searchParams.set("key", key);

  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Census ${r.status}`);
    const data = await r.json();
    const median = Number(data[1]?.[1] ?? 0);
    res.json({ zip, median });
  } catch (e) {
    console.error("Census error:", e);
    res.status(500).json({ error: e.message });
  }
});

// 7) AI endpoint
app.post("/api/ask", async (req, res) => {
  const { zip, prompt, price } = req.body;

  if (!zip || !prompt || price == null) {
    return res
      .status(400)
      .json({ error: "Please include `zip`, `prompt` & `price` in body." });
  }

  // a) fetch median
  let median = null;
  try {
    const m = await fetch(`http://localhost:${process.env.PORT||10000}/api/median/${zip}`);
    const mj = await m.json();
    median = mj.median;
  } catch {
    // leave median null
  }

  // b) compose system message
  const systemMsg = median
    ? `You are a real-estate assistant. ZIP ${zip} has median sale price $${median}.`
    : "You are a real-estate assistant.";

  try {
    // c) ask OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemMsg },
        { role: "user",   content: `ZIP: ${zip}\nPrice: ${price}\nDetails: ${prompt}` },
      ],
    });

    const answer = completion.choices[0]?.message?.content || "";

    // d) reply with both answer & prices array
    res.json({
      answer,
      prices: [median ?? 0, Number(price)]
    });

  } catch (err) {
    console.error("AI error:", err);
    res.status(500).json({ error: "OpenAI request failed." });
  }
});

// 8) All other routes → index.html
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// 9) Launch
const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});