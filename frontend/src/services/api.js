const API_BASE = "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!response.ok) {
    let message = "Request failed";
    try {
      const data = await response.json();
      message = data.error || message;
    } catch {
      const text = await response.text();
      if (text) message = text;
    }
    throw new Error(message);
  }
  return response.json();
}

export function fetchDailyGame() {
  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
  return request(`/game/daily?date=${today}`);
}

export function fetchPracticeGame() {
  return request("/game/practice");
}

export function fetchState(sessionId) {
  return request(`/game/${sessionId}/state`);
}

export function submitGuess(sessionId, payload) {
  return request(`/game/${sessionId}/guess`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function skipGuess(sessionId) {
  return request(`/game/${sessionId}/skip`, {
    method: "POST",
  });
}

export function revealAnswer(sessionId) {
  return request(`/game/${sessionId}/reveal`);
}

export function searchSongs(query) {
  return request(`/library/search?q=${encodeURIComponent(query)}`);
}

export function fetchSongs() {
  return request("/library/songs");
}

export function fetchHint(sessionId) {
  return request(`/game/${sessionId}/hint`);
}