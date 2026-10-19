import { hoursToMs, msToHours } from "./helpers";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const toDateKey = (value) => new Date(value).toISOString().slice(0, 10);

function addToMap(map, key, value) {
  map[key] = (map[key] || 0) + value;
}

function average(values) {
  return values.length
    ? values.reduce((total, value) => total + value, 0) / values.length
    : 0;
}

export function calculateStats(data) {
  if (!data) return null;

  const { categories = [], groups = [], settings = {} } = data;
  const sessions = data.sessions || [];
  const runningMs = data.running
    ? new Date() - new Date(data.running.startISO)
    : 0;
  const totalMs =
    sessions.reduce((total, session) => total + (session.durationMs || 0), 0) +
    runningMs;

  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const byCategory = Object.fromEntries(categories.map(({ id }) => [id, 0]));
  const byGroup = Object.fromEntries(groups.map(({ id }) => [id, 0]));
  const dayMap = {};
  const categoryDays = new Map();
  const groupDays = new Map();

  for (const session of sessions) {
    const durationMs = session.durationMs || 0;
    const day = toDateKey(session.startISO);
    addToMap(byCategory, session.categoryId, durationMs);
    addToMap(dayMap, day, durationMs);

    let days = categoryDays.get(session.categoryId);
    if (!days) {
      days = {};
      categoryDays.set(session.categoryId, days);
    }
    addToMap(days, day, durationMs);

    const category = categoryById.get(session.categoryId);
    if (category) {
      addToMap(byGroup, category.groupId, durationMs);
      let groupDayMap = groupDays.get(category.groupId);
      if (!groupDayMap) {
        groupDayMap = {};
        groupDays.set(category.groupId, groupDayMap);
      }
      addToMap(groupDayMap, day, durationMs);
    }
  }

  if (data.running) {
    addToMap(byCategory, data.running.categoryId, runningMs);
    addToMap(dayMap, toDateKey(data.running.startISO), runningMs);
    const category = categoryById.get(data.running.categoryId);
    if (category) addToMap(byGroup, category.groupId, runningMs);
  }

  const dayKeys = Object.keys(dayMap);
  let avgPerDayMs = 0;
  if (dayKeys.length) {
    const firstDay = new Date(dayKeys.sort()[0]);
    const totalDays = Math.max(
      1,
      Math.ceil((new Date() - firstDay) / MILLISECONDS_PER_DAY),
    );
    avgPerDayMs = totalMs / totalDays;
  }

  const categoryStats = categories.map((category) => {
    const totalMs = byCategory[category.id] || 0;
    const goalMs = hoursToMs(category.goalHours || 0);
    const leftMs = Math.max(0, goalMs - totalMs);
    const days = Object.values(categoryDays.get(category.id) || {});
    const avgCatPerDayMs = average(days);

    return {
      ...category,
      totalMs,
      leftMs,
      goalMs,
      avgCatPerDayMs,
      estimatedDays:
        avgCatPerDayMs > 0 ? Math.ceil(leftMs / avgCatPerDayMs) : Infinity,
    };
  });

  const groupStats = groups.map((group) => {
    const totalMs = byGroup[group.id] || 0;
    const goalMs = hoursToMs(group.goalHours || 0);
    const leftMs = Math.max(0, goalMs - totalMs);
    const days = Object.values(groupDays.get(group.id) || {});
    const avgGroupPerDayMs = average(days);

    return {
      ...group,
      totalMs,
      leftMs,
      goalMs,
      avgGroupPerDayMs,
      estimatedDays:
        avgGroupPerDayMs > 0 ? Math.ceil(leftMs / avgGroupPerDayMs) : Infinity,
    };
  });

  const globalGoalMs = hoursToMs(settings.globalGoalHours || 0);
  const globalLeftMs = Math.max(0, globalGoalMs - totalMs);
  const globalEstimatedDays =
    avgPerDayMs > 0 ? Math.ceil(globalLeftMs / avgPerDayMs) : Infinity;

  const today = new Date();
  const series = [];
  for (let offset = 29; offset >= 0; offset -= 1) {
    const date = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - offset,
    );
    const key = toDateKey(date);
    series.push({ date: key, ms: dayMap[key] || 0 });
  }

  const weekly = {};
  const monthly = {};
  for (const [day, durationMs] of Object.entries(dayMap)) {
    const date = new Date(day);
    const dayOfWeek = (date.getUTCDay() + 6) % 7;
    const monday = new Date(date.getTime() - dayOfWeek * MILLISECONDS_PER_DAY);
    addToMap(weekly, toDateKey(monday), durationMs);
    addToMap(monthly, day.slice(0, 7), durationMs);
  }

  return {
    totalMs,
    totalHours: msToHours(totalMs),
    avgPerDayMs,
    avgPerDayH: msToHours(avgPerDayMs),
    daysTracked: dayKeys.length || 1,
    categories: categoryStats,
    groups: groupStats,
    series,
    globalGoalMs,
    globalLeftMs,
    globalEstimatedDays,
    weekly,
    monthly,
  };
}
