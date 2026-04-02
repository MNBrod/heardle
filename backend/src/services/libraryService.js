const fs = require("fs");
const path = require("path");
const { parseFile } = require("music-metadata");
const { createHash } = require("crypto");
const { getConfig } = require("../config/config");

let songs = [];
let songMap = new Map();

function normalize(value) {
  return (value || "").toString().trim();
}

function buildId(filePath) {
  return createHash("sha1").update(filePath).digest("hex");
}

async function scanDirectory(root, supportedFormats) {
  const entries = await fs.promises.readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await scanDirectory(fullPath, supportedFormats)));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).replace(".", "").toLowerCase();
      if (supportedFormats.includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

function fallbackFromPath(filePath, organizationStructure) {
  const parts = filePath.split(path.sep);
  const filename = path.basename(filePath, path.extname(filePath));
  if (organizationStructure === "artist/album" && parts.length >= 3) {
    const album = parts[parts.length - 2];
    const artist = parts[parts.length - 3];
    return { artist, album, title: filename };
  }
  return { artist: "Unknown Artist", album: "Unknown Album", title: filename };
}

async function loadLibrary() {
  const config = getConfig();
  const libraryPath = config.audio.libraryPath;
  if (!libraryPath || !fs.existsSync(libraryPath)) {
    console.warn("Library path does not exist:", libraryPath);
    songs = [];
    songMap = new Map();
    return songs;
  }

  const files = await scanDirectory(libraryPath, config.audio.supportedFormats);
  const loadedSongs = [];

  for (const filePath of files) {
    let metadata = {};
    try {
      metadata = await parseFile(filePath, { duration: true });
    } catch (error) {
      metadata = {};
    }

    const fallback = fallbackFromPath(filePath, config.audio.organizationStructure);
    const common = metadata.common || {};
    const format = metadata.format || {};

    const song = {
      id: buildId(filePath),
      artist: normalize(common.artist) || fallback.artist,
      album: normalize(common.album) || fallback.album,
      title: normalize(common.title) || fallback.title,
      filePath,
      duration: format.duration || 0,
      year: common.year || null,
      genre: Array.isArray(common.genre) ? common.genre[0] : common.genre || null,
      track: common.track ? common.track.no : null,
    };

    loadedSongs.push(song);
  }

  const excludePatterns = config.library?.excludeTitleContaining ?? [];
  songs = loadedSongs.filter((song) =>
    excludePatterns.every((pattern) => !song.title.toLowerCase().includes(pattern.toLowerCase()))
  );
  songMap = new Map(songs.map((song) => [song.id, song]));
  return songs;
}

function getSongs(filters = {}) {
  return songs.filter((song) => {
    if (filters.artist && song.artist !== filters.artist) return false;
    if (filters.album && song.album !== filters.album) return false;
    if (filters.genre && song.genre !== filters.genre) return false;
    if (filters.decade) {
      const decadeStart = Number(filters.decade);
      if (!song.year || song.year < decadeStart || song.year >= decadeStart + 10) {
        return false;
      }
    }
    return true;
  });
}

function searchSongs(query) {
  const q = normalize(query).toLowerCase();
  if (!q) return [];
  const matches = songs.filter((song) => {
    return (
      song.title.toLowerCase().includes(q) ||
      song.artist.toLowerCase().includes(q) ||
      song.album.toLowerCase().includes(q)
    );
  });
  const seen = new Set();
  return matches.filter((song) => {
    const key = `${normalize(song.artist).toLowerCase()}|${normalize(song.title).toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getSongById(songId) {
  return songMap.get(songId);
}

function getArtists() {
  return Array.from(new Set(songs.map((song) => song.artist))).sort();
}

function getAlbums() {
  return Array.from(new Set(songs.map((song) => song.album))).sort();
}

module.exports = {
  loadLibrary,
  getSongs,
  searchSongs,
  getSongById,
  getArtists,
  getAlbums,
};