import React, { useState } from "react";
import GameBoard from "./components/GameBoard";
import ResultsModal from "./components/ResultsModal";
import Statistics from "./components/Statistics";
import { useGame } from "./hooks/useGame";

export default function App() {
  const [mode, setMode] = useState("daily");
  const {
    session,
    song,
    loading,
    error,
    startGame,
    handleGuess,
    handleSkip,
  } = useGame(mode);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Heardle Clone</h1>
          <p className="text-slate-400">Guess the song from short audio snippets.</p>
        </header>

        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setMode("daily")}
            className={`rounded-lg px-3 py-2 text-sm ${
              mode === "daily" ? "bg-indigo-500" : "bg-slate-900"
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setMode("practice")}
            className={`rounded-lg px-3 py-2 text-sm ${
              mode === "practice" ? "bg-indigo-500" : "bg-slate-900"
            }`}
          >
            Practice
          </button>
        </div>

        {loading ? <p>Loading game...</p> : null}
        {error ? <p className="text-red-400">{error}</p> : null}

        {!loading && session ? (
          <GameBoard session={session} onGuess={handleGuess} onSkip={handleSkip} />
        ) : null}

        <div className="mt-6">
          <ResultsModal
            session={session}
            song={song}
            onPlayAgain={startGame}
          />
        </div>

        <div className="mt-8">
          <Statistics />
        </div>
      </div>
    </div>
  );
}