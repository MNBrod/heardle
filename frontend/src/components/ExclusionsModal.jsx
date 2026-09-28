import React, { useEffect, useState } from "react";
import { fetchExclusions, saveExclusions } from "../services/api";

export default function ExclusionsModal({ onClose }) {
  const [patterns, setPatterns] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const applyResponse = (data) => {
    setPatterns(data.patterns);
    setCounts(data.counts || {});
  };

  useEffect(() => {
    fetchExclusions()
      .then(applyResponse)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const updatePattern = (index, value) => {
    setSaved(false);
    setPatterns((prev) => prev.map((pattern, i) => (i === index ? value : pattern)));
  };

  const removePattern = (index) => {
    setSaved(false);
    setPatterns((prev) => prev.filter((_, i) => i !== index));
  };

  const addPattern = () => {
    setSaved(false);
    setPatterns((prev) => [...prev, ""]);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      applyResponse(await saveExclusions(patterns));
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold">Excluded songs</h2>
        <p className="mt-1 text-sm text-slate-400">
          Songs whose title contains any of these strings (ignoring case) are left out of the game.
        </p>

        {loading ? <p className="mt-4">Loading...</p> : null}

        {!loading ? (
          <div className="mt-4 flex max-h-80 flex-col gap-2 overflow-y-auto">
            {patterns.length === 0 ? (
              <p className="text-sm text-slate-400">No exclusions yet.</p>
            ) : null}
            {patterns.map((pattern, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  value={pattern}
                  onChange={(e) => updatePattern(index, e.target.value)}
                  placeholder="e.g. [mono]"
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                />
                <span className="w-20 text-right text-xs text-slate-400">
                  {counts[pattern] !== undefined ? `${counts[pattern]} songs` : ""}
                </span>
                <button
                  onClick={() => removePattern(index)}
                  className="rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700"
                  aria-label={`Remove ${pattern || "entry"}`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
        {saved ? <p className="mt-3 text-sm text-green-400">Saved.</p> : null}

        <div className="mt-4 flex gap-3">
          <button
            onClick={addPattern}
            disabled={loading}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
          >
            Add entry
          </button>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
