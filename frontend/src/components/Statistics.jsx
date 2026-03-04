import React from "react";
import { getStats, resetStats } from "../utils/localStorage";

export default function Statistics() {
  const stats = getStats();

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Statistics</h3>
        <button
          onClick={() => resetStats()}
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          Reset
        </button>
      </div>
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
    </div>
  );
}