import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RosterSearchField from "./src/RosterSearchField.jsx";

const CLASS_PHOTOS = [
  "/cp1.jpeg", "/cp2.jpeg", "/cp3.jpeg", "/cp4.jpeg", "/cp5.jpeg", "/cp6.jpeg", "/cp7.jpeg", "/cp8.jpg", "/cp9.jpg"
];

const CATEGORIES = [
  { id: "1",  emoji: "💍", label: "Most likely to be late to their own wedding", gender: null },
  { id: "2",  emoji: "📢", label: "Human Megaphone", gender: null },
  { id: "3",  emoji: "😴", label: "Professional Napper", gender: null },
  { id: "4",  emoji: "🕵️", label: "Most mysterious person", gender: null },
  { id: "5",  emoji: "🎭", label: "Oscar-Worthy Drama King/Queen", gender: null },
  { id: "6",  emoji: "😂", label: "Will become a meme one day", gender: null },
  { id: "7",  emoji: "👑", label: "Best Hairline (boys)", gender: "M" },
  { id: "8",  emoji: "🧔", label: "Best Beard (boys)", gender: "M" },
  { id: "9",  emoji: "💇", label: "Hair That Deserves Its Own Shampoo Ad (girls)", gender: "F" },
  { id: "10", emoji: "⚡", label: "Runs on Red Bull & Pure Chaos (Most active person)", gender: null },
  { id: "11", emoji: "🍎", label: "Teacher's Pet", gender: null },
  { id: "12", emoji: "💑", label: "Couple Goals (Officially or Unofficially)", gender: "MF" },
  { id: "13", emoji: "👯", label: "The Unbreakable Duo", gender: null, slots: 2 },
  { id: "14", emoji: "💼", label: "Future Forbes Cover Star (Most likely to become a CEO)", gender: null },
  { id: "15", emoji: "🎨", label: "Born with a Creative Brain", gender: null },
  { id: "16", emoji: "💻", label: "Best Programmer", gender: null },
  { id: "17", emoji: "🎮", label: "Would Rage-Quit Real Life for Gaming (Best ProGamer)", gender: null },
  { id: "18", emoji: "🏛️", label: "Future Minister", gender: null },
  { id: "19", emoji: "🎓", label: "The professor of the class", gender: null },
  { id: "20", emoji: "🏅", label: "Built Different — Best Athlete", gender: null },
  { id: "21", emoji: "🏏", label: "Best cricketer", gender: null },
  { id: "22", emoji: "🎤", label: "Best singer", gender: null },
  { id: "23", emoji: "💃", label: "Best Dancer", gender: null },
  { id: "24", emoji: "🎙️", label: "Best Speaker", gender: null },
  { id: "25", emoji: "😈", label: "Most Notorious", gender: null },
  { id: "26", emoji: "💛", label: "Walking Green Flag", gender: null },
  { id: "27", emoji: "🍬", label: "Sweetest Person", gender: null },
  { id: "28", emoji: "👂", label: "Free Therapist (No Appointment Needed)", gender: null },
  { id: "29", emoji: "👗", label: "Best Dressing Sense", gender: null },
  { id: "30", emoji: "☮️", label: "UN Ambassador of the Classroom (Conflict Resolver)", gender: null },
  { id: "31", emoji: "✏️", label: "Sharpest Eyeliner in the Room (girls)", gender: "F" },
  { id: "32", emoji: "👜", label: "Accessory Queen — Always Dripping in Jewelry (girls)", gender: "F" },
  { id: "33", emoji: "💪", label: "Girl Boss Energy — Future Glass Ceiling Smasher (girls)", gender: "F" },
  { id: "34", emoji: "🎬", label: "The Best Trio", gender: null, slots: 3 },
  { id: "35", emoji: "🔄", label: "Most likely to switch careers", gender: null },
  { id: "36", emoji: "📅", label: "Never misses a day (The one with the perfect attendance)", gender: null },
  { id: "37", emoji: "😂", label: "Most Humorous", gender: null },
  { id: "38", emoji: "📚", label: "That one friend you call for exam material", gender: null },
  { id: "39", emoji: "📞", label: "That one person who is always on a call", gender: null },
  { id: "40", emoji: "💼", label: "The entrepreneur", gender: null },
  { id: "41", emoji: "🍳", label: "That one friend who cooks like a chef", gender: null },
  { id: "42", emoji: "🍿", label: "Professional Snacker (Always has food)", gender: null },
  { id: "43", emoji: "😆", label: "The Most Contagious Laugh", gender: null },
  { id: "44", emoji: "📸", label: "The Unofficial Group Photographer", gender: null },
  { id: "45", emoji: "🎵", label: "Aux Cord King/Queen (Best taste in music)", gender: null },
  { id: "46", emoji: "🗺️", label: "Human GPS (Never gets lost)", gender: null },
  { id: "47", emoji: "✍️", label: "Nicest Handwriting", gender: null },
  { id: "48", emoji: "🦉", label: "The Night Owl (Productive at 3 AM)", gender: null },
  { id: "49", emoji: "🤝", label: "The Networking Ninja (Knows everyone in the building)", gender: null },
];


