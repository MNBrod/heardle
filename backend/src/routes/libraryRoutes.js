const express = require("express");
const libraryService = require("../services/libraryService");

const router = express.Router();

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