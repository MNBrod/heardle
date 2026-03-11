import React from "react";

const RESULT_STYLES = {
  correct: "border-green-600 bg-green-600/20 text-green-200",
  album: "border-yellow-500 bg-yellow-500/20 text-yellow-200",
  wrong: "border-red-700 bg-red-700/20 text-red-300",
};

export default function GuessGrid({ session }) {
  const slots = Array.from({ length: session.maxAttempts }, (_, i) => session.guesses[i] ?? null);

  return (
    <div className="space-y-2">
      {slots.map((guess, i) => (
        <div
          key={i}
          className={`rounded-lg border px-3 py-2 text-sm ${
            guess
              ? RESULT_STYLES[guess.result]
              : "border-slate-700 bg-slate-900/40 text-slate-600"
          }`}
        >
          {guess ? guess.text : <span>—</span>}
        </div>
      ))}
    </div>
  );
}
