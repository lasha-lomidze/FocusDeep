import { useEffect, useState, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  CartesianGrid
} from "recharts";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { useDB } from "./db/useDB";
import { formatDuration, msToHours, hoursToMs } from "./utils/helpers";
import { calculateStats } from "./utils/stats";
import { DEFAULT_GROUP, DEFAULT_CATEGORY } from "./utils/const";

function getUndoExpiration() {
  return Date.now() + 5000;
}

/* -------------------- Icons (Inline for portability) -------------------- */
const Icons = {
  Dashboard: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
  List: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>,
  Chart: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>,
  Settings: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  Play: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>,
  Stop: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>,
  Plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  ChevronDown: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>,
  Trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
  Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
  X: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
};

/* -------------------- Custom UI Primitives (No Native Selects) -------------------- */

// 1. Beautiful animated Select component replacement
function CustomSelect({ options, value, onChange, placeholder = "Select...", className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => String(o.value) === String(value));

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white border border-gray-200 text-gray-800 text-sm rounded-xl px-3 py-2 shadow-sm hover:border-indigo-300 transition-colors focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <Motion.span animate={{ rotate: isOpen ? 180 : 0 }} className="text-gray-400 ml-2">
          <Icons.ChevronDown />
        </Motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <Motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-auto py-1"
          >
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`px-3 py-2 text-sm cursor-pointer transition-colors flex items-center justify-between
                  ${String(option.value) === String(value) ? "bg-indigo-50 text-indigo-600 font-medium" : "text-gray-600 hover:bg-gray-50"}
                `}
              >
                {option.label}
                {String(option.value) === String(value) && <Motion.div layoutId="check" className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
              </div>
            ))}
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Card({ children, className = "", noPadding = false }) {
  return (
    <div className={`bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden ${noPadding ? "" : "p-6 md:p-7"} ${className}`}>
      {children}
    </div>
  );
}

