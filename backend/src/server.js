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

async function start() {
  await libraryService.loadLibrary();
  watchConfig();

  const port = config.server.port || 3000;
  const host = config.server.host || "localhost";
  app.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}`);
  });
}

start();