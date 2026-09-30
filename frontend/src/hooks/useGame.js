import { useCallback, useEffect, useState } from "react";
import {
  fetchDailyGame,
  fetchPracticeGame,
  submitGuess,
  skipGuess,
  revealAnswer,
} from "../services/api";

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
    }
  };

  const handleSkip = async () => {
    if (!session) return;
    const updated = await skipGuess(session.sessionId);
    setSession(updated);
    if (updated.completed) {
      const reveal = await revealAnswer(session.sessionId);
      setSong(reveal.song);
    }
  };

  const handleReveal = async () => {
    if (!session) return;
    const reveal = await revealAnswer(session.sessionId);
    setSession(reveal.session);
    setSong(reveal.song);
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