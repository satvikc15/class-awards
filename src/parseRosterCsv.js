function splitCsvLine(line) {
  // Minimal CSV parsing (handles quotes).
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQ = !inQ;
      }
    } else if (ch === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function normalizeHeader(h) {
  return String(h || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

export function parseRosterCsv(text) {
  const lines = String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const header = splitCsvLine(lines[0]).map(normalizeHeader);
  const rollIdx =
    header.indexOf("roll") >= 0 ? header.indexOf("roll") :
    header.indexOf("rollno") >= 0 ? header.indexOf("rollno") :
    header.indexOf("rollnumber") >= 0 ? header.indexOf("rollnumber") :
    -1;
  const nameIdx =
    header.indexOf("name") >= 0 ? header.indexOf("name") :
    header.indexOf("fullname") >= 0 ? header.indexOf("fullname") :
    -1;
  const genderIdx =
    header.indexOf("gender") >= 0 ? header.indexOf("gender") :
    header.indexOf("sex") >= 0 ? header.indexOf("sex") :
    -1;

  if (rollIdx < 0 || nameIdx < 0) {
    // Try the simple 2-col fallback: roll,name
    // (no headers)
    return lines
      .map((l) => splitCsvLine(l))
      .filter((cols) => cols.length >= 2)
      .map((cols) => ({ roll: cols[0], name: cols[1], gender: cols[2] || "" }))
      .filter((p) => p.roll && p.name);
  }

  const roster = [];
  for (const line of lines.slice(1)) {
    const cols = splitCsvLine(line);
    const roll = (cols[rollIdx] || "").trim();
    const name = (cols[nameIdx] || "").trim();
    const gender = genderIdx >= 0 ? (cols[genderIdx] || "").trim() : "";
    if (!roll || !name) continue;
    roster.push({ roll, name, gender });
  }
  return roster;
}

