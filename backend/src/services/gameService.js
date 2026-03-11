const { v4: uuid } = require("uuid");
const { format } = require("date-fns");
const { getConfig } = require("../config/config");
const libraryService = require("./libraryService");

const sessions = new Map();

function normalizedGuess(guess) {
  return (guess || "").toString().trim().toLowerCase();
}

function selectDailySong(date, songs) {
  const dateStr = format(date, "yyyy-MM-dd");
  let hash = 0;
  for (let i = 0; i < dateStr.length; i += 1) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) % 1000000007;
  }
  const index = songs.length ? hash % songs.length : 0;
  return songs[index] || null;
}

function createSession(song) {
  const config = getConfig();
  return {
    sessionId: uuid(),
    songId: song.id,
    attempts: 0,
    maxAttempts: config.game.maxAttempts,
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

  session.attempts += 1;
  session.guesses.push(guess || guessSongId || "");
  session.currentSnippetIndex = Math.min(
    session.attempts,
    session.maxAttempts - 1
  );

  if (correct) {
    session.completed = true;
    session.won = true;
  } else if (session.attempts >= session.maxAttempts) {
    session.completed = true;
  }

  return session;
}

function skip(sessionId) {
  const session = sessions.get(sessionId);
  if (!session || session.completed) return session;
  const config = getConfig();
  if (!config.game.allowSkips) return session;

  session.attempts += 1;
  session.currentSnippetIndex = Math.min(
    session.attempts,
    session.maxAttempts - 1
  );
  if (session.attempts >= session.maxAttempts) {
    session.completed = true;
  }
  return session;
}

function reveal(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  session.completed = true;
  session.won = false;
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