const getBaseUrl = () => import.meta.env.VITE_API_URL || "";

const apiGet = async (path) => {
  const res = await fetch(getBaseUrl() + path, { method: "GET", headers: { "Content-Type": "application/json" } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

const apiPost = async (path, body) => {
  const res = await fetch(getBaseUrl() + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

const toTitle = (str) =>
  str.replace(/\b\w/g, (c) => c.toUpperCase());

const CARD_MOTION = {
  initial: { opacity: 0, y: 14, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.35, ease: "easeOut" },
};

export default function NominationSite({ me, roster, rosterMap }) {
  const [screen, setScreen] = useState("landing");
  const [name, setName] = useState(me?.roll || "");
  const [nameErr, setNameErr] = useState("");
  const [idx, setIdx] = useState(0);
  const [direction, setDirection] = useState(0);
  const [picks, setPicks] = useState({});
  const [inp, setInp] = useState("");
  const [busy, setBusy] = useState(false);
  const [enc, setEnc] = useState("");
  const [hasDraft, setHasDraft] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    if (screen !== "done") return;
    const options = [
      "You just powered the chaos in the best way.",
      "Classmates are about to feel celebrated (and slightly nervous).",
      "Your nominations are officially legendary.",
      "Thank you for building good vibes across the room.",
    ];
    const seed = (name || "").trim().toLowerCase();
    const pick = options[(seed.length + seed.charCodeAt(0 || 0)) % options.length] || options[0];
    setEnc(pick);
  }, [screen, name]);

  /* Auto-load draft on mount */
  useEffect(() => {
    const roll = (me?.roll || "").trim();
    if (!roll) return;
    (async () => {
      try {
        const d = await apiPost("/api/nominations/draft/get", { user_id: roll });
        if (d.is_final) {
          setPicks(d.picks || {});
          setScreen("submitted");
        } else if (d.picks && Object.keys(d.picks).length > 0) {
          setPicks(d.picks);
          setHasDraft(true);
        }
      } catch { /* no draft yet, that's fine */ }
    })();
  }, [me?.roll]);

  /* Save current picks as draft (fire-and-forget) */
  const saveDraft = async (currentPicks) => {
    const roll = (me?.roll || name || "").trim();
    if (!roll) return;
    setSaving(true);
    try {
      await apiPost("/api/nominations/draft/save", {
        user_id: roll,
        username: rosterMap?.get(String(roll)) || "",
        email: me?.email || "",
        picks: currentPicks,
      });
    } catch (e) {
      // Draft already finalized — redirect to read-only view
      if (e.message && e.message.includes("409")) {
        try {
          const d = await apiPost("/api/nominations/draft/get", { user_id: roll });
          if (d.picks) setPicks(d.picks);
        } catch { /* use current picks */ }
        setScreen("submitted");
      }
    }
    setSaving(false);
  };

  /* Navigate forward (+1) or back (-1), auto-saving draft */
  const navigate = (dir) => {
    const nextIdx = idx + dir;
    setDirection(dir);
    if (nextIdx >= 0 && nextIdx < CATEGORIES.length) {
      setInp("");
      setIdx(nextIdx);
      saveDraft(picks);
    } else if (dir === 1) {
      saveDraft(picks);
      setScreen("review");
    }
  };

  const handleStart = async () => {
    const n = (me?.roll || name || "").trim();
    if (!n) { setNameErr("Missing roll number"); return; }
    setBusy(true);
    try {
      // Fetch existing draft
      const d = await apiPost("/api/nominations/draft/get", { user_id: n });
      if (d.is_final) {
        setPicks(d.picks || {});
        setScreen("submitted");
        setBusy(false);
        return;
      }
      if (d.picks && Object.keys(d.picks).length > 0) {
        setPicks(d.picks);
      }
    } catch {
      // Draft fetch failed — check old nominator status as fallback
      try {
        const r = await apiGet(`/api/nominations/nominators/check?name=${encodeURIComponent(n)}`);
        if (r.exists) {
          setNameErr("You have already submitted nominations!");
          setBusy(false);
          return;
        }
      } catch {
        setNameErr("Could not check submission status. Please try again.");
        setBusy(false);
        return;
      }
    }
    setBusy(false);
    setScreen("nominate");
  };

  const handleSubmit = async () => {
    setBusy(true);
    try {
      // Save final draft then finalize
      const roll = (me?.roll || name || "").trim();
      await apiPost("/api/nominations/draft/save", {
        user_id: roll,
        username: rosterMap?.get(String(roll)) || "",
        email: me?.email || "",
        picks,
      });
      await apiPost("/api/nominations/draft/finalize", { user_id: roll });
      setScreen("done");
    } catch {
      alert("Submission failed — please try again.");
    }
    setBusy(false);
  };

  // Determine if photos should be clear (landing/done) or dimmed (nominate/review)
  const clearPhotos = screen === "landing" || screen === "done";

  /* ─── SCREENS ─────────────────────────────────────── */

    if (screen === "landing") return (
      <Shell clearPhotos={clearPhotos}>
        <style>{css}</style>
        <motion.div className="card" {...CARD_MOTION} style={{ maxWidth: 440, width: "100%" }}>
          <h1 className="title">Class Awards</h1>
          <p className="sub">
            Nominate your classmates · 43 categories<br />
            <span style={{ color: "rgba(255,255,255,.45)" }}>Logged in as</span>{" "}
            <span style={{ color: "rgba(255,255,255,.85)", fontWeight: 600 }}>{me?.roll}</span>
          </p>
          {nameErr && <p className="err">{nameErr}</p>}
          <button className="btn-gold" onClick={handleStart} disabled={busy} style={{ marginTop: 12, width: "100%" }}>
            {busy ? "Checking…" : hasDraft ? "Resume Nominating" : "Start Nominating"}
          </button>
          <p className="hint">{hasDraft ? "You have a saved draft — pick up where you left off" : "One submission per person · You can skip any question"}</p>
        </motion.div>
      </Shell>
    );

  if (screen === "nominate") {
    const cat = CATEGORIES[idx];
    const pct = Math.round((idx / CATEGORIES.length) * 100);
    const isMixed = cat.gender === "MF";
    const slots = cat.slots || (isMixed ? 2 : 1);
    const isMulti = slots > 1;
    const genderFilter = cat.gender === "M" ? "M" : cat.gender === "F" ? "F" : null;
    const rosterForCat = genderFilter ? (roster || []).filter((p) => p.gender === genderFilter) : roster;
    const boysRoster = (roster || []).filter((p) => p.gender === "M");
    const girlsRoster = (roster || []).filter((p) => p.gender === "F");

    // Multi-pick: stored as "roll1|roll2|roll3" (pipe-separated)
    const multiParts = isMulti ? (picks[cat.id] || Array(slots).fill("").join("|")).split("|") : [];
    // Pad to correct length
    while (multiParts.length < slots) multiParts.push("");

    const selectedRoll = isMulti ? "" : (picks[cat.id] || "");
    const selectedName = selectedRoll ? (rosterMap?.get(String(selectedRoll)) || "") : "";
    const hasPick = isMulti
      ? multiParts.every((p) => p !== "")
      : !!picks[cat.id];

    // Helper to update one slot in a multi-pick
    const updateSlot = (slotIdx, roll) => {
      const newParts = [...multiParts];
      newParts[slotIdx] = roll || "";
      const newPicks = { ...picks };
      if (newParts.some((p) => p)) newPicks[cat.id] = newParts.join("|");
      else delete newPicks[cat.id];
      setPicks(newPicks);
    };

    // Labels for multi-pick slots
    const slotLabels = isMixed
      ? ["Pick a boy", "Pick a girl"]
      : slots === 2
        ? ["Person #1", "Person #2"]
        : slots === 3
          ? ["Person #1", "Person #2", "Person #3"]
          : Array.from({ length: slots }, (_, i) => `Person #${i + 1}`);

    // For each slot, determine the filtered roster (exclude already-picked in other slots)
    const getRosterForSlot = (slotIdx) => {
      if (isMixed) return slotIdx === 0 ? boysRoster : girlsRoster;
      const otherRolls = new Set(multiParts.filter((_, i) => i !== slotIdx).filter(Boolean));
      return (rosterForCat || []).filter((p) => !otherRolls.has(String(p.roll)));
    };

    const pillText = isMixed
      ? "Pick one boy + one girl"
      : slots === 2
        ? "Pick 2 people"
        : slots === 3
          ? "Pick 3 people"
          : `Pick ${slots} people`;

    return (
      <Shell clearPhotos={clearPhotos}>
        <style>{css}</style>
        <motion.div {...CARD_MOTION} style={{ maxWidth: 480, width: "100%" }}>
        {/* Progress */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "rgba(255,255,255,.5)", marginBottom: 6 }}>
            <span>{idx + 1} / {CATEGORIES.length}</span>
            <span>{pct}%</span>
          </div>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
          <button className="btn-ghost" onClick={() => setShowList(!showList)} style={{ display: "block", margin: "12px auto 0", padding: "6px 14px", fontSize: 13, borderRadius: 999, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}>
            {showList ? "Hide Questions List ▲" : "View All Questions ▼"}
          </button>
        </div>

        <div className="card" style={{ width: "100%", textAlign: "center" }}>
          {showList ? (
            <div style={{ textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 className="title" style={{ fontSize: "1.5rem", margin: 0 }}>All Questions</h2>
                <button className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setShowList(false)}>Close</button>
              </div>
              <div className="scroll-list" style={{ maxHeight: 400, paddingRight: 4 }}>
                {CATEGORIES.map((c, i) => {
                  const hasPick = !!picks[c.id];
                  return (
                    <button
                      key={c.id}
                      onClick={() => { setIdx(i); setShowList(false); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                        background: i === idx ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
                        border: "1px solid", borderColor: i === idx ? "rgba(255,255,255,0.2)" : "transparent",
                        borderRadius: 12, cursor: "pointer", color: "#fff", textAlign: "left", width: "100%",
                        transition: "background 0.2s", marginBottom: 6
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{c.emoji}</span>
                      <span style={{ flex: 1, fontSize: 13, color: "rgba(255,255,255,.85)" }}>{c.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: hasPick ? "rgba(120,255,150,0.8)" : "rgba(255,255,255,0.3)" }}>
                        {hasPick ? "Answered" : "Empty"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 54, marginBottom: 8 }}>{cat.emoji}</div>
              <p className="badge">Award #{cat.id}</p>
          <h2 className="q-title">{cat.label}</h2>
          {genderFilter && (
            <div className={`gender-pill ${genderFilter === "M" ? "pill-m" : "pill-f"}`}>
              {genderFilter === "M" ? "Boys only" : "Girls only"}
            </div>
          )}
          {isMulti && (
            <div className="gender-pill" style={{ background: "rgba(200,120,255,.12)", borderColor: "rgba(200,120,255,.35)", color: "#d49cff" }}>
              {pillText}
            </div>
          )}

          {isMulti ? (
            <div style={{ marginTop: 22, marginBottom: 18 }}>
              {slotLabels.map((label, si) => (
                <div key={si} style={si > 0 ? { marginTop: 16 } : {}}>
                  <p style={{ color: "rgba(255,255,255,.5)", fontSize: 12, marginBottom: 8 }}>{label}</p>
                  <RosterSearchField
                    roster={getRosterForSlot(si)}
                    valueRoll={multiParts[si] || ""}
                    onChangeRoll={(r) => updateSlot(si, r)}
                    placeholder={isMixed ? (si === 0 ? "Search boys\u2026" : "Search girls\u2026") : "Search\u2026"}
                    autoFocus={si === 0}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ marginTop: 22, marginBottom: 18 }}>
              <RosterSearchField
                roster={rosterForCat}
                valueRoll={selectedRoll}
                onChangeRoll={(r) => {
                  const newPicks = { ...picks };
                  if (r) newPicks[cat.id] = r;
                  else delete newPicks[cat.id];
                  setPicks(newPicks);
                  setInp("");
                }}
                autoFocus
              />
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            {idx > 0 && (
              <button className="btn-ghost" onClick={() => navigate(-1)} style={{ flex: 1 }}>
                ← Back
              </button>
            )}
            <button className="btn-gold" onClick={() => navigate(1)} style={{ flex: 2 }}>
              {idx === CATEGORIES.length - 1 ? "Save & Review →" : hasPick ? "Save & Next →" : "Skip →"}
            </button>
          </div>
          {saving && <p className="hint" style={{ marginTop: 8, color: "rgba(255,255,255,.35)" }}>Saving draft…</p>}
            </>
          )}
        </div>
        </motion.div>
      </Shell>
    );
  }

  if (screen === "review") {
    const count = Object.keys(picks).length;
    return (
      <Shell clearPhotos={clearPhotos}>
        <style>{css}</style>
        <motion.div style={{ maxWidth: 460, width: "100%" }} className="fade-in" {...CARD_MOTION}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div className="mini-symbol" aria-hidden="true" />
            <h2 className="title" style={{ marginTop: 8 }}>Review Your Picks</h2>
            <p className="sub">{count} / {CATEGORIES.length} nominated</p>
          </div>

          <div className="scroll-list">
            {CATEGORIES.map((cat) => (
              <div key={cat.id} className="row-item">
                <span style={{ fontSize: 18 }}>{cat.emoji}</span>
                <span className="row-label">{cat.label}</span>
                {picks[cat.id]
                  ? <span className="row-val">{rosterMap?.get(String(picks[cat.id])) ? `${rosterMap.get(String(picks[cat.id]))} (${picks[cat.id]})` : picks[cat.id]}</span>
                  : <span className="row-skip">skipped</span>}
              </div>
            ))}
          </div>

          <button
            className="btn-gold"
            onClick={handleSubmit}
            disabled={busy || count === 0}
            style={{ width: "100%", marginTop: 16 }}
          >
            {busy ? "Submitting…" : "Submit Nominations 🎉"}
          </button>
          <button
            className="btn-ghost"
            onClick={() => { setIdx(0); setInp(picks[CATEGORIES[0].id] || ""); setScreen("nominate"); }}
            style={{ width: "100%", marginTop: 8 }}
          >
            ← Edit nominations
          </button>
        </motion.div>
      </Shell>
    );
  }

  /* ─── SUBMITTED (read-only view) ─── */
  if (screen === "submitted") {
    const count = Object.keys(picks).length;
    return (
      <Shell clearPhotos={clearPhotos}>
        <style>{css}</style>
        <motion.div style={{ maxWidth: 460, width: "100%" }} className="fade-in" {...CARD_MOTION}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div className="mini-symbol" aria-hidden="true" />
            <h2 className="title" style={{ marginTop: 8 }}>Your Nominations</h2>
            <p className="sub">{count} / {CATEGORIES.length} nominated · <span style={{ color: "rgba(120,255,150,.7)", fontWeight: 600 }}>Submitted ✓</span></p>
          </div>

          <div className="scroll-list">
            {CATEGORIES.map((cat) => (
              <div key={cat.id} className="row-item">
                <span style={{ fontSize: 18 }}>{cat.emoji}</span>
                <span className="row-label">{cat.label}</span>
                {picks[cat.id]
                  ? <span className="row-val">{rosterMap?.get(String(picks[cat.id])) ? `${rosterMap.get(String(picks[cat.id]))} (${picks[cat.id]})` : picks[cat.id]}</span>
                  : <span className="row-skip">skipped</span>}
              </div>
            ))}
          </div>
          <p className="hint" style={{ marginTop: 16 }}>Nominations are locked. Contact admin if you need to make changes.</p>
        </motion.div>
      </Shell>
    );
  }

  return (
    <Shell clearPhotos={clearPhotos}>
      <style>{css}</style>
      <motion.div className="card" {...CARD_MOTION} style={{ maxWidth: 420, textAlign: "center" }}>
        <div className="mini-symbol" aria-hidden="true" />
        <h2 className="title" style={{ marginTop: 12 }}>Nominations Submitted!</h2>
        <p className="sub" style={{ marginTop: 8 }}>
          Thank you, <span style={{ color: "rgba(255,255,255,.85)", fontWeight: 600 }}>{me?.roll}</span>!<br />
          {enc || "Your nominations are in. Stay tuned for the voting round!"}
        </p>
        <div className="sparkles" aria-hidden="true" />
      </motion.div>
    </Shell>
  );
}

/* ─── SHELL ─── */
function Shell({ children, clearPhotos = false }) {
  const backgroundTiles = Array.from({ length: 12 }, (_, i) => CLASS_PHOTOS[i % CLASS_PHOTOS.length]);

  return (
    <div className="app-container">
      <style>{css}</style>
      <div className={`background-grid ${clearPhotos ? "bg-clear" : "bg-dimmed"}`}>
        {backgroundTiles.map((photo, index) => (
          <div key={index} className="photo-card" style={{ backgroundImage: `url(${photo})` }} />
        ))}
      </div>
      <div className={`overlay-gradient ${clearPhotos ? "overlay-clear" : "overlay-dimmed"}`} />
      <div className="content-wrapper">
        <div className="ambient-glow glow-1" />
        <div className="ambient-glow glow-2" />
        {children}
      </div>
    </div>
  );
}

/* ─── CSS ─── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

:root {
  --bg: #030712;
  --panel: #0b0f18;
  --card: rgba(9, 12, 18, 0.92);
  --border: rgba(255, 255, 255, 0.12);
  --muted: rgba(255, 255, 255, 0.55);
  --accent: rgba(255, 255, 255, 0.7);
  --shadow: rgba(0, 0, 0, 0.65);
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: var(--bg); overflow: hidden; margin: 0; font-family: 'Space Grotesk', system-ui, sans-serif; color: #f7f8ff; }

.app-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--bg);
  font-family: 'Space Grotesk', sans-serif;
  color: #f7f8ff;
}

/* ── Background grid (shared) ── */
.background-grid {
  position: absolute;
  inset: -20% 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 18px;
  padding: 48px;
  transform: rotate(-0.8deg) scale(1.03);
  z-index: 0;
  pointer-events: none;
  animation: gridScroll 60s linear infinite;
  transition: opacity 0.6s ease;
}

/* Clear photos: high visibility */
.background-grid.bg-clear .photo-card {
  opacity: 1;
  filter: contrast(1.08) saturate(1.1) brightness(0.95);
}

/* Dimmed photos: nomination/review mode */
.background-grid.bg-dimmed .photo-card {
  opacity: 0.92;
  filter: contrast(1.05) saturate(0.8);
}

.photo-card {
  width: 100%;
  aspect-ratio: 0.75 / 1;
  background-size: cover;
  background-position: center;
  border-radius: 26px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.65);
  border: 1px solid rgba(255,255,255,0.06);
  transition: opacity 0.6s ease, filter 0.6s ease;
  animation: drift 20s ease-in-out infinite;
}
.photo-card:nth-child(2n) { animation-delay: -5s; animation-duration: 25s; }
.photo-card:nth-child(3n) { animation-delay: -10s; animation-duration: 30s; }

/* Clear overlay: lighter so photos pop through */
.overlay-gradient {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  transition: background 0.6s ease;
}
.overlay-gradient.overlay-clear {
  background: radial-gradient(ellipse at 50% 50%, rgba(3,7,18,0.55), rgba(3,7,18,0.78) 60%, rgba(3,7,18,0.92) 100%);
}
.overlay-gradient.overlay-dimmed {
  background: linear-gradient(180deg, rgba(3,7,18,0.84), rgba(3,7,18,0.9) 40%, rgba(3,7,18,0.95) 75%);
}

.content-wrapper {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
}

.ambient-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.12;
  pointer-events: none;
  z-index: 1;
}
.glow-1 { width: 480px; height: 480px; background: rgba(255,255,255,0.15); top: -100px; right: -80px; }
.glow-2 { width: 540px; height: 540px; background: rgba(255,255,255,0.06); bottom: -160px; left: -140px; }

/* ── Card ── */
.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 32px;
  padding: 42px 46px;
  min-width: 320px;
  max-width: 560px;
  backdrop-filter: blur(24px);
  box-shadow: 0 40px 120px var(--shadow);
  color: #f7f8ff;
}

.hero-symbol {
  width: 72px;
  height: 72px;
  margin: 0 auto 24px;
  border-radius: 24px;
  border: 1px solid rgba(255,255,255,0.15);
  background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), transparent 65%);
  box-shadow: inset 0 -6px 10px rgba(0,0,0,0.3);
  position: relative;
}
.hero-symbol::after {
  content: "";
  position: absolute;
  inset: 18px;
  border-radius: 16px;
  background: rgba(255,255,255,0.05);
}
.mini-symbol {
  width: 42px;
  height: 42px;
  margin: 0 auto 16px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.18);
  background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15), transparent 70%);
  box-shadow: inset 0 -4px 8px rgba(0,0,0,0.4);
}
.title  { font-size: 2.3rem; font-weight: 600; text-align: center; letter-spacing: 0.04em; }
.sub    { text-align: center; color: var(--muted); font-size: 14px; margin-top: 6px; }
.err    { color: rgba(255, 119, 143, 0.7); font-size: 13px; text-align: center; margin-top: 6px; }
.hint   { color: rgba(255,255,255,0.35); font-size: 13px; text-align: center; margin-top: 18px; letter-spacing: 0.02em; }

.badge  { display: inline-flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: var(--muted); font-size: 11px; letter-spacing: 0.4em; text-transform: uppercase; padding: 4px 14px; border-radius: 999px; margin-bottom: 12px; }
.q-title { font-size: 1.7rem; font-weight: 600; color: #f7f8ff; line-height: 1.35; }

.field {
  width: 100%;
  background: rgba(255,255,255,0.04);
  border: 1.5px solid rgba(255,255,255,0.12);
  border-radius: 16px;
  padding: 14px 18px;
  color: #f7f8ff;
  font-size: 16px;
  outline: none;
  transition: border-color .2s;
  display: block;
}
.field::placeholder { color: rgba(255,255,255,0.4); }
.field:focus { border-color: rgba(255,255,255,0.35); }

.dropdown {
  position: absolute;
  left: 0;
  right: 0;
  margin-top: 10px;
  background: rgba(8, 10, 18, 0.98);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0,0,0,0.45);
  z-index: 40;
}
.drop-item {
  width: 100%;
  text-align: left;
  padding: 12px 14px;
  border: none;
  background: transparent;
  color: #f7f8ff;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.drop-item:hover { background: rgba(255,255,255,0.04); }
.drop-empty {
  padding: 12px 14px;
  color: rgba(255,255,255,0.5);
  font-size: 13px;
}
.clear-x {
  margin-left: 10px;
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.5);
  cursor: pointer;
  font-size: 12px;
  text-decoration: underline;
}

.btn-gold {
  background: rgba(255,255,255,0.08);
  color: #f7f8ff;
  font-weight: 600;
  font-size: 15px;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 18px;
  padding: 14px 24px;
  cursor: pointer;
  transition: transform .15s, opacity .15s, box-shadow .15s, border-color .15s;
  box-shadow: 0 12px 28px rgba(0,0,0,0.45);
}
.btn-gold:hover  { transform: translateY(-1px); border-color: rgba(255,255,255,0.4); }
.btn-gold:active { transform: translateY(1px); }
.btn-gold:disabled { opacity: .5; cursor: default; }

.btn-ghost {
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.7);
  font-weight: 500;
  font-size: 14px;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 18px;
  padding: 14px 18px;
  cursor: pointer;
  transition: background .15s, border-color .15s;
}
.btn-ghost:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); }

