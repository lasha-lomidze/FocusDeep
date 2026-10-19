
export const formatDuration = (ms) => {
    if (!ms || ms <= 0) ms = 0;
    const totalSec = Math.round(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
};

export const nowISO = () => new Date().toISOString();
export const msToHours = (ms) => ms / 3600_000;
export const hoursToMs = (h) => h * 3600_000;
export const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 9));

