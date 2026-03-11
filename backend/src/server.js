require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const { getConfig, watchConfig } = require("./config/config");
const libraryService = require("./services/libraryService");
const gameRoutes = require("./routes/gameRoutes");
const audioRoutes = require("./routes/audioRoutes");
const libraryRoutes = require("./routes/libraryRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const config = getConfig();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/game", gameRoutes);
app.use("/api/audio", audioRoutes);
app.use("/api/library", libraryRoutes);

const staticPath = path.join(__dirname, "..", "..", "frontend", "dist");
app.use("/heardle", express.static(staticPath));
app.get("/heardle/*", (_req, res) => {
  res.sendFile(path.join(staticPath, "index.html"));
});

app.use(errorHandler);

function checkFfmpeg() {
  return new Promise((resolve) => {
    const { exec } = require("child_process");
    exec("ffmpeg -version", (err) => {
      if (err) {
        console.error("ffmpeg not found. Audio snippet generation will fail. Install ffmpeg and ensure it is in PATH.");
      } else {
        console.log("ffmpeg OK");
      }
      resolve();
    });
  });
}

async function start() {
  await checkFfmpeg();
  await libraryService.loadLibrary();
  watchConfig();

  const port = config.server.port || 3000;
  const host = config.server.host || "localhost";
  app.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}`);
  });
}

start();