.bar-track { height: 5px; background: rgba(255,255,255,0.05); border-radius: 999px; overflow: hidden; }
.bar-fill  { height: 100%; background: linear-gradient(90deg, rgba(255,255,255,0.35), rgba(255,255,255,0.65)); border-radius: 999px; transition: width .4s ease; }

.scroll-list { max-height: 320px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
.scroll-list::-webkit-scrollbar { width: 4px; }
.scroll-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }

.row-item  { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.03); border-radius: 16px; padding: 10px 14px; border: 1px solid rgba(255,255,255,0.04); }
.row-label { font-size: 12px; color: rgba(255,255,255,0.45); flex: 1; }
.row-val   { font-size: 13px; font-weight: 600; color: #f7f8ff; white-space: nowrap; }
.row-skip  { font-size: 12px; color: rgba(255,255,255,0.3); font-style: italic; }

.gender-pill{
  display:inline-block;
  margin: 10px auto 0;
  padding: 7px 16px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: .04em;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.02);
  color: rgba(255,255,255,0.75);
}
.pill-m{ background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.25); color: rgba(255,255,255,0.75); }
.pill-f{ background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.25); color: rgba(255,255,255,0.75); }

.sparkles {
  position: relative;
  width: 10px;
  height: 10px;
  margin: 20px auto 0;
  border-radius: 50%;
  background: rgba(255,255,255,0.85);
  box-shadow:
    0 -22px 0 0 rgba(255,255,255,0.2),
    18px -10px 0 0 rgba(255,255,255,0.08),
    22px 6px 0 0 rgba(255,255,255,0.05),
    -16px 10px 0 0 rgba(255,255,255,0.05),
    -22px -8px 0 0 rgba(255,255,255,0.05);
  animation: sparklePop .9s ease-out both;
}

