// backend/server.js

// 1) Imports + ESM __dirname shim
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import multer from "multer"; // ✅ NEW

import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ NEW: Load .env from parent dir
dotenv.config({ path: path.join(__dirname, "../.env") });

// ✅ OPTIONAL: Debug log to verify
console.log("✅ OPENAI_API_KEY:", process.env.OPENAI_API_KEY);

// 2) App + middleware
const app = express();
app.use(cors());
app.use(express.json());

// ✅ NEW: Setup Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads")); // Save to /uploads
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// ✅ Make /uploads public
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Serve your built frontend (including real.mp4 in /frontend)
app.use(express.static(path.join(__dirname, "../frontend")));

// 3) Validate keys
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ Missing OPENAI_API_KEY");
  process.exit(1);
}
if (!process.env.CENSUS_API_KEY) {
  console.error("❌ Missing CENSUS_API_KEY");
  process.exit(1);
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
    console.error("⚠️  Census error:", e);
    res.status(500).json({ error: e.message });
  }
});

// 7) AI + chart data endpoint WITH file upload!
app.post("/api/ask", upload.single("image"), async (req, res) => {
  const { zip, prompt, price } = req.body;
  if (!zip || !prompt || price == null) {
    return res.status(400).json({
      error: "Please include `zip`, `prompt`, and `price` in request body.",
    });
  }

  console.log("📸 Uploaded file info:", req.file);

  // 7a) Fetch median
  let median = null;
  try {
    const mRes = await fetch(
      `http://localhost:${process.env.PORT || 10000}/api/median/${zip}`
    );
    const mJson = await mRes.json();
    median = mJson.median;
  } catch (e) {
    console.warn("Could not fetch median, proceeding without it:", e);
  }

  // 7b) Build system message
  const systemMsg = median
    ? `You are a real-estate AI. ZIP ${zip} has a median home value of $${median.toLocaleString()}.`
    : "You are a real-estate AI.";

  try {
    // 7c) Call OpenAI for text answer
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemMsg },
        {
          role: "user",
          content: `ZIP: ${zip}\nAsking: ${prompt}\nMy Price: $${price}`,
        },
      ],
    });
    const answer = completion.choices[0]?.message?.content || "";

    // ✅ NEW: Dummy schools + crime
    const schools = [
      { name: "Lincoln High School", grades: "9-12", type: "Public" },
      { name: "Washington Elementary", grades: "K-5", type: "Charter" },
    ];
    const crime = {
      riskLevel: "Low",
      city: "Laredo",
      violentCrimeRate: "3.2 per 1,000",
      propertyCrimeRate: "15.5 per 1,000",
    };

    // ✅ NEW: If uploaded file, build URL
    let enhancedImageUrl = null;
    if (req.file) {
      // Later: Do AI enhancement here
      enhancedImageUrl = `/uploads/${req.file.filename}`;
    }

    // 7d) Return everything
    res.json({
      answer,
      prices: [
        { label: "Median", value: median || 0 },
        { label: "You", value: Number(price) },
      ],
      schools,
      crime,
      enhancedImageUrl,
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