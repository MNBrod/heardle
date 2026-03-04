import React from "react";
import { useAudio } from "../hooks/useAudio";

export default function AudioPlayer({ src }) {
  const { audioRef } = useAudio(src);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-sm text-slate-400">Snippet preview</p>
      <audio ref={audioRef} controls className="mt-2 w-full">
        {src ? <source src={src} type="audio/mpeg" /> : null}
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}