// 1) Load dependencies & setup __dirname for ESM:
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { OpenAI } from "openai";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// 2) Load environment variables:
dotenv.config();

// 3) Create Express app:
const app = express();

// 4) Serve your frontend (HTML, CSS, JS, video avatar, etc.):
app.use(express.static(path.join(__dirname, "../frontend")));

// 5) Enable CORS and JSON body parsing:
app.use(cors());
app.use(express.json());

// 6) Ensure API keys are present:
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ Missing OPENAI_API_KEY");
  process.exit(1);
}
if (!process.env.CENSUS_API_KEY) {
  console.error("❌ Missing CENSUS_API_KEY");
  process.exit(1);
}

// 7) Initialize OpenAI client:
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 8) Health-check endpoint:
app.get("/api/test", (_req, res) => {
  res.json({ ok: true, msg: "Backend is live!" });
});

// 9) Census endpoint: fetch median home value for a ZIP code:
app.get("/api/median/:zip", async (req, res) => {
  const zip = req.params.zip;
  const key = process.env.CENSUS_API_KEY;
  const url = new URL("https://api.census.gov/data/2022/acs/acs5");
  url.searchParams.set("get", "NAME,B25077_001E");
  url.searchParams.set("for", `zip code tabulation area:${zip}`);
  url.searchParams.set("key", key);

  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Census status ${r.status}`);
    const data = await r.json();
    const raw = data[1]?.[1];
    if (!raw) throw new Error("No median in response");
    res.json({ zip, median: Number(raw) });
  } catch (e) {
    console.error("Census fetch error:", e);
    res.status(500).json({ error: e.message });
  }
});

// 10) AI endpoint: first get median, then call OpenAI:
app.post("/api/ask", async (req, res) => {
  const { zip, prompt } = req.body;
  if (!zip || !prompt) {
    return res
      .status(400)
      .json({ error: "Please include both `zip` and `prompt`." });
  }

  // 10a) Fetch median locally:
  let median = null;
  try {
    const mRes = await fetch(
      `http://localhost:${process.env.PORT || 10000}/api/median/${zip}`
    );
    const mJson = await mRes.json();
    median = mJson.median;
  } catch {
    /* ignore errors */
  }

  // 10b) Build the system message:
  const systemMsg = median
    ? `You are a real-estate assistant. ZIP ${zip} has a median home value of $${median}.`
    : "You are a real-estate assistant.";

  try {
    // 10c) Call OpenAI:
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemMsg },
        { role: "user",   content: `ZIP: ${zip}\nDetails: ${prompt}` },
      ],
    });
    const answer = completion.choices[0]?.message?.content || "";
    res.json({ answer });
  } catch (err) {
    console.error("AI error:", err);
    res.status(500).json({ error: "OpenAI request failed." });
  }
});

// 11) Fallback: serve index.html on all other routes:
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// 12) Start the server:
const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});