import express from "express";
import cors from "cors";
import pkg from "pg";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Neon connection string comes from an environment variable.
// NEVER hardcode it here — set it in Render's dashboard as DATABASE_URL.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ------------------------------------------------------------------
// Simple username/password lock (HTTP Basic Auth).
// Set AUTH_USER and AUTH_PASS as environment variables in Render.
// If either is unset, auth is skipped (useful for local dev only).
// ------------------------------------------------------------------
app.use((req, res, next) => {
  const { AUTH_USER, AUTH_PASS } = process.env;
  if (!AUTH_USER || !AUTH_PASS) return next(); // no lock configured

  const header = req.headers.authorization || "";
  const [scheme, encoded] = header.split(" ");

  if (scheme === "Basic" && encoded) {
    const decoded = Buffer.from(encoded, "base64").toString("utf-8");
    const [user, pass] = decoded.split(":");
    if (user === AUTH_USER && pass === AUTH_PASS) {
      return next();
    }
  }

  res.set("WWW-Authenticate", 'Basic realm="Tayseer Control Room"');
  res.status(401).send("Authentication required.");
});

// ------------------------------------------------------------------
// GET the current shared scenario. Creates a default row if none exists yet.
// ------------------------------------------------------------------
app.get("/api/scenario", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT data, updated_at FROM scenarios WHERE name = $1 LIMIT 1",
      ["default"]
    );

    if (result.rows.length === 0) {
      return res.json({ data: null, updated_at: null });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("GET /api/scenario error:", err);
    res.status(500).json({ error: "Failed to load scenario" });
  }
});

// ------------------------------------------------------------------
// POST (save) the current shared scenario. Upserts the single "default" row.
// ------------------------------------------------------------------
app.post("/api/scenario", async (req, res) => {
  try {
    const data = req.body;

    if (!data || typeof data !== "object") {
      return res.status(400).json({ error: "Invalid data payload" });
    }

    const existing = await pool.query(
      "SELECT id FROM scenarios WHERE name = $1 LIMIT 1",
      ["default"]
    );

    if (existing.rows.length === 0) {
      await pool.query(
        "INSERT INTO scenarios (name, data, updated_at) VALUES ($1, $2, now())",
        ["default", data]
      );
    } else {
      await pool.query(
        "UPDATE scenarios SET data = $1, updated_at = now() WHERE name = $2",
        [data, "default"]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("POST /api/scenario error:", err);
    res.status(500).json({ error: "Failed to save scenario" });
  }
});

// ------------------------------------------------------------------
// Serve the built frontend (after `npm run build`)
// ------------------------------------------------------------------
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
