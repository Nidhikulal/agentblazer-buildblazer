require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const sanitizeInput = require("./middleware/sanitize");

const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const teamRoutes = require("./routes/teamRoutes");
const galleryRoutes = require("./routes/galleryRoutes");
const memberRoutes = require("./routes/memberRoutes");
const contactRoutes = require("./routes/contactRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const statsRoutes = require("./routes/statsRoutes");

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Useful for Vercel previews. In production, set FRONTEND_URL
      // to the exact frontend URL(s) you want to allow.
      if (process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }

      return callback(new Error("CORS: origin not allowed"));
    },
    credentials: true
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeInput);

app.get("/", (req, res) => {
  res.json({
    name: "AgentBlazer Club API",
    status: "running",
    version: "1.0.0",
    api: "/api"
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "agentblazer-backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/stats", statsRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: "API route not found",
    path: req.originalUrl
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "production" ? undefined : err.message
  });
});

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`AgentBlazer backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = app;
