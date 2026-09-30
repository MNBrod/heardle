import React, { useEffect, useState } from "react";
import { fetchStats, resetStats } from "../services/api";

export default function Statistics({ session }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const sessionId = session?.sessionId;
  const completed = session?.completed;

  // Refetch whenever a game starts or finishes, since the server records results.
  useEffect(() => {
    fetchStats()
      .then((data) => {
        setStats(data);
        setError(null);
      })
      .catch((err) => setError(err.message));
  }, [sessionId, completed]);

  const handleReset = async () => {
    if (!window.confirm("Reset statistics for everyone playing on this server?")) return;
    try {
      setStats(await resetStats());
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Statistics</h3>
        <button
          onClick={handleReset}
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          Reset
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      {stats ? (
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-400">Games played</p>
            <p className="text-lg font-semibold">{stats.gamesPlayed}</p>
          </div>
          <div>
            <p className="text-slate-400">Win %</p>
            <p className="text-lg font-semibold">
              {stats.gamesPlayed
                ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
                : 0}
              %
            </p>
          </div>
          <div>
            <p className="text-slate-400">Current streak</p>
            <p className="text-lg font-semibold">{stats.currentStreak}</p>
          </div>
          <div>
            <p className="text-slate-400">Max streak</p>
            <p className="text-lg font-semibold">{stats.maxStreak}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