function ProgressBar({ value, max = 100, color = "#6366f1", height = 8 }) {
  const pct = max <= 0 ? 0 : Math.min(100, (value / max) * 100);
  return (
    <div className="w-full bg-gray-100 rounded-full overflow-hidden" style={{ height }}>
      <Motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

/* -------------------- Main Component -------------------- */
export default function App() {
  const {
    data,
    loaded,
    addGroup,
    updateGroup,
    deleteGroup,
    addCategory,
    updateCategory,
    deleteCategory,
    addManualSession,
    saveEditedSession,
    deleteSession,
    startTimer,
    changeRunningCategory,
    stopTimer,
    updateSettings,
    restoreSession,
    restoreCategory,
    restoreGroup,
  } = useDB();

  // local UI state
  const [theme, setTheme] = useState(() =>
    localStorage.getItem("focusdeep-theme") === "dark" ? "dark" : "light"
  );
  const [nowMs, setNowMs] = useState(0);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("focusdeep-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!loaded) return;
    if (!data.running) return;
    const updateClock = () => setNowMs(Date.now());
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [data.running, loaded]);

  const [page, setPage] = useState("dashboard");
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_CATEGORY);
  const activeCategoryId = data.categories.some(
    (category) => category.id === selectedCategory,
  )
    ? selectedCategory
    : data.categories[0]?.id || DEFAULT_CATEGORY;

  const [editingSession, setEditingSession] = useState(null);
  const [manual, setManual] = useState({ date: "", start: "", end: "", note: "" });
  const [chartMode, setChartMode] = useState("category");
  const [overviewGroupsFirst, setOverviewGroupsFirst] = useState(false);
  const [customMerge, setCustomMerge] = useState([]);
  const [undo, setUndo] = useState(null);

  /* -------------------- Undo Handling -------------------- */
  function startUndo(payload) {
    const expireAt = getUndoExpiration();
    setUndo({ ...payload, expireAt });
    setTimeout(() => {
      setUndo((u) => (u && u.expireAt === expireAt ? null : u));
    }, 5200);
  }

  async function performUndo() {
    if (!undo) return;
    const u = undo;
    try {
      if (u.type === "deleteSession") {
        await restoreSession(u.payload);
      } else if (u.type === "deleteCategory") {
        await restoreCategory(u.payload);
      } else if (u.type === "deleteGroup") {
        await restoreGroup(u.payload);
      }
    } catch (e) {
      console.error("performUndo", e);
    }
    setUndo(null);
  }

  /* -------------------- Wrappers -------------------- */
  const handleStartTimer = async (catId) => await startTimer(catId);
  const handleChangeRunningCategory = async (newCatId) => await changeRunningCategory(newCatId);
  const handleStopTimer = async (note = "") => await stopTimer(note);
  const handleAddManualSession = async (catId, startISO, endISO, note = "") => await addManualSession(catId, startISO, endISO, note);
  const handleSaveEditedSession = async (session) => { await saveEditedSession(session); setEditingSession(null); };
  const handleDeleteSession = async (id) => {
    if (!window.confirm("Delete session?")) return;
    const payload = await deleteSession(id);
    if (payload) startUndo({ type: "deleteSession", payload });
  };
  const handleAddCategory = async (name, color, groupId) => { const id = await addCategory(name, color, groupId); setSelectedCategory(id); };
  const handleUpdateCategory = async (cat) => await updateCategory(cat);
  const handleDeleteCategory = async (catId) => {
    if (!window.confirm("Delete category? Sessions move to General.")) return;
    const payload = await deleteCategory(catId);
    if (payload) startUndo({ type: "deleteCategory", payload });
  };
  const handleAddGroup = async (name = "New group") => await addGroup(name);
  const handleUpdateGroup = async (g) => await updateGroup(g);
  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm("Delete group? Categories move to Ungrouped.")) return;
    const payload = await deleteGroup(groupId);
    if (payload) startUndo({ type: "deleteGroup", payload });
  };

  if (!loaded) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400">Loading Deep Analysis...</div>;

  const stats = calculateStats(data);
  const customMergeMs = stats.categories
    .filter((category) => customMerge.includes(category.id))
    .reduce((total, category) => total + category.totalMs, 0);
  const distributionSource = chartMode === "group"
    ? stats.groups.map((group) => ({ name: group.name, value: msToHours(group.totalMs), color: group.color }))
    : chartMode === "custom"
      ? [
          { name: "Custom", value: msToHours(customMergeMs), color: "#6366f1" },
          ...stats.categories
            .filter((category) => !customMerge.includes(category.id))
            .map((category) => ({ name: category.name, value: msToHours(category.totalMs), color: category.color })),
        ]
      : stats.categories.map((category) => ({ name: category.name, value: msToHours(category.totalMs), color: category.color }));
  const rankedDistribution = distributionSource
    .filter((entry) => entry.value > 0)
    .sort((first, second) => second.value - first.value);
  const distributionData = rankedDistribution.length > 6
    ? [
        ...rankedDistribution.slice(0, 5),
        {
          name: "Other",
          value: rankedDistribution.slice(5).reduce((total, entry) => total + entry.value, 0),
          color: "#94a3b8",
        },
      ]
    : rankedDistribution;
  const topCategory = [...stats.categories]
    .filter((category) => category.totalMs > 0)
    .sort((first, second) => second.totalMs - first.totalMs)[0];
  const weekdayTotals = data.sessions.reduce((totals, session) => {
    const weekday = new Date(session.startISO).getDay();
    totals[weekday] += session.durationMs || 0;
    return totals;
  }, Array(7).fill(0));
  const strongestWeekdayIndex = weekdayTotals.indexOf(Math.max(...weekdayTotals));
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Helper to map category/group to options for CustomSelect
  const categoryOptions = data.categories.map(c => ({
    value: c.id,
    label: (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
        <span>{c.name}</span>
      </div>
    )
  }));

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans selection:bg-indigo-100 flex flex-col md:flex-row overflow-hidden">

      {/* ---------------- Sidebar Navigation ---------------- */}
      <nav className="w-full md:w-20 lg:w-64 bg-white border-r border-gray-200 flex flex-row md:flex-col justify-between p-4 z-20 shadow-sm md:shadow-none shrink-0">
        <div className="flex items-center gap-3 md:flex-col md:items-start lg:flex-row lg:items-center">
          <div className="brand-mark w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-indigo-200 shadow-lg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <span className="font-bold text-lg tracking-tight hidden lg:block text-gray-900">Focus<span className="text-indigo-600">Deep</span></span>
        </div>

        <div className="flex gap-2 md:flex-col md:mt-8 md:w-full">
          {[
            { id: "dashboard", icon: Icons.Dashboard, label: "Overview" },
            { id: "sessions", icon: Icons.List, label: "Sessions" },
            { id: "charts", icon: Icons.Chart, label: "Analytics" },
            { id: "settings", icon: Icons.Settings, label: "Settings" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full group
                ${page === item.id ? "text-indigo-600 bg-indigo-50 font-medium" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
            >
              <item.icon />
              <span className="hidden lg:block">{item.label}</span>
              {page === item.id && (
                <Motion.div layoutId="nav-pill" className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-full hidden md:block" />
              )}
            </button>
          ))}
        </div>

        <div className="hidden md:block text-xs text-gray-400 mt-auto pt-4 border-t border-gray-100">
          <p>Local • Secure</p>
        </div>
      </nav>

      {/* ---------------- Main Content ---------------- */}
      <main className="flex-1 overflow-y-auto h-[calc(100vh-80px)] md:h-screen p-4 md:p-8 relative">
        <div className="max-w-6xl mx-auto space-y-8 pb-20">

          {/* Header Area */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{page.charAt(0).toUpperCase() + page.slice(1)}</h1>
              <p className="text-gray-500 text-sm mt-1">
                {page === 'dashboard' ? `Track your progress towards ${data.settings.globalGoalHours || 0}h global goal.` :
                  page === 'sessions' ? 'Manage and correct your history.' :
                    page === 'charts' ? 'Visualize your patterns.' : 'Configure your categories.'}
              </p>
            </div>

            {/* --- Active Timer Widget (Always Visible) --- */}
            <div className="shrink-0">
              <AnimatePresence mode="wait">
                {data.running ? (
                  <Motion.div
                    key="running"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-gray-900 text-white p-2 px-5 rounded-full flex items-center gap-4 shadow-xl shadow-gray-200"
                  >
                    <div className="flex items-center gap-3 bg-gray-800 rounded-full pl-1 pr-4 py-1.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: data.categories.find(c => c.id === data.running.categoryId)?.color }}>
                        <Icons.Play />
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 leading-none mb-1.5">Running</div>
                        <div className="text-sm font-semibold leading-tight font-mono w-25">
                          {formatDuration(nowMs - new Date(data.running.startISO))}
                        </div>
                      </div>
                    </div>

                    <div className="w-32 hidden sm:block">
                      <CustomSelect
                        options={categoryOptions}
                        value={data.running.categoryId}
                        onChange={handleChangeRunningCategory}
                        className="bg-transparent border-none text-white w-full"
                      />
                    </div>

                    <button onClick={() => handleStopTimer()} className="w-8 h-8 flex items-center justify-center bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors">
                      <Icons.Stop />
                    </button>
                  </Motion.div>
                ) : (
                  <Motion.div
                    key="idle"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 bg-white p-1.5 pr-4 rounded-full shadow-sm border border-gray-200"
                  >
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                      <Icons.Play />
                    </div>
                    <div className="w-40">
                      <CustomSelect
                        options={categoryOptions}
                        value={activeCategoryId}
                        onChange={setSelectedCategory}
                        placeholder="Pick category"
                      />
                    </div>
                    <button onClick={() => handleStartTimer(activeCategoryId)} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-full transition-colors">
                      Start Focus
                    </button>
                  </Motion.div>
                )}
              </AnimatePresence>
            </div>
          </header>

          {/* ---------------- DASHBOARD VIEW ---------------- */}
          {page === "dashboard" && (
            <Motion.div layout className="grid grid-cols-1 md:grid-cols-12 gap-6">

              {/* Quick Actions - Horizontal Scroll */}
              <div className="md:col-span-12 overflow-x-auto pb-2 no-scrollbar">
                <div className="flex gap-3">
                  {data.categories.map(c => (
                    <Motion.button
                      key={c.id}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { setSelectedCategory(c.id); if (!data.running) handleStartTimer(c.id); else handleChangeRunningCategory(c.id); }}
                      className="flex items-center gap-2 px-4 py-3 bg-white rounded-2xl shadow-sm border border-gray-100 min-w-max transition-shadow hover:shadow-md"
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="font-medium text-gray-700 text-sm">{c.name}</span>
                    </Motion.button>
                  ))}
                  <button
                    onClick={() => setPage('settings')}
                    className="flex items-center min-w-10 justify-center h-10 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                  >
                    <Icons.Plus />
                  </button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="md:col-span-4 space-y-6">
                <Card className="bg-linear-to-br from-indigo-500 to-violet-600 text-white border-none shadow-indigo-200 shadow-lg">
                  <div className="text-indigo-100 text-sm font-medium mb-1">Total Focus Time</div>
                  <div className="text-4xl font-bold tracking-tight mb-4">{formatDuration(stats.totalMs)}</div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-indigo-100 opacity-80">
                      <span>Global Goal ({data.settings.globalGoalHours || 0}h)</span>
                      <span>{((stats.totalMs / hoursToMs(Math.max(1, data.settings.globalGoalHours))) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-white/90 h-full rounded-full" style={{ width: `${Math.min(100, (stats.totalMs / hoursToMs(Math.max(1, data.settings.globalGoalHours))) * 100)}%` }}></div>
                    </div>
                  </div>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  <Card className="flex flex-col justify-center">
                    <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Daily Avg</span>
                    <span className="text-2xl font-bold text-gray-800 mt-1">{stats.avgPerDayH.toFixed(1)}<span className="text-sm font-normal text-gray-500">h</span></span>
                  </Card>
                  <Card className="flex flex-col justify-center">
                    <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Est. Days Left</span>
                    <span className="text-2xl font-bold text-gray-800 mt-1">{stats.globalEstimatedDays === Infinity ? "∞" : stats.globalEstimatedDays}</span>
                  </Card>
                </div>

                {/* Manual Entry Mini-Form */}
                <Card>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-gray-800">Manual Entry</span>
                  </div>
                  <div className="space-y-3">
                    <CustomSelect
                      options={categoryOptions}
                      value={activeCategoryId}
                      onChange={setSelectedCategory}
                      className="w-full"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" className="bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 text-xs outline-none focus:border-indigo-500" value={manual.date} onChange={e => setManual({ ...manual, date: e.target.value })} />
                      <input type="text" placeholder="Note" className="bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 text-xs outline-none focus:border-indigo-500" value={manual.note} onChange={e => setManual({ ...manual, note: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="time" className="bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 text-xs outline-none focus:border-indigo-500" value={manual.start} onChange={e => setManual({ ...manual, start: e.target.value })} />
                      <input type="time" className="bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 text-xs outline-none focus:border-indigo-500" value={manual.end} onChange={e => setManual({ ...manual, end: e.target.value })} />
                    </div>
                    <button
                      onClick={async () => {
                        if (!manual.date || !manual.start || !manual.end) return alert("Fill date/times");
                        const startISO = new Date(`${manual.date}T${manual.start}`).toISOString();
                        const endISO = new Date(`${manual.date}T${manual.end}`).toISOString();
                        const ok = await handleAddManualSession(activeCategoryId, startISO, endISO, manual.note);
                        if (ok) setManual({ date: "", start: "", end: "", note: "" });
                        else alert("Invalid times");
                      }}
                      className="w-full py-2 bg-gray-900 text-white rounded-xl text-xs font-medium hover:bg-gray-800 transition-colors"
                    >
                      Add Session
                    </button>
                  </div>
                </Card>
              </div>

              {/* Breakdown Grid */}
              <div className="md:col-span-8 space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="font-semibold text-gray-800">{overviewGroupsFirst ? "Group Progress" : "Category Progress"}</h2>
                  <button
                    type="button"
                    onClick={() => setOverviewGroupsFirst((showGroups) => !showGroups)}
                    aria-label="Swap category and group overview"
                    title="Swap category and group overview"
                    className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-indigo-300 hover:text-indigo-600"
                  >
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m16 3 4 4-4 4" />
                      <path d="M20 7H4" />
                      <path d="m8 21-4-4 4-4" />
                      <path d="M4 17h16" />
                    </svg>
                    Swap view
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  <Motion.div
                    key={overviewGroupsFirst ? "groups-progress" : "categories-progress"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {(overviewGroupsFirst ? stats.groups : stats.categories).map((item) => (
                      <Motion.div layout key={item.id} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-gray-800">{item.name}</h3>
                            <p className="text-xs text-gray-400 font-mono mt-1">{formatDuration(item.totalMs)}</p>
                          </div>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50" style={{ color: item.color }}>
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          </div>
                        </div>
                        <ProgressBar value={item.totalMs} max={Math.max(1, item.goalMs)} color={item.color} />
                        <div className="flex justify-between mt-3 text-xs font-medium text-gray-500">
                          <span>{formatDuration(item.leftMs)} left</span>
                          <span>Est: {item.estimatedDays === Infinity ? "-" : item.estimatedDays}d</span>
                        </div>
                      </Motion.div>
                    ))}
                  </Motion.div>
                </AnimatePresence>

                <Card>
                  <h3 className="font-bold text-gray-800 mb-4 px-2">{overviewGroupsFirst ? "Category Breakdown" : "Group Breakdown"}</h3>
                  <div className="max-h-80 space-y-1 overflow-y-auto pr-1">
                    {(overviewGroupsFirst ? stats.categories : stats.groups).map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl p-3 transition-colors hover:bg-gray-50">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                          <div className="min-w-0">
                            <div className="truncate font-medium text-gray-800">{item.name}</div>
                            {overviewGroupsFirst && (
                              <div className="truncate text-xs text-gray-400">
                                {data.groups.find((group) => group.id === item.groupId)?.name || "Ungrouped"}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 text-right text-xs">
                          <div className="font-medium text-gray-700">{formatDuration(item.totalMs)} done</div>
                          <div className="mt-1 text-gray-400">{formatDuration(item.leftMs)} left</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </Motion.div>
          )}

          {/* ---------------- SESSIONS VIEW ---------------- */}
          {page === "sessions" && (
            <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {data.sessions.map(s => (
                  <Motion.div key={s.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-indigo-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-12 rounded-full hidden sm:block" style={{ backgroundColor: data.categories.find(c => c.id === s.categoryId)?.color || '#eee' }} />
                      <div>
                        <h4 className="font-bold text-gray-800">{data.categories.find(c => c.id === s.categoryId)?.name}</h4>
                        <div className="text-xs text-gray-500 mt-1 flex gap-2">
                          <span>{new Date(s.startISO).toLocaleDateString()}</span>
                          <span className="text-gray-300">•</span>
                          <span>{new Date(s.startISO).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(s.endISO).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {s.note && <div className="text-xs text-gray-600 mt-1 italic bg-gray-50 inline-block px-2 py-0.5 rounded">"{s.note}"</div>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                      <span className="font-mono font-medium text-gray-700">{formatDuration(s.durationMs)}</span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingSession(s)} className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"><Icons.Edit /></button>
                        <button onClick={() => handleDeleteSession(s.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"><Icons.Trash /></button>
                      </div>
                    </div>
                  </Motion.div>
                ))}
                {data.sessions.length === 0 && <div className="text-center py-20 text-gray-400">No sessions recorded yet.</div>}
              </div>
            </Motion.div>
          )}

          {/* ---------------- CHARTS VIEW ---------------- */}
          {page === "charts" && (
            <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex flex-wrap gap-2 mb-4">
                {['category', 'group', 'custom'].map(m => (
                  <button
                    key={m}
                    onClick={() => setChartMode(m)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${chartMode === m ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
                  >
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>

              {chartMode === 'custom' && (
                <div className="bg-white p-4 rounded-2xl border border-indigo-100 mb-4">
                  <p className="text-xs text-gray-500 mb-2 uppercase font-bold tracking-wider">Merge Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {data.categories.map(c => (
                      <button key={c.id} onClick={() => setCustomMerge(p => p.includes(c.id) ? p.filter(x => x !== c.id) : [...p, c.id])}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${customMerge.includes(c.id) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 text-sm font-semibold text-indigo-600">
                    Merged Total: {formatDuration(customMergeMs)}
                  </div>
                </div>
              )}

              <Card className="h-80">
                <h3 className="font-bold text-gray-800 mb-6">Activity Trend</h3>
                <ResponsiveContainer width="100%" height="80%">
                  <AreaChart data={stats.series.map(d => ({ date: d.date.slice(5), hours: +(msToHours(d.ms).toFixed(2)) }))}>
                    <defs>
                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === "dark" ? "#344258" : "#f3f4f6"} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                    <Area type="monotone" dataKey="hours" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="h-80 flex flex-col">
                  <h3 className="font-bold text-gray-800 mb-2">Distribution</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributionData}
                        dataKey="value" nameKey="name" cx="38%" cy="50%" innerRadius={52} outerRadius={72} paddingAngle={3}
                      >
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: "12px", backgroundColor: theme === "dark" ? "#192436" : "#fff", border: `1px solid ${theme === "dark" ? "#3b4a60" : "#e5e7eb"}`, color: theme === "dark" ? "#e5e7eb" : "#1f2937" }} />
                      <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>

                <Card>
                  <h3 className="font-bold text-gray-800 mb-4">Insights</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-800 text-sm">
                      You are averaging <strong>{stats.avgPerDayH.toFixed(1)} hours</strong> per day.
                    </div>
                    <div className="p-4 bg-green-50 rounded-2xl text-green-800 text-sm">
                      At this pace, you will reach your global goal in <strong>{stats.globalEstimatedDays === Infinity ? "unknown" : stats.globalEstimatedDays} days</strong>.
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl text-gray-700 text-sm">
                      {topCategory
                        ? <><strong>{topCategory.name}</strong> is your top category at <strong>{stats.totalMs > 0 ? Math.round(topCategory.totalMs / stats.totalMs * 100) : 0}%</strong> of tracked time.</>
                        : "Log a focus session to see your leading category."}
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl text-gray-700 text-sm">
                      {weekdayTotals[strongestWeekdayIndex] > 0
                        ? <><strong>{weekdays[strongestWeekdayIndex]}</strong> is your most focused day, with {formatDuration(weekdayTotals[strongestWeekdayIndex])} logged.</>
                        : "Log a few sessions to discover your most focused day."}
                    </div>
                  </div>
                </Card>
              </div>
            </Motion.div>
          )}

          {/* ---------------- SETTINGS VIEW ---------------- */}
          {page === "settings" && (
            <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Global Settings */}
              <div className="space-y-6">
                <Card>
                  <h3 className="font-bold text-gray-900 mb-2">Appearance</h3>
                  <p className="text-sm text-gray-500 mb-4">Choose how FocusDeep looks on this device.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "light", label: "Light" },
                      { id: "dark", label: "Dark" },
                    ].map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        aria-pressed={theme === option.id}
                        onClick={() => setTheme(option.id)}
                        className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                          theme === option.id
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-gray-200 bg-white text-gray-600 hover:border-indigo-300"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </Card>

                <Card>
                  <h3 className="font-bold text-gray-900 mb-4">Global Goal</h3>
                  <label className="text-xs text-gray-500 mb-1 block uppercase font-semibold tracking-wider">Target Hours</label>
                  <input
                    type="number"
                    value={data.settings.globalGoalHours || 0}
                    onChange={(e) => updateSettings({ ...data.settings, globalGoalHours: Number(e.target.value) })}
                    className="w-full text-3xl font-bold border-b-2 border-gray-100 focus:border-indigo-500 outline-none py-2 text-gray-800 bg-transparent transition-colors"
                  />
                  <p className="text-xs text-gray-400 mt-2">Used to calculate progress bars and estimated completion dates.</p>
                </Card>

                <Card>
                  <h3 className="font-bold text-gray-900 mb-4">Add Category</h3>
                  <div className="space-y-3">
                    <input id="newCatName" placeholder="Name" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500" />
                    <div className="flex gap-2">
                      <select id="newCatGroup" className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none">
                        {data.groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                      <input id="newCatColor" type="color" defaultValue="#6366f1" className="h-11 w-12 p-0 border-0 rounded-xl overflow-hidden cursor-pointer" />
                    </div>
                    <button onClick={() => {
                      const name = document.getElementById('newCatName').value;
                      const grp = document.getElementById('newCatGroup').value;
                      const col = document.getElementById('newCatColor').value;
                      if (name) { handleAddCategory(name, col, grp); document.getElementById('newCatName').value = ''; }
                    }} className="w-full bg-gray-900 text-white rounded-xl py-3 font-medium hover:bg-gray-800 transition-colors">Create Category</button>
                  </div>
                </Card>
              </div>

              {/* Lists Management */}
              <div className="space-y-6">
                <Card className="max-h-150 overflow-y-auto">
                  <h3 className="font-bold text-gray-900 mb-4">Manage Categories</h3>
                  <div className="space-y-3">
                    {data.categories.map(c => (
                      <div key={c.id} className="flex items-center gap-2 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                        <input type="color" value={c.color} onChange={e => handleUpdateCategory({ ...c, color: e.target.value })} className="w-8 h-8 rounded-lg border-none p-0 cursor-pointer" />
                        <div className="flex-1 min-w-0">
                          <input value={c.name} onChange={e => handleUpdateCategory({ ...c, name: e.target.value })} className="w-full bg-transparent font-medium text-gray-800 outline-none border-b border-transparent focus:border-indigo-300" />
                          <div className="flex gap-2 mt-1">
                            <select value={c.groupId} onChange={e => handleUpdateCategory({ ...c, groupId: e.target.value })} className="text-xs bg-transparent text-gray-500 outline-none">
                              {data.groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                            <input type="number" placeholder="Goal" value={c.goalHours || 0} onChange={e => handleUpdateCategory({ ...c, goalHours: Number(e.target.value) })} className="w-12 text-xs bg-transparent border-b border-gray-300 text-center" />
                            <span className="text-xs text-gray-400">h</span>
                          </div>
                        </div>
                        {c.id !== DEFAULT_CATEGORY && (
                          <button onClick={() => handleDeleteCategory(c.id)} className="text-gray-400 hover:text-red-500 p-2"><Icons.Trash /></button>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Manage Groups</h3>
                    <button onClick={() => handleAddGroup("New Group")} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-medium hover:bg-indigo-100">Add</button>
                  </div>
                  <div className="space-y-2">
                    {data.groups.map(g => (
                      <div key={g.id} className="flex items-center gap-2 text-sm p-2 hover:bg-gray-50 rounded-lg">
                        <input value={g.name} onChange={e => handleUpdateGroup({ ...g, name: e.target.value })} className="flex-1 bg-transparent outline-none font-medium text-gray-700" />
                        <input type="color" value={g.color || "#60a5fa"} onChange={e => handleUpdateGroup({ ...g, color: e.target.value })} className="w-6 h-6 rounded border-none cursor-pointer" />
                        <input type="number" value={g.goalHours || 0} onChange={e => handleUpdateGroup({ ...g, goalHours: Number(e.target.value) })} className="w-12 text-right bg-transparent border-b border-gray-200" />
                        {g.id !== DEFAULT_GROUP && <button onClick={() => handleDeleteGroup(g.id)} className="text-gray-300 hover:text-red-500"><Icons.X /></button>}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </Motion.div>
          )}

        </div>
      </main>

      {/* ---------------- Modals & Overlays ---------------- */}

      {/* Edit Session Modal */}
      <AnimatePresence>
        {editingSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingSession(null)} />
            <Motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl overflow-hidden">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Edit Session</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                  <CustomSelect
                    options={categoryOptions}
                    value={editingSession.categoryId}
                    onChange={(val) => setEditingSession(s => ({ ...s, categoryId: val }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Start</label>
                    <input type="datetime-local" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                      value={editingSession.startISO.slice(0, 16)}
                      onChange={e => {
                        const newStart = new Date(e.target.value).toISOString();
                        setEditingSession(s => ({ ...s, startISO: newStart, durationMs: new Date(s.endISO) - new Date(newStart) }));
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">End</label>
                    <input type="datetime-local" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                      value={editingSession.endISO.slice(0, 16)}
                      onChange={e => {
                        const newEnd = new Date(e.target.value).toISOString();
                        setEditingSession(s => ({ ...s, endISO: newEnd, durationMs: new Date(newEnd) - new Date(s.startISO) }));
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Note</label>
                  <textarea rows="3" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    value={editingSession.note || ""}
                    onChange={e => setEditingSession(s => ({ ...s, note: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => setEditingSession(null)} className="flex-1 py-3 rounded-xl border border-gray-200 font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                <button onClick={() => handleSaveEditedSession(editingSession)} className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-200">Save Changes</button>
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Undo Toast */}
      <AnimatePresence>
        {undo && (
          <Motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-4"
          >
            <div>
              <div className="font-bold text-sm">Item Deleted</div>
              <div className="text-xs text-gray-400 capitalize">{undo.type.replace('delete', '')} removed</div>
            </div>
            <button onClick={() => performUndo()} className="bg-indigo-600 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-indigo-500 transition-colors">Undo</button>
          </Motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
