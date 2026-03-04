const STORAGE_KEY = "heardle-stats";

const defaultStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  guessDistribution: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    fail: 0,
  },
  lastPlayed: null,
};

export function getStats() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...defaultStats };
  try {
    return { ...defaultStats, ...JSON.parse(raw) };
  } catch {
    return { ...defaultStats };
  }
}

export function saveStats(stats) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

export function resetStats() {
  window.localStorage.removeItem(STORAGE_KEY);
}