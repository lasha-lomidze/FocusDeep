const API_BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  bootstrap: () => request("/bootstrap"),

  addGroup: (name, color) =>
    request("/groups", { method: "POST", body: JSON.stringify({ name, color }) }),

  updateGroup: (g) =>
    request(`/groups/${g.id}`, { method: "PUT", body: JSON.stringify(g) }),

  deleteGroup: (id) =>
    request(`/groups/${id}`, { method: "DELETE" }),

  restoreGroup: (g) =>
    request("/groups/restore", { method: "POST", body: JSON.stringify(g) }),

  addCategory: (name, color, groupId) =>
    request("/categories", { method: "POST", body: JSON.stringify({ name, color, groupId }) }),

  updateCategory: (cat) =>
    request(`/categories/${cat.id}`, { method: "PUT", body: JSON.stringify(cat) }),

  deleteCategory: (id) =>
    request(`/categories/${id}`, { method: "DELETE" }),

  restoreCategory: (cat) =>
    request("/categories/restore", { method: "POST", body: JSON.stringify(cat) }),

  addManualSession: (categoryId, startISO, endISO, note) =>
    request("/sessions", { method: "POST", body: JSON.stringify({ categoryId, startISO, endISO, note }) }),

  saveEditedSession: (session) =>
    request(`/sessions/${session.id}`, { method: "PUT", body: JSON.stringify(session) }),

  deleteSession: (id) =>
    request(`/sessions/${id}`, { method: "DELETE" }),

  restoreSession: (session) =>
    request("/sessions/restore", { method: "POST", body: JSON.stringify(session) }),

  startTimer: (categoryId) =>
    request("/running/start", { method: "POST", body: JSON.stringify({ categoryId }) }),

  changeRunningCategory: (categoryId) =>
    request("/running/category", { method: "PUT", body: JSON.stringify({ categoryId }) }),

  stopTimer: (note = "") =>
    request("/running/stop", { method: "POST", body: JSON.stringify({ note }) }),

  updateSettings: (settings) =>
    request("/settings", { method: "PUT", body: JSON.stringify(settings) }),
};
