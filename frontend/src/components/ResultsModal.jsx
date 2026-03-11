import React from "react";

export default function ResultsModal({ session, song, onPlayAgain }) {
  if (!session || !session.completed) return null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
      <h2 className="text-xl font-semibold">
        {session.won ? "You got it!" : "Nice try"}
      </h2>

      {song ? (
        <div className="mt-4 flex gap-4">
          <img
            src={`/api/library/art/${song.id}`}
            alt={`${song.album} cover`}
            className="h-24 w-24 rounded-lg object-cover"
            onError={(e) => { e.target.style.display = "none"; }}
          />
          <div className="flex flex-col justify-center">
            <p className="font-semibold text-white">{song.title}</p>
            <p className="text-sm text-slate-300">{song.artist}</p>
            <p className="text-sm text-slate-400">{song.album}{song.year ? ` · ${song.year}` : ""}</p>
          </div>
        </div>
      ) : null}

      {song ? (
        <audio controls className="mt-4 w-full">
          <source src={`/api/audio/${song.id}/full`} type="audio/mpeg" />
        </audio>
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
