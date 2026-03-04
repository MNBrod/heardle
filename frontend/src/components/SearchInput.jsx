import React, { useEffect, useState } from "react";
import { searchSongs } from "../services/api";

export default function SearchInput({ onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    let active = true;
    if (!query) {
      setResults([]);
      return;
    }
    searchSongs(query).then((data) => {
      if (active) setResults(data.slice(0, 8));
    });
    return () => {
      active = false;
    };
  }, [query]);

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search artist or song"
        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
      />
      {results.length > 0 ? (
        <div className="absolute z-10 mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 shadow-xl">
          {results.map((song) => (
            <button
              key={song.id}
              onClick={() => {
                onSelect(song);
                setQuery("");
                setResults([]);
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-900"
            >
              <span className="font-medium">{song.title}</span>
              <span className="text-slate-400"> — {song.artist}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}