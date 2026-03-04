const express = require("express");
const audioService = require("../services/audioService");
const gameService = require("../services/gameService");
const libraryService = require("../services/libraryService");

const router = express.Router();

router.get("/:sessionId/snippet/:index", (req, res, next) => {
  const { sessionId, index } = req.params;
  const session = gameService.getSession(sessionId);
  if (!session) return res.status(404).json({ error: "Session not found" });

  const song = libraryService.getSongById(session.songId);
  if (!song) return res.status(404).json({ error: "Song not found" });

  try {
    const { stream, contentType } = audioService.getSnippetStream(
      song.filePath,
      Number(index)
    );
    res.setHeader("Content-Type", contentType);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
});

router.get("/:songId/full", (req, res, next) => {
  const song = libraryService.getSongById(req.params.songId);
  if (!song) return res.status(404).json({ error: "Song not found" });

  try {
    const range = req.headers.range;
    const { status, headers, stream } = audioService.getRangeStream(
      song.filePath,
      range
    );
    res.writeHead(status, headers);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
});

module.exports = router;