const express = require("express");
const { getConfig, updateConfig, BACKGROUND_COLORS } = require("../config/config");
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

const UI_TEXT_LIMITS = { title: 100, subtitle: 200 };

function uiResponse() {
  const { backgroundColor, title, subtitle } = getConfig().ui;
  return { backgroundColor, title, subtitle };
}

router.get("/ui", (req, res) => {
  res.json(uiResponse());
});

// Any subset of the fields can be sent; the rest are left unchanged.
router.patch("/ui", (req, res) => {
  const body = req.body || {};
  const unknown = Object.keys(body).filter((key) => !["backgroundColor", "title", "subtitle"].includes(key));
  if (unknown.length) {
    return res.status(400).json({ error: `Unknown fields: ${unknown.join(", ")}` });
  }

  const update = {};
  if (body.backgroundColor !== undefined) {
    if (!BACKGROUND_COLORS[body.backgroundColor]) {
      return res.status(400).json({
        error: `backgroundColor must be one of: ${Object.keys(BACKGROUND_COLORS).join(", ")}`,
      });
    }
    update.backgroundColor = body.backgroundColor;
  }
  for (const [field, maxLength] of Object.entries(UI_TEXT_LIMITS)) {
    if (body[field] === undefined) continue;
    if (typeof body[field] !== "string") {
      return res.status(400).json({ error: `${field} must be a string` });
    }
    const value = body[field].trim();
    if (field === "title" && !value) {
      return res.status(400).json({ error: "title cannot be empty" });
    }
    if (value.length > maxLength) {
      return res.status(400).json({ error: `${field} must be ${maxLength} characters or fewer` });
    }
    update[field] = value;
  }
  if (!Object.keys(update).length) {
    return res.status(400).json({ error: "Send at least one of: backgroundColor, title, subtitle" });
  }

  updateConfig({ ui: update });
  res.json(uiResponse());
});

module.exports = router;