@keyframes sparklePop {
  0% { transform: scale(.6); opacity: .0; }
  35% { opacity: 1; }
  100% { transform: scale(1.15); opacity: 0; }
}

@keyframes drift {
  0% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-16px) scale(1.02); }
  100% { transform: translateY(0) scale(1); }
}

@keyframes gridScroll {
  0% { transform: rotate(-0.8deg) scale(1.03) translateY(0); }
  100% { transform: rotate(-0.8deg) scale(1.03) translateY(-10%); }
}

@keyframes fadeInUp { from { opacity:0; transform: translateY(18px); } to { opacity:1; transform: translateY(0); } }
.fade-in { animation: fadeInUp .35s ease both; }

/* ── Responsive Design ── */
@media (max-width: 768px) {
  .background-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    padding: 24px;
    inset: -30% 0;
  }
  .photo-card {
    border-radius: 16px;
    aspect-ratio: 0.8 / 1;
  }
  .content-wrapper {
    padding: 16px;
  }
  .card {
    padding: 28px 22px;
    border-radius: 24px;
    min-width: 0;
    max-width: 100%;
  }
  .title {
    font-size: 1.6rem;
  }
  .q-title {
    font-size: 1.3rem;
  }
  .btn-gold, .btn-ghost {
    padding: 12px 18px;
    font-size: 14px;
  }
  .field {
    padding: 12px 14px;
    font-size: 14px;
  }
  .scroll-list {
    max-height: 280px;
  }
  .badge {
    font-size: 10px;
    padding: 3px 10px;
  }
  .row-item {
    padding: 8px 10px;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .background-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    padding: 16px;
    inset: -40% 0;
  }
  .photo-card {
    border-radius: 12px;
  }
  .content-wrapper {
    padding: 12px;
  }
  .card {
    padding: 22px 16px;
    border-radius: 20px;
  }
  .title {
    font-size: 1.35rem;
  }
  .q-title {
    font-size: 1.15rem;
  }
  .sub {
    font-size: 12px;
  }
  .btn-gold, .btn-ghost {
    padding: 10px 14px;
    font-size: 13px;
    border-radius: 14px;
  }
  .scroll-list {
    max-height: 240px;
  }
  .row-label {
    font-size: 11px;
  }
  .row-val {
    font-size: 12px;
  }
}
`;
