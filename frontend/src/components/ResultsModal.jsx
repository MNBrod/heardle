import React from "react";

export default function ResultsModal({ session, song, onPlayAgain }) {
  if (!session || !session.completed) return null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
      <h2 className="text-xl font-semibold">
        {session.won ? "You got it!" : "Nice try"}
      </h2>
      {song ? (
        <p className="mt-2 text-sm text-slate-300">
          Answer: <span className="font-medium">{song.title}</span> — {song.artist}
        </p>
      ) : null}
      <div className="mt-4 flex gap-3">
        <button
          onClick={onPlayAgain}
          className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
        >
          Play again
        </button>
      </div>
    </div>
  );
}