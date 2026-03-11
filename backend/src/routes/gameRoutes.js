const express = require("express");
const gameService = require("../services/gameService");
const libraryService = require("../services/libraryService");

const router = express.Router();

router.get("/daily", (req, res) => {
  const dateStr = req.query.date;
  const date = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
  const session = gameService.getDailyGame(date);
  if (!session) return res.status(404).json({ error: "No songs available" });
  res.json(session);
});

router.get("/practice", (req, res) => {
  const session = gameService.createPracticeGame();
  if (!session) return res.status(404).json({ error: "No songs available" });
  res.json(session);
});

router.post("/:sessionId/guess", (req, res) => {
  const { sessionId } = req.params;
  const { guess, songId } = req.body;
  const session = gameService.submitGuess(sessionId, guess, songId);
  if (!session) return res.status(404).json({ error: "Session not found" });
  res.json(session);
});

router.post("/:sessionId/skip", (req, res) => {
  const { sessionId } = req.params;
  const session = gameService.skip(sessionId);
  if (!session) return res.status(404).json({ error: "Session not found" });
  res.json(session);
});

router.get("/:sessionId/reveal", (req, res) => {
  const { sessionId } = req.params;
  const session = gameService.reveal(sessionId);
  if (!session) return res.status(404).json({ error: "Session not found" });
  const song = libraryService.getSongById(session.songId);
  res.json({ session, song });
});

router.get("/:sessionId/state", (req, res) => {
  const { sessionId } = req.params;
  const session = gameService.getSession(sessionId);
  if (!session) return res.status(404).json({ error: "Session not found" });
  res.json(session);
});

module.exports = router;