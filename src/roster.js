import raw from "../students.csv?raw";
import { parseRosterCsv } from "./parseRosterCsv.js";

const digitsOnly = (s) => String(s || "").replace(/\D/g, "");

export function loadRoster() {
  const parsed = parseRosterCsv(raw);
  const roster = [];
  for (const p of parsed) {
    const roll = digitsOnly(p.roll || p["Roll Number"] || "");
    const name = String(p.name || "").trim();
    const gender = String(p.gender || p.Gender || "").trim().toUpperCase();
    if (!roll || !name) continue;
    roster.push({ roll, name, gender: gender === "F" ? "F" : "M" });
  }
  roster.sort((a, b) => a.name.localeCompare(b.name));
  return roster;
}

