const express = require("express");
const { parseFile } = require("music-metadata");
const libraryService = require("../services/libraryService");

const router = express.Router();

router.get("/art/:songId", async (req, res) => {
  const song = libraryService.getSongById(req.params.songId);
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

router.get("/songs", (req, res) => {
  const filters = {
    artist: req.query.artist,
    album: req.query.album,
    genre: req.query.genre,
    decade: req.query.decade,
  };
  res.json(libraryService.getSongs(filters));
});

router.get("/search", (req, res) => {
  const query = req.query.q || "";
  res.json(libraryService.searchSongs(query));
});

router.get("/artists", (req, res) => {
  res.json(libraryService.getArtists());
});

router.get("/albums", (req, res) => {
  res.json(libraryService.getAlbums());
});

module.exports = router;