const express = require("express");
const { updateConfig } = require("../config/config");
const libraryService = require("../services/libraryService");

const router = express.Router();

const MAX_PATTERNS = 200;
const MAX_PATTERN_LENGTH = 200;

function exclusionsResponse() {
  const patterns = libraryService.getExclusionPatterns();
  return { patterns, counts: libraryService.getExclusionCounts(patterns) };
}

router.get("/exclusions", (req, res) => {
  res.json(exclusionsResponse());
});

router.put("/exclusions", (req, res) => {
  const { patterns } = req.body || {};
  if (!Array.isArray(patterns) || patterns.some((pattern) => typeof pattern !== "string")) {
    return res.status(400).json({ error: "patterns must be an array of strings" });
  }

  const cleaned = [];
  const seen = new Set();
  for (const raw of patterns) {
    const pattern = raw.trim();
    if (!pattern) continue;
    if (pattern.length > MAX_PATTERN_LENGTH) {
      return res.status(400).json({ error: `Entries must be ${MAX_PATTERN_LENGTH} characters or fewer` });
    }
    const key = pattern.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(pattern);
  }
  if (cleaned.length > MAX_PATTERNS) {
    return res.status(400).json({ error: `At most ${MAX_PATTERNS} entries are allowed` });
  }

  updateConfig({ library: { excludeTitleContaining: cleaned } });
  libraryService.applyExclusions();
  res.json(exclusionsResponse());
});

module.exports = router;
