const fs = require("fs");
const path = require("path");

// Kept out of config.json so stats can live on their own Docker volume.
const statsPath = path.join(__dirname, "..", "..", "data", "stats.json");

const GUESS_KEYS = ["1", "2", "3", "4", "5", "6", "fail"];
const COUNTER_KEYS = ["gamesPlayed", "gamesWon", "currentStreak", "maxStreak"];

function defaultStats() {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: Object.fromEntries(GUESS_KEYS.map((key) => [key, 0])),
    lastPlayed: null,
  };
}

let stats = load();

function load() {
  if (!fs.existsSync(statsPath)) return defaultStats();
  try {
    const parsed = JSON.parse(fs.readFileSync(statsPath, "utf8"));
    return { ...defaultStats(), ...parsed, guessDistribution: { ...defaultStats().guessDistribution, ...parsed.guessDistribution } };
  } catch (error) {
    console.error("Failed to read stats file, starting from zero:", error.message);
    return defaultStats();
  }
}

function persist() {
  fs.mkdirSync(path.dirname(statsPath), { recursive: true });
  // Write then rename so a crash mid-write can't leave a truncated file.
  const tmpPath = `${statsPath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(stats, null, 2));
  fs.renameSync(tmpPath, statsPath);
}

function getStats() {
  return stats;
}

function recordResult(session) {
  stats.gamesPlayed += 1;
  if (session.won) {
    stats.gamesWon += 1;
    stats.currentStreak += 1;
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
    const attempt = String(Math.min(session.attempts, 6));
    stats.guessDistribution[attempt] += 1;
  } else {
    stats.currentStreak = 0;
    stats.guessDistribution.fail += 1;
  }
  stats.lastPlayed = new Date().toISOString().slice(0, 10);
  persist();
}

function isCount(value) {
  return Number.isInteger(value) && value >= 0;
}

// Returns an error message, or null if the stats are valid.
function validateStats(candidate) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return "stats must be an object";
  }
  for (const key of COUNTER_KEYS) {
    if (!isCount(candidate[key])) return `${key} must be a non-negative integer`;
  }
  const distribution = candidate.guessDistribution ?? {};
  if (typeof distribution !== "object" || Array.isArray(distribution)) {
    return "guessDistribution must be an object";
  }
  for (const [key, value] of Object.entries(distribution)) {
    if (!GUESS_KEYS.includes(key)) return `guessDistribution has unknown key "${key}"`;
    if (!isCount(value)) return `guessDistribution.${key} must be a non-negative integer`;
  }
  if (candidate.gamesWon > candidate.gamesPlayed) return "gamesWon cannot exceed gamesPlayed";
  if (candidate.currentStreak > candidate.maxStreak) return "currentStreak cannot exceed maxStreak";
  const lastPlayed = candidate.lastPlayed ?? null;
  if (lastPlayed !== null && !/^\d{4}-\d{2}-\d{2}$/.test(lastPlayed)) {
    return "lastPlayed must be null or a YYYY-MM-DD date";
  }
  return null;
}

function replaceStats(candidate) {
  const base = defaultStats();
  stats = {
    ...Object.fromEntries(COUNTER_KEYS.map((key) => [key, candidate[key]])),
    guessDistribution: { ...base.guessDistribution, ...candidate.guessDistribution },
    lastPlayed: candidate.lastPlayed ?? null,
  };
  persist();
  return stats;
}

function resetStats() {
  stats = defaultStats();
  persist();
  return stats;
}

module.exports = {
  getStats,
  recordResult,
  validateStats,
  replaceStats,
  resetStats,
};
