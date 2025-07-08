// ==========================================================
// backend/server.js – FULL UPDATED VERSION
// ==========================================================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";
import { createCanvas, loadImage } from "canvas";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Serve frontend and static uploads
app.use(express.static(path.join(__dirname, '../frontend')));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ API Keys check
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ Missing OPENAI_API_KEY");
  process.exit(1);
}
if (!process.env.CENSUS_API_KEY) {
  console.error("❌ Missing CENSUS_API_KEY");
  process.exit(1);
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ==========================================================
// #1 Health check
// ==========================================================
app.get("/api/test", (_req, res) => {
  res.json({ ok: true, msg: "Backend is live!" });
});

// ==========================================================
// #2 Median Census endpoint
// ==========================================================
app.get("/api/median/:zip", async (req, res) => {
  const zip = req.params.zip;
  const url = new URL("https://api.census.gov/data/2022/acs/acs5");
  url.searchParams.set("get", "NAME,B25077_001E");
  url.searchParams.set("for", `zip code tabulation area:${zip}`);
  url.searchParams.set("key", process.env.CENSUS_API_KEY);

  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Census ${r.status}`);
    const data = await r.json();
    const medianRaw = data[1]?.[1];
    const median = medianRaw ? Number(medianRaw) : null;
    if (!median) throw new Error("No median returned");
    res.json({ zip, median });
  } catch (e) {
    console.error("⚠️ Census error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ==========================================================
// #3 AI Ask endpoint
// ==========================================================
app.post("/api/ask", async (req, res) => {
  const { zip, prompt, price } = req.body;
  if (!zip || !prompt || price == null) {
    console.warn("❌ Missing required fields:", { zip, prompt, price });
    return res.status(400).json({
      error: "Please include `zip`, `prompt`, and `price` in request body."
    });
  }

  let median = null;
  try {
    const mRes = await fetch(`http://localhost:${process.env.PORT || 10000}/api/median/${zip}`);
    const mJson = await mRes.json();
    median = mJson.median;
  } catch (e) {
    console.warn("Could not fetch median, proceeding without it:", e);
  }

  const systemMsg = median
    ? `You are a real-estate AI. ZIP ${zip} has a median home value of $${median.toLocaleString()}.`
    : "You are a real-estate AI.";

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemMsg },
        { role: "user", content: `ZIP: ${zip}\nPrompt: ${prompt}\nMy Price: $${price}` }
      ],
    });
    const answer = completion.choices[0]?.message?.content || "";

    const schools = [
      { name: "Lincoln High School", grades: "9-12", type: "Public" },
      { name: "Washington Elementary", grades: "K-5", type: "Charter" }
    ];
    const crime = {
      riskLevel: "Low",
      city: "Laredo",
      violentCrimeRate: "3.2 per 1,000",
      propertyCrimeRate: "15.5 per 1,000"
    };

    res.json({
      answer,
      prices: [
        { label: "Median", value: median || 0 },
        { label: "You", value: Number(price) }
      ],
      schools,
      crime
    });

  } catch (err) {
    console.error("❌ AI error:", err);
    res.status(500).json({ error: "OpenAI request failed." });
  }
});

// ==========================================================
// #4 🆕 Headshot Overlay Route
// ==========================================================
const upload = multer({ dest: "uploads/" });

app.post("/api/overlay", upload.fields([{ name: "property" }, { name: "headshot" }]), async (req, res) => {
  const propertyPath = req.files?.property?.[0]?.path;
  const headshotPath = req.files?.headshot?.[0]?.path;

  if (!propertyPath || !headshotPath) {
    return res.status(400).json({ error: "Both images required." });
  }

  try {
    const property = await loadImage(propertyPath);
    const headshot = await loadImage(headshotPath);

    const canvas = createCanvas(property.width, property.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(property, 0, 0);

    const headshotWidth = property.width * 0.2;
    const headshotHeight = (headshotWidth / headshot.width) * headshot.height;

    ctx.drawImage(
      headshot,
      property.width - headshotWidth - 20,
      property.height - headshotHeight - 20,
      headshotWidth,
      headshotHeight
    );

    const outFile = `uploads/overlay-${Date.now()}.png`;
    const out = fs.createWriteStream(outFile);
    const stream = canvas.createPNGStream();
    stream.pipe(out);
    out.on("finish", () => {
      res.json({ url: `/uploads/${outFile.split("/").pop()}` });
      fs.unlink(propertyPath, () => {});
      fs.unlink(headshotPath, () => {});
    });

  } catch (err) {
    console.error("❌ Overlay error:", err);
    res.status(500).json({ error: "Overlay failed." });
  }
});

// ==========================================================
// #5 Fallback: serve index.html for all other GETs
// ==========================================================
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ==========================================================
// #6 Start server
// ==========================================================
const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
