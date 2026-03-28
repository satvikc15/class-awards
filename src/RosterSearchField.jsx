import { useEffect, useMemo, useRef, useState } from "react";

export default function RosterSearchField({
  roster,
  valueRoll,
  onChangeRoll,
  placeholder = "Search roll or name…",
  autoFocus = false,
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const boxRef = useRef(null);

  const items = useMemo(() => {
    const list = Array.isArray(roster) ? roster : [];
    const query = q.trim().toLowerCase();
    if (!query) return list.slice(0, 20);
    const scored = [];
    for (const p of list) {
      const roll = String(p.roll || "");
      const name = String(p.name || "");
      const hay = `${roll} ${name}`.toLowerCase();
      const idx = hay.indexOf(query);
      if (idx === -1) continue;
      scored.push({ p, idx });
    }
    scored.sort((a, b) => a.idx - b.idx);
    return scored.slice(0, 20).map((x) => x.p);
  }, [roster, q]);

  const selected = useMemo(() => {
    if (!valueRoll) return null;
    return (roster || []).find((p) => String(p.roll) === String(valueRoll)) || null;
  }, [roster, valueRoll]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!boxRef.current) return;
      if (boxRef.current.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // When focused, we show the query 'q'. When blurred, if we have a selection, show its name.
  // This makes the selection look "filled" while still allowing search on focus.
  const displayValue = isFocused ? q : (selected ? `${selected.name} (${selected.roll})` : q);

  return (
    <div ref={boxRef} style={{ position: "relative", width: "100%" }}>
      <input
        className="field"
        placeholder={placeholder}
        value={displayValue}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
          setIsFocused(true);
        }}
        onBlur={() => {
          // Keep search results open for a tiny bit so click can register if blur happens first
          setTimeout(() => setIsFocused(false), 200);
        }}
        style={{
          textAlign: "center",
          color: (!isFocused && selected) ? "#fff" : undefined,
          fontWeight: (!isFocused && selected) ? 600 : undefined,
          background: (!isFocused && selected) ? "rgba(255,255,255,0.08)" : undefined,
        }}
        autoFocus={autoFocus}
      />

      {valueRoll && selected && (
        <div style={{ marginTop: 6, textAlign: "center" }}>
          <button
            type="button"
            className="clear-x"
            style={{ fontSize: 11, opacity: 0.6 }}
            onClick={() => {
              onChangeRoll("");
              setQ("");
              setOpen(false);
            }}
          >
            clear selection
          </button>
        </div>
      )}

      {open && (
        <div className="dropdown">
          {!Array.isArray(roster) || roster.length === 0 ? (
            <div className="drop-empty">
              Roster is not loaded.
            </div>
          ) : items.length === 0 ? (
            <div className="drop-empty">No matches.</div>
          ) : (
            items.map((p) => (
              <button
                type="button"
                key={p.roll}
                className="drop-item"
                onClick={() => {
                  onChangeRoll(String(p.roll));
                  setQ("");
                  setOpen(false);
                }}
              >
                <span style={{ fontWeight: 800, color: "#fff" }}>{p.name}</span>
                <span style={{ color: "rgba(255,255,255,.55)", fontSize: 12 }}>{p.roll}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

