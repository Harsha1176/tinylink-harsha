import express from "express";
import cors from "cors";
import { pool } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

// RANDOM CODE GENERATOR (IMPORTANT)
function generateRandomCode() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const length = 6 + Math.floor(Math.random() * 3); // 6,7,8
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Health check
app.get("/healthz", (req, res) => {
  res.json({ ok: true, version: "1.0" });
});

// Create short link
app.post("/api/links", async (req, res) => {
  try {
    const { targetUrl, code: customCode } = req.body;

    // treat empty as null
    let finalCode = (!customCode || customCode.trim() === "") ? null : customCode;

    // Validate URL
    try { new URL(targetUrl); }
    catch { return res.status(400).json({ error: "Invalid URL" }); }

    // If URL already shortened → return same code
    const existing = await pool.query(
      "SELECT code FROM links WHERE target_url=$1 LIMIT 1",
      [targetUrl]
    );
    if (existing.rows.length > 0) {
      return res.json({
        success: true,
        code: existing.rows[0].code,
        shortUrl: `${req.protocol}://${req.get("host")}/${existing.rows[0].code}`,
        message: "Already shortened"
      });
    }

    const MAX_RETRIES = 5;
    let attempts = 0;

    while (attempts < MAX_RETRIES) {
      if (!finalCode) {
        finalCode = generateRandomCode();
      }

      try {
        await pool.query(
          "INSERT INTO links (code, target_url) VALUES ($1, $2)",
          [finalCode, targetUrl]
        );

        return res.json({
          success: true,
          code: finalCode,
          shortUrl: `${req.protocol}://${req.get("host")}/${finalCode}`
        });

      } catch (err) {
        if (err.code === "23505") {
          if (customCode) {
            return res.status(409).json({ error: "Custom code already exists" });
          }
          finalCode = null;
          attempts++;
        } else {
          console.error(err);
          return res.status(500).json({ error: "Server error" });
        }
      }
    }

    return res.status(500).json({ error: "Failed to generate unique code" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all links
app.get("/api/links", async (req, res) => {
  const result = await pool.query("SELECT * FROM links ORDER BY code");
  res.json(result.rows);
});

// Link details
app.get("/api/links/:code", async (req, res) => {
  const { code } = req.params;
  const result = await pool.query("SELECT * FROM links WHERE code=$1", [code]);

  if (!result.rows.length) return res.status(404).json({ error: "Not found" });

  res.json(result.rows[0]);
});

// Delete link
app.delete("/api/links/:code", async (req, res) => {
  const { code } = req.params;
  await pool.query("DELETE FROM links WHERE code=$1", [code]);
  res.json({ success: true });
});

// Redirect
app.get("/:code", async (req, res) => {
  const { code } = req.params;

  const result = await pool.query("SELECT * FROM links WHERE code=$1", [code]);
  if (!result.rows.length) return res.sendStatus(404);

  const link = result.rows[0];

  await pool.query(
    "UPDATE links SET clicks = clicks + 1, last_clicked = NOW() WHERE code=$1",
    [code]
  );

  res.redirect(302, link.target_url);
});

// Start server
app.listen(process.env.PORT || 5000, () =>
  console.log(`Server running`)
);
