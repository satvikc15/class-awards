const LS_KEY = "ca_roster_v1";

export function loadRosterFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRosterToStorage(roster) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(roster || []));
  } catch {}
}

export function rosterToMap(roster) {
  const m = new Map();
  for (const p of roster || []) {
    if (!p || !p.roll) continue;
    m.set(String(p.roll), String(p.name || ""));
  }
  return m;
}

