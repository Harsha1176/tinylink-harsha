import express from "express";
import cors from "cors";
import { pool } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/healthz", (req, res) => {
  res.json({ ok: true, version: "1.0" });
});

// // Create link
// app.post("/api/links", async (req, res) => {
//   try {
//     const { targetUrl, code } = req.body;

//     // Validate URL
//     try {
//       new URL(targetUrl);
//     } catch {
//       return res.status(400).json({ error: "Invalid URL" });
//     }

//     // Check if code exists
//     const exists = await pool.query("SELECT * FROM links WHERE code=$1", [code]);
//     if (exists.rows.length > 0) {
//       return res.status(409).json({ error: "Code already exists" });
//     }

//     await pool.query(
//       "INSERT INTO links (code, target_url) VALUES ($1,$2)",
//       [code, targetUrl]
//     );

//     res.json({ success: true, code });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ error: "Server error" });
//   }
// });
// Generate random short code
function generateRandomCode(length = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create link
app.post("/api/links", async (req, res) => {
  try {
    let { targetUrl, code } = req.body;

    // Validate URL
    try {
      new URL(targetUrl);
    } catch {
      return res.status(400).json({ error: "Invalid URL" });
    }

    // Prevent duplicate original URL
    const existingUrl = await pool.query(
      "SELECT code FROM links WHERE target_url=$1",
      [targetUrl]
    );

    if (existingUrl.rows.length > 0) {
      return res.json({
        success: true,
        code: existingUrl.rows[0].code,
        shortUrl: `${req.protocol}://${req.get("host")}/${existingUrl.rows[0].code}`,
        message: "URL already shortened, returning existing code"
      });
    }

    // If custom code given → ensure it's unique
    if (code) {
      const exists = await pool.query("SELECT * FROM links WHERE code=$1", [code]);
      if (exists.rows.length > 0) {
        return res.status(409).json({ error: "Custom code already exists" });
      }
    }

    // If no custom code → auto-generate code
    if (!code) {
      code = generateRandomCode(6);

      // ensure unique
      let exists = await pool.query("SELECT code FROM links WHERE code=$1", [code]);
      while (exists.rows.length > 0) {
        code = generateRandomCode(6);
        exists = await pool.query("SELECT code FROM links WHERE code=$1", [code]);
      }
    }

    // Insert link
    await pool.query(
      "INSERT INTO links (code, target_url) VALUES ($1, $2)",
      [code, targetUrl]
    );

    res.json({
      success: true,
      code,
      shortUrl: `${req.protocol}://${req.get("host")}/${code}`
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});


// Get all links
app.get("/api/links", async (req, res) => {
  const result = await pool.query("SELECT * FROM links ORDER BY code");
  res.json(result.rows);
});

// Get stats for one link
app.get("/api/links/:code", async (req, res) => {
  const { code } = req.params;
  const result = await pool.query("SELECT * FROM links WHERE code=$1", [code]);

  if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });

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
