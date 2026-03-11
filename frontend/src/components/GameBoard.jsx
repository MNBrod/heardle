import React, { useState } from "react";
import AudioPlayer from "./AudioPlayer";
import GuessGrid from "./GuessGrid";
import SearchInput from "./SearchInput";
import { fetchHint } from "../services/api";

export default function GameBoard({ session, onGuess, onSkip }) {
  const [hint, setHint] = useState(null);
  const [hintLoading, setHintLoading] = useState(false);

  if (!session) return null;
  const snippetIndex = session.currentSnippetIndex ?? 0;
  const snippetUrl = `/api/audio/${session.sessionId}/snippet/${snippetIndex}`;
  const hintAvailable = session.attempts >= session.hintAfterAttempts;

  async function handleHint() {
    if (hint || hintLoading) return;
    setHintLoading(true);
    try {
      const data = await fetchHint(session.sessionId);
      setHint(data);
    } finally {
      setHintLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Attempts</p>
          <p className="text-lg font-semibold">
            {session.attempts} / {session.maxAttempts}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleHint}
            disabled={!hintAvailable || !!hint || hintLoading}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {hintLoading ? "…" : "Hint"}
          </button>
          <button
            onClick={onSkip}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
          >
            Skip
          </button>
        </div>
      </div>

      {hint && (
        <div className="flex items-center gap-4 rounded-xl border border-slate-700 bg-slate-900/60 p-4">
          <img
            src={`/api/audio/${session.sessionId}/art`}
            alt="Album cover hint"
            className="h-20 w-20 rounded-lg object-cover"
            onError={(e) => { e.target.style.display = "none"; }}
          />
          {hint.year && (
            <p className="text-slate-300">
              Released: <span className="font-semibold text-white">{hint.year}</span>
            </p>
          )}
        </div>
      )}

      <AudioPlayer src={snippetUrl} />

      <GuessGrid session={session} />

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <p className="mb-2 text-sm text-slate-400">Make a guess</p>
        <SearchInput
          onSelect={(song) => onGuess(`${song.artist} - ${song.title}`, song.id)}
        />
      </div>
    </div>
  );
}