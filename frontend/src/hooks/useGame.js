import { useCallback, useEffect, useState } from "react";
import {
  fetchDailyGame,
  fetchPracticeGame,
  submitGuess,
  skipGuess,
  revealAnswer,
} from "../services/api";
import { getStats, saveStats } from "../utils/localStorage";

export function useGame(mode = "daily") {
  const [session, setSession] = useState(null);
  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const startGame = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = mode === "practice" ? await fetchPracticeGame() : await fetchDailyGame();
      setSession(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    startGame();
  }, [startGame]);

  const handleGuess = async (guess, songId) => {
    if (!session) return;
    const updated = await submitGuess(session.sessionId, { guess, songId });
    setSession(updated);
    if (updated.completed) {
      const reveal = await revealAnswer(session.sessionId);
      setSong(reveal.song);
      updateStats(updated);
    }
  };

  const handleSkip = async () => {
    if (!session) return;
    const updated = await skipGuess(session.sessionId);
    setSession(updated);
    if (updated.completed) {
      const reveal = await revealAnswer(session.sessionId);
      setSong(reveal.song);
      updateStats(updated);
    }
  };

  const handleReveal = async () => {
    if (!session) return;
    const reveal = await revealAnswer(session.sessionId);
    setSession(reveal.session);
    setSong(reveal.song);
    updateStats(reveal.session, true);
  };

  const updateStats = (finalSession, forcedReveal = false) => {
    const stats = getStats();
    stats.gamesPlayed += 1;
    if (finalSession.won) {
      stats.gamesWon += 1;
      stats.currentStreak += 1;
      stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
      const attempt = Math.min(finalSession.attempts, 6);
      stats.guessDistribution[attempt] = (stats.guessDistribution[attempt] || 0) + 1;
    } else {
      stats.currentStreak = 0;
      stats.guessDistribution.fail += 1;
    }
    stats.lastPlayed = new Date().toISOString().slice(0, 10);
    saveStats(stats);
  };

  return {
    session,
    song,
    loading,
    error,
    startGame,
    handleGuess,
    handleSkip,
    handleReveal,
  };
}