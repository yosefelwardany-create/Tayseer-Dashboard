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
app.use(express.json({ limit: "4mb" })); // the July brief posts ~110 account lines

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
    const i = decoded.indexOf(":");
    const user = decoded.slice(0, i);
    const pass = decoded.slice(i + 1);
    if (user === AUTH_USER && pass === AUTH_PASS) return next();
  }

  res.set("WWW-Authenticate", 'Basic realm="Tayseer"');
  res.status(401).send("Authentication required.");
});

// ------------------------------------------------------------------
// Named scenarios.
//   /api/scenario            -> the control room  (name = "default")
//   /api/scenario/july2026   -> the July brief
// Any name works; each gets its own row.
// ------------------------------------------------------------------
const nameOf = (req) => {
  const raw = req.params.name || "default";
  return /^[a-z0-9_-]{1,64}$/i.test(raw) ? raw : null;
};

async function readScenario(req, res) {
  const name = nameOf(req);
  if (!name) return res.status(400).json({ error: "Invalid scenario name" });

  try {
    const result = await pool.query(
      "SELECT data, updated_at FROM scenarios WHERE name = $1 LIMIT 1",
      [name]
    );
    if (result.rows.length === 0) return res.json({ data: null, updated_at: null });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("GET /api/scenario error:", err);
    res.status(500).json({ error: "Failed to load scenario" });
  }
}

async function writeScenario(req, res) {
  const name = nameOf(req);
  if (!name) return res.status(400).json({ error: "Invalid scenario name" });

  const data = req.body;
  if (!data || typeof data !== "object") {
    return res.status(400).json({ error: "Invalid data payload" });
  }

  try {
    const existing = await pool.query(
      "SELECT id FROM scenarios WHERE name = $1 LIMIT 1",
      [name]
    );

    if (existing.rows.length === 0) {
      await pool.query(
        "INSERT INTO scenarios (name, data, updated_at) VALUES ($1, $2, now())",
        [name, data]
      );
    } else {
      await pool.query(
        "UPDATE scenarios SET data = $1, updated_at = now() WHERE name = $2",
        [data, name]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("POST /api/scenario error:", err);
    res.status(500).json({ error: "Failed to save scenario" });
  }
}

app.get("/api/scenario", readScenario);
app.post("/api/scenario", writeScenario);
app.get("/api/scenario/:name", readScenario);
app.post("/api/scenario/:name", writeScenario);

// ------------------------------------------------------------------
// Serve the built frontend (after `npm run build`)
// ------------------------------------------------------------------
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
