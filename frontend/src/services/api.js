const API_BASE = "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }
  return response.json();
}

export function fetchDailyGame() {
  return request("/game/daily");
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