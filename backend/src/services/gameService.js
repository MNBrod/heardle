const { v4: uuid } = require("uuid");
const { format } = require("date-fns");
const { createHash } = require("crypto");
const { getConfig } = require("../config/config");
const libraryService = require("./libraryService");
const statsService = require("./statsService");

const sessions = new Map();

function normalizedGuess(guess) {
  return (guess || "").toString().trim().toLowerCase();
}

function selectDailySong(date, songs) {
  const dateStr = format(date, "yyyy-MM-dd");
  const hashHex = createHash("sha1").update(dateStr).digest("hex");
  const index = songs.length ? parseInt(hashHex.slice(0, 8), 16) % songs.length : 0;
  return songs[index] || null;
}

function createSession(song) {
  const config = getConfig();
  return {
    sessionId: uuid(),
    songId: song.id,
    attempts: 0,
    maxAttempts: config.game.maxAttempts,
    hintAfterAttempts: config.game.hintAfterAttempts ?? 3,
    guesses: [],
    currentSnippetIndex: 0,
    startTime: new Date().toISOString(),
    completed: false,
    won: false,
  };
}

function getDailyGame(date = new Date()) {
  const songs = libraryService.getSongs();
  const dailyId = `daily-${format(date, "yyyy-MM-dd")}`;
  if (sessions.has(dailyId)) {
    return sessions.get(dailyId);
  }

  const song = selectDailySong(date, songs);
  if (!song) return null;
  const session = createSession(song);
  session.sessionId = dailyId;
  sessions.set(dailyId, session);
  return session;
}

function createPracticeGame() {
  const songs = libraryService.getSongs();
  if (!songs.length) return null;
  const song = songs[Math.floor(Math.random() * songs.length)];
  const session = createSession(song);
  sessions.set(session.sessionId, session);
  return session;
}

// Every path that ends a game goes through here so each game is counted exactly once.
function complete(session, won) {
  session.completed = true;
  session.won = won;
  statsService.recordResult(session);
}

function getSession(sessionId) {
  return sessions.get(sessionId);
}

function submitGuess(sessionId, guess, guessSongId) {
  const session = sessions.get(sessionId);
  if (!session || session.completed) return session;

  const song = libraryService.getSongById(session.songId);
  const guessedSong = guessSongId ? libraryService.getSongById(guessSongId) : null;
  const correct =
    (guessedSong &&
      normalizedGuess(guessedSong.title) === normalizedGuess(song.title) &&
      normalizedGuess(guessedSong.artist) === normalizedGuess(song.artist)) ||
    normalizedGuess(guess) === normalizedGuess(`${song.artist} - ${song.title}`) ||
    normalizedGuess(guess) === normalizedGuess(song.title);

  const albumMatch =
    !correct &&
    guessedSong &&
    normalizedGuess(guessedSong.album) === normalizedGuess(song.album);

  const displayText = guessedSong
    ? `${guessedSong.artist} – ${guessedSong.title}`
    : guess || "";

  session.attempts += 1;
  session.guesses.push({
    text: displayText,
    result: correct ? "correct" : albumMatch ? "album" : "wrong",
  });
  session.currentSnippetIndex = Math.min(
    session.attempts,
    session.maxAttempts - 1
  );

  if (correct) {
    complete(session, true);
  } else if (session.attempts >= session.maxAttempts) {
    complete(session, false);
  }

  return session;
}

function skip(sessionId) {
  const session = sessions.get(sessionId);
  if (!session || session.completed) return session;
  const config = getConfig();
  if (!config.game.allowSkips) return session;

  session.attempts += 1;
  session.guesses.push({ text: "Skipped", result: "wrong" });
  session.currentSnippetIndex = Math.min(
    session.attempts,
    session.maxAttempts - 1
  );
  if (session.attempts >= session.maxAttempts) {
    complete(session, false);
  }
  return session;
}

function reveal(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  // The frontend also calls reveal after a finished game to fetch the answer,
  // so only a game still in progress counts as given up.
  if (!session.completed) complete(session, false);
  return session;
}

module.exports = {
  getDailyGame,
  createPracticeGame,
  getSession,
  submitGuess,
  skip,
  reveal,
};