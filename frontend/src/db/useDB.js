import { useEffect, useState, useCallback } from "react";
import { api } from "../api/client";
import { DEFAULT_GROUP, DEFAULT_CATEGORY } from "../utils/const";

const defaultState = {
  groups: [{ id: DEFAULT_GROUP, name: "Ungrouped", color: "#94a3b8", goalHours: 0 }],
  categories: [{ id: DEFAULT_CATEGORY, name: "General", color: "#4f46e5", goalHours: 0, groupId: DEFAULT_GROUP }],
  sessions: [],
  running: null,
  settings: { globalGoalHours: 0 },
};

function createLoadedState(bootstrap) {
  return {
    loaded: true,
    groups: bootstrap.groups.length ? bootstrap.groups : defaultState.groups,
    categories: bootstrap.categories.length ? bootstrap.categories : defaultState.categories,
    sessions: bootstrap.sessions || [],
    running: bootstrap.running || null,
    settings: bootstrap.settings || defaultState.settings,
  };
}

export function useDB() {
  const [data, setData] = useState({
    loaded: false,
    groups: [],
    categories: [],
    sessions: [],
    running: null,
    settings: { globalGoalHours: 0 },
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const bootstrap = await api.bootstrap();
        if (!mounted) return;

        setData(createLoadedState(bootstrap));
      } catch (err) {
        console.error("useDB load error:", err);
        if (!mounted) return;
        setData((d) => ({ ...d, loaded: true }));
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const setLocal = useCallback((patchFn) => {
    setData((prev) => ({ ...prev, ...patchFn(prev) }));
  }, []);

  const addGroup = useCallback(async (name = "New group", color = "#60a5fa") => {
    try {
      const g = await api.addGroup(name, color);
      setLocal((prev) => ({ groups: [g, ...prev.groups] }));
      return g.id;
    } catch (e) {
      console.error("addGroup err", e);
    }
  }, [setLocal]);

  const updateGroup = useCallback(async (g) => {
    try {
      await api.updateGroup(g);
      setLocal((prev) => ({ groups: prev.groups.map((x) => (x.id === g.id ? g : x)) }));
    } catch (e) {
      console.error("updateGroup", e);
    }
  }, [setLocal]);

  const deleteGroup = useCallback(async (groupId) => {
    if (groupId === DEFAULT_GROUP) return alert("Cannot delete default group.");
    const g = data.groups.find((x) => x.id === groupId);
    if (!g) return;
    try {
      await api.deleteGroup(groupId);
      setLocal((prev) => ({
        groups: prev.groups.filter((x) => x.id !== groupId),
        categories: prev.categories.map((c) =>
          c.groupId === groupId ? { ...c, groupId: DEFAULT_GROUP } : c
        ),
      }));
      return g;
    } catch (e) {
      console.error("deleteGroup", e);
    }
  }, [data.groups, setLocal]);

  const addCategory = useCallback(async (name, color = "#10b981", groupId = DEFAULT_GROUP) => {
    try {
      const cat = await api.addCategory(name, color, groupId);
      setLocal((prev) => ({ categories: [cat, ...prev.categories] }));
      return cat.id;
    } catch (e) {
      console.error("addCategory", e);
    }
  }, [setLocal]);

  const updateCategory = useCallback(async (cat) => {
    try {
      await api.updateCategory(cat);
      setLocal((prev) => ({ categories: prev.categories.map((c) => (c.id === cat.id ? cat : c)) }));
    } catch (e) {
      console.error("updateCategory", e);
    }
  }, [setLocal]);

  const deleteCategory = useCallback(async (catId) => {
    if (catId === DEFAULT_CATEGORY) return alert("Cannot delete the default category.");
    const cat = data.categories.find((c) => c.id === catId);
    if (!cat) return;
    try {
      await api.deleteCategory(catId);
      setLocal((prev) => ({
        categories: prev.categories.filter((c) => c.id !== catId),
        sessions: prev.sessions.map((s) =>
          s.categoryId === catId ? { ...s, categoryId: DEFAULT_CATEGORY } : s
        ),
      }));
      return cat;
    } catch (e) {
      console.error("deleteCategory", e);
    }
  }, [data.categories, setLocal]);

  const addManualSession = useCallback(async (catId, startISO, endISO, note = "") => {
    try {
      const session = await api.addManualSession(catId, startISO, endISO, note);
      if (!session) return false;
      setLocal((prev) => ({ sessions: [session, ...prev.sessions] }));
      return true;
    } catch (e) {
      console.error("addManualSession", e);
      return false;
    }
  }, [setLocal]);

  const saveEditedSession = useCallback(async (session) => {
    try {
      await api.saveEditedSession(session);
      setLocal((prev) => ({
        sessions: prev.sessions.map((s) => (s.id === session.id ? session : s)),
      }));
    } catch (e) {
      console.error("saveEditedSession", e);
    }
  }, [setLocal]);

  const deleteSession = useCallback(async (id) => {
    const s = data.sessions.find((x) => x.id === id);
    if (!s) return;
    try {
      await api.deleteSession(id);
      setLocal((prev) => ({ sessions: prev.sessions.filter((x) => x.id !== id) }));
      return s;
    } catch (e) {
      console.error("deleteSession", e);
    }
  }, [data.sessions, setLocal]);

  const refreshAll = useCallback(async () => {
    try {
      const bootstrap = await api.bootstrap();
      setData(createLoadedState(bootstrap));
    } catch (e) {
      console.error("refreshAll", e);
    }
  }, []);

  const restoreSession = useCallback(async (session) => {
    try {
      await api.restoreSession(session);
      setLocal((prev) => ({ sessions: [session, ...prev.sessions] }));
    } catch (e) {
      console.error("restoreSession", e);
    }
  }, [setLocal]);

  const restoreCategory = useCallback(async (cat) => {
    try {
      await api.restoreCategory(cat);
      await refreshAll();
    } catch (e) {
      console.error("restoreCategory", e);
    }
  }, [refreshAll]);

  const restoreGroup = useCallback(async (g) => {
    try {
      await api.restoreGroup(g);
      await refreshAll();
    } catch (e) {
      console.error("restoreGroup", e);
    }
  }, [refreshAll]);

  const startTimer = useCallback(async (categoryId) => {
    if (data.running) return;
    try {
      const run = await api.startTimer(categoryId);
      setLocal(() => ({ running: run }));
      return run;
    } catch (e) {
      console.error("startTimer", e);
    }
  }, [data.running, setLocal]);

  const changeRunningCategory = useCallback(async (newCatId) => {
    if (!data.running) return;
    try {
      const updated = await api.changeRunningCategory(newCatId);
      setLocal(() => ({ running: updated }));
    } catch (e) {
      console.error("changeRunningCategory", e);
    }
  }, [data.running, setLocal]);

  const stopTimer = useCallback(async (note = "") => {
    if (!data.running) return;
    try {
      const session = await api.stopTimer(note);
      setLocal((prev) => ({ running: null, sessions: [session, ...prev.sessions] }));
      return session;
    } catch (e) {
      console.error("stopTimer", e);
    }
  }, [data.running, setLocal]);

  const updateSettings = useCallback(async (settings) => {
    try {
      await api.updateSettings(settings);
      setLocal(() => ({ settings }));
    } catch (e) {
      console.error("updateSettings", e);
    }
  }, [setLocal]);

  return {
    data,
    loaded: data.loaded,
    addGroup,
    updateGroup,
    deleteGroup,
    addCategory,
    updateCategory,
    deleteCategory,
    addManualSession,
    saveEditedSession,
    deleteSession,
    restoreSession,
    restoreCategory,
    restoreGroup,
    startTimer,
    changeRunningCategory,
    stopTimer,
    updateSettings,
    refreshAll,
  };
}
