import React from "react";
import AudioPlayer from "./AudioPlayer";
import GuessGrid from "./GuessGrid";
import SearchInput from "./SearchInput";

export default function GameBoard({ session, onGuess, onSkip }) {
  if (!session) return null;
  const snippetIndex = session.currentSnippetIndex ?? 0;
  const snippetUrl = `/api/audio/${session.sessionId}/snippet/${snippetIndex}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Attempts</p>
          <p className="text-lg font-semibold">
            {session.attempts} / {session.maxAttempts}
          </p>
        </div>
        <button
          onClick={onSkip}
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
        >
          Skip
        </button>
      </div>

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