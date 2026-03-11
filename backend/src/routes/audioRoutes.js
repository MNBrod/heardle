const fs = require("fs");
const express = require("express");
const { parseFile } = require("music-metadata");
const audioService = require("../services/audioService");
const gameService = require("../services/gameService");
const libraryService = require("../services/libraryService");

const router = express.Router();

router.get("/:sessionId/snippet/:index", async (req, res, next) => {
  const { sessionId, index } = req.params;
  const session = gameService.getSession(sessionId);
  if (!session) return res.status(404).json({ error: "Session not found" });

  const song = libraryService.getSongById(session.songId);
  if (!song) return res.status(404).json({ error: "Song not found" });

  if (!fs.existsSync(song.filePath)) {
    console.error(`Audio file not found on disk: ${song.filePath}`);
    return res.status(500).json({ error: "Audio file not found on disk" });
  }

  try {
    const { stream, contentType } = await audioService.getSnippetStream(
      song.filePath,
      Number(index)
    );
    res.setHeader("Content-Type", contentType);
    stream.on("error", (err) => {
      if (!res.headersSent) {
        next(err);
      } else {
        res.destroy(err);
      }
    });
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
});

router.get("/:songId/full", (req, res, next) => {
  const song = libraryService.getSongById(req.params.songId);
  if (!song) return res.status(404).json({ error: "Song not found" });

  try {
    const stream = audioService.getFullStream(song.filePath);
    res.setHeader("Content-Type", "audio/mpeg");
    stream.on("error", (err) => {
      if (!res.headersSent) {
        next(err);
      } else {
        res.destroy(err);
      }
    });
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
});

router.get("/:sessionId/art", async (req, res) => {
  const { sessionId } = req.params;
  const session = gameService.getSession(sessionId);
  if (!session) return res.status(404).json({ error: "Session not found" });

  const song = libraryService.getSongById(session.songId);
  if (!song) return res.status(404).json({ error: "Song not found" });

  try {
    const metadata = await parseFile(song.filePath, { duration: false });
    const picture = metadata.common.picture?.[0];
    if (!picture) return res.status(404).end();
    res.setHeader("Content-Type", picture.format);
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.end(picture.data);
  } catch {
    res.status(500).json({ error: "Failed to extract album art" });
  }
});

module.exports = router;