import { useState, useEffect } from "react";
import RosterSearchField from "./src/RosterSearchField.jsx";

const CATEGORIES = [
  { id: "1", emoji: "💍", label: "Most likely to be late to their own wedding", gender: null },
  { id: "2", emoji: "📢", label: "Human Megaphone", gender: null },
  { id: "3", emoji: "😴", label: "Professional Napper", gender: null },
  { id: "4", emoji: "🕵️", label: "Most mysterious person", gender: null },
  { id: "5", emoji: "🎭", label: "Oscar-Worthy Drama King/Queen", gender: null },
  { id: "6", emoji: "😂", label: "Will become a meme one day", gender: null },
  { id: "7", emoji: "👑", label: "Best Hairline (boys)", gender: "M" },
  { id: "8", emoji: "🧔", label: "Best Beard (boys)", gender: "M" },
  { id: "9", emoji: "💇", label: "Hair That Deserves Its Own Shampoo Ad (girls)", gender: "F" },
  { id: "10", emoji: "⚡", label: "Runs on Red Bull & Pure Chaos (Most active person)", gender: null },
  { id: "11", emoji: "🍎", label: "Teacher's Pet", gender: null },
  { id: "12", emoji: "💑", label: "The Best Couple (Hypothetically)", gender: "MF" },
  { id: "13", emoji: "👯", label: "The Unbreakable Duo", gender: null, slots: 2 },
  { id: "14", emoji: "💼", label: "Future Forbes Cover Star (Most likely to become a CEO)", gender: null },
  { id: "15", emoji: "🎨", label: "Born with a Creative Brain", gender: null },
  { id: "16", emoji: "💻", label: "Best Programmer", gender: null },
  { id: "17", emoji: "🎮", label: "Would Rage-Quit Real Life for Gaming (Best ProGamer)", gender: null },
  { id: "18", emoji: "🏛️", label: "Future Minister", gender: null },
  { id: "19", emoji: "📱", label: "Phone is Basically a Body Part", gender: null },
  { id: "20", emoji: "🎓", label: "The professor of the class", gender: null },
  { id: "21", emoji: "🏅", label: "Built Different — Best Athlete", gender: null },
  { id: "22", emoji: "🏏", label: "Best cricketer", gender: null },
  { id: "23", emoji: "🎤", label: "Best singer", gender: null },
  { id: "24", emoji: "💃", label: "Best Dancer", gender: null },
  { id: "25", emoji: "🎙️", label: "Best Speaker", gender: null },
  { id: "26", emoji: "😈", label: "Most Notorious", gender: null },
  { id: "27", emoji: "💛", label: "Walking Green Flag", gender: null },
  { id: "28", emoji: "🍬", label: "Sweetest Person", gender: null },
  { id: "29", emoji: "👂", label: "Free Therapist (No Appointment Needed)", gender: null },
  { id: "30", emoji: "👗", label: "Best Dressing Sense", gender: null },
  { id: "31", emoji: "☮️", label: "UN Ambassador of the Classroom (Conflict Resolver)", gender: null },
  { id: "32", emoji: "✏️", label: "Sharpest Eyeliner in the Room (girls)", gender: "F" },
  { id: "33", emoji: "👜", label: "Accessory Queen — Always Dripping in Jewelry (girls)", gender: "F" },
  { id: "34", emoji: "💪", label: "Girl Boss Energy — Future Glass Ceiling Smasher (girls)", gender: "F" },
  { id: "35", emoji: "🎬", label: "The Best Trio", gender: null, slots: 3 },
  { id: "36", emoji: "🔄", label: "Most likely to switch careers", gender: null },
  { id: "37", emoji: "📅", label: "Never misses a day (The one with the perfect attendance)", gender: null },
  { id: "38", emoji: "😂", label: "Most Humorous", gender: null },
  { id: "39", emoji: "📚", label: "That one friend you call for exam material", gender: null },
  { id: "40", emoji: "📞", label: "That one person who is always on a call", gender: null },
  { id: "41", emoji: "💼", label: "The entrepreneur", gender: null },
  { id: "42", emoji: "🍳", label: "That one friend who cooks like a chef", gender: null },
  { id: "43", emoji: "🎉", label: "Event Planner (That person who is the first when conducting an event)", gender: null },
];


const apiGet = async (path) => {
  const res = await fetch(path, { method: "GET", headers: { "Content-Type": "application/json" } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

const apiPost = async (path, body) => {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

const toTitle = (str) =>
  str.replace(/\b\w/g, (c) => c.toUpperCase());

export default function NominationSite({ me, roster, rosterMap }) {
  const [screen, setScreen] = useState("landing");
  const [name, setName] = useState(me?.roll || "");
  const [nameErr, setNameErr] = useState("");
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState({});
  const [inp, setInp] = useState("");
  const [busy, setBusy] = useState(false);
  const [enc, setEnc] = useState("");

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

  /* Navigate forward (+1) or back (-1) */
  const navigate = (dir) => {
    const nextIdx = idx + dir;
    if (nextIdx >= 0 && nextIdx < CATEGORIES.length) {
      setInp("");
      setIdx(nextIdx);
    } else if (dir === 1) {
      setScreen("review");
    }
  };

  const handleStart = async () => {
    const n = (me?.roll || name || "").trim();
    if (!n) { setNameErr("Missing roll number"); return; }
    setBusy(true);
    try {
      const r = await apiGet(`/api/nominations/nominators/check?name=${encodeURIComponent(n)}`);
      if (r.exists) {
        setNameErr("You have already submitted nominations!");
        setBusy(false);
        return;
      }
    } catch (e) {
      setNameErr("Could not check submission status. Please try again.");
      setBusy(false);
      return;
    }
    setBusy(false);
    setScreen("nominate");
  };

  const handleSubmit = async () => {
    setBusy(true);
    try {
      await apiPost("/api/nominations/submit", {
        user_id: (me?.roll || name || "").trim(),
        username: rosterMap?.get(String((me?.roll || name || "").trim())) || "",
        picks,
      });

      setScreen("done");
    } catch {
      alert("Submission failed — please try again.");
    }
    setBusy(false);
  };

  /* ─── SCREENS ─────────────────────────────────────── */

  if (screen === "landing") return (
    <Shell>
      <style>{css}</style>
      <div className="card fade-in" style={{ maxWidth: 440, width: "100%" }}>
        <div className="trophy">🏆</div>
        <h1 className="title">Class Awards</h1>
        <p className="sub">
          Nominate your classmates · 43 categories<br />
          <span style={{ color: "rgba(255,255,255,.35)" }}>Logged in as</span>{" "}
          <span style={{ color: "#f5c842", fontWeight: 800 }}>{me?.roll}</span>
        </p>
        {nameErr && <p className="err">{nameErr}</p>}
        <button className="btn-gold" onClick={handleStart} disabled={busy} style={{ marginTop: 12, width: "100%" }}>
          {busy ? "Checking…" : "Start Nominating →"}
        </button>
        <p className="hint">One submission per person · You can skip any question</p>
      </div>
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
      ? ["\ud83d\udc66 Pick a Boy", "\ud83d\udc67 Pick a Girl"]
      : slots === 2
        ? ["\ud83e\uddd1 Person #1", "\ud83e\uddd1 Person #2"]
        : slots === 3
          ? ["\ud83e\uddd1 Person #1", "\ud83e\uddd1 Person #2", "\ud83e\uddd1 Person #3"]
          : Array.from({ length: slots }, (_, i) => `\ud83e\uddd1 Person #${i + 1}`);

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
      <Shell>
        <style>{css}</style>
        {/* Progress */}
        <div style={{ width: "100%", maxWidth: 480, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,.45)", marginBottom: 6 }}>
            <span>{idx + 1} / {CATEGORIES.length}</span>
            <span>{pct}% done</span>
          </div>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
        </div>

        <div className="card fade-in" style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
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
                \u2190 Back
              </button>
            )}
            <button className="btn-gold" onClick={() => navigate(1)} style={{ flex: 2 }}>
              {idx === CATEGORIES.length - 1 ? "Review \u2192" : hasPick ? "Next \u2192" : "Skip \u2192"}
            </button>
          </div>
          {!isMulti && picks[cat.id] && (
            <p className="hint" style={{ marginTop: 14 }}>
              Selected: <em>{selectedName ? `${selectedName} (${picks[cat.id]})` : picks[cat.id]}</em>
            </p>
          )}
        </div>
      </Shell>
    );
  }

  if (screen === "review") {
    const count = Object.keys(picks).length;
    return (
      <Shell>
        <style>{css}</style>
        <div style={{ maxWidth: 460, width: "100%" }} className="fade-in">
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 52 }}>📋</div>
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
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <style>{css}</style>
      <div className="card fade-in" style={{ maxWidth: 420, textAlign: "center" }}>
        <div style={{ fontSize: 72 }}>🎊</div>
        <h2 className="title" style={{ marginTop: 12 }}>Nominations Submitted!</h2>
        <p className="sub" style={{ marginTop: 8 }}>
          Thank you, <span style={{ color: "#f5c842", fontWeight: 600 }}>{me?.roll}</span>!<br />
          {enc || "Your nominations are in. Stay tuned for the voting round!"}
        </p>
        <div className="sparkles" aria-hidden="true" />
      </div>
    </Shell>
  );
}

/* ─── SHELL ─── */
function Shell({ children }) {
  return (
    <div style={{
      minHeight: "100vh",
      background:
        "radial-gradient(900px circle at 15% 10%, rgba(245,200,66,.12), transparent 40%)," +
        "radial-gradient(700px circle at 85% 20%, rgba(80,200,255,.10), transparent 45%)," +
        "linear-gradient(135deg, #0d0d1a 0%, #1a1040 50%, #0a1628 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 20,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {children}
    </div>
  );
}

/* ─── CSS ─── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

.card {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 24px;
  padding: 40px 36px;
  backdrop-filter: blur(12px);
  color: #fff;
}

.trophy { font-size: 64px; text-align: center; margin-bottom: 8px; }
.title  { font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 900; text-align: center; color: #fff; }
.sub    { text-align: center; color: rgba(255,255,255,.5); font-size: 14px; margin-top: 6px; }
.err    { color: #ff8080; font-size: 13px; text-align: center; margin-top: 6px; }
.hint   { color: rgba(255,255,255,.3); font-size: 12px; text-align: center; margin-top: 16px; }

.badge  { display: inline-block; background: rgba(245,200,66,.15); border: 1px solid rgba(245,200,66,.35); color: #f5c842; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; padding: 3px 12px; border-radius: 99px; margin-bottom: 12px; }
.q-title { font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 700; color: #fff; line-height: 1.3; }

.field {
  width: 100%;
  background: rgba(255,255,255,.08);
  border: 1.5px solid rgba(255,255,255,.18);
  border-radius: 14px;
  padding: 14px 18px;
  color: #fff;
  font-size: 16px;
  font-family: 'DM Sans', sans-serif;
  outline: none;
  transition: border-color .2s;
  display: block;
}
.field::placeholder { color: rgba(255,255,255,.3); }
.field:focus { border-color: rgba(245,200,66,.7); }

.dropdown {
  position: absolute;
  left: 0;
  right: 0;
  margin-top: 10px;
  background: rgba(10, 10, 20, .92);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 18px 50px rgba(0,0,0,.55);
  z-index: 40;
}
.drop-item {
  width: 100%;
  text-align: left;
  padding: 12px 14px;
  border: none;
  background: transparent;
  color: #fff;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.drop-item:hover { background: rgba(255,255,255,.06); }
.drop-empty {
  padding: 14px;
  color: rgba(255,255,255,.55);
  font-size: 13px;
}
.clear-x {
  margin-left: 10px;
  border: none;
  background: transparent;
  color: rgba(255,255,255,.5);
  cursor: pointer;
  font-size: 12px;
  text-decoration: underline;
}

.btn-gold {
  background: linear-gradient(135deg, #f5c842, #e8a800);
  color: #1a1000;
  font-weight: 700;
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
  border: none;
  border-radius: 14px;
  padding: 14px 20px;
  cursor: pointer;
  transition: transform .15s, opacity .15s;
}
.btn-gold:hover  { transform: translateY(-1px); }
.btn-gold:active { transform: translateY(1px); }
.btn-gold:disabled { opacity: .5; cursor: default; transform: none; }

.btn-ghost {
  background: rgba(255,255,255,.07);
  color: rgba(255,255,255,.6);
  font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 14px;
  padding: 13px 18px;
  cursor: pointer;
  transition: background .15s;
}
.btn-ghost:hover { background: rgba(255,255,255,.12); }

.bar-track { height: 5px; background: rgba(255,255,255,.12); border-radius: 99px; overflow: hidden; }
.bar-fill  { height: 100%; background: linear-gradient(90deg, #f5c842, #ff9d00); border-radius: 99px; transition: width .4s ease; }

.scroll-list { max-height: 320px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
.scroll-list::-webkit-scrollbar { width: 4px; }
.scroll-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 2px; }

.row-item  { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,.05); border-radius: 12px; padding: 10px 14px; }
.row-label { font-size: 12px; color: rgba(255,255,255,.55); flex: 1; }
.row-val   { font-size: 13px; font-weight: 600; color: #f5c842; white-space: nowrap; }
.row-skip  { font-size: 12px; color: rgba(255,255,255,.2); font-style: italic; }

.gender-pill{
  display:inline-block;
  margin: 10px auto 0;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .02em;
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.06);
  color: rgba(255,255,255,.8);
}
.pill-m{ background: rgba(80,200,255,.12); border-color: rgba(80,200,255,.35); color:#78d9ff; }
.pill-f{ background: rgba(255,120,190,.12); border-color: rgba(255,120,190,.35); color:#ff9bd2; }

.sparkles {
  position: relative;
  width: 10px;
  height: 10px;
  margin: 20px auto 0;
  border-radius: 50%;
  background: #f5c842;
  box-shadow:
    0 -22px 0 0 rgba(245,200,66,.25),
    18px -10px 0 0 rgba(80,200,255,.25),
    22px 6px 0 0 rgba(255,120,190,.18),
    -16px 10px 0 0 rgba(110,255,190,.18),
    -22px -8px 0 0 rgba(245,200,66,.18);
  animation: sparklePop .9s ease-out both;
}

@keyframes sparklePop {
  0% { transform: scale(.6); opacity: .0; }
  35% { opacity: 1; }
  100% { transform: scale(1.15); opacity: 0; }
}

@keyframes fadeInUp { from { opacity:0; transform: translateY(18px); } to { opacity:1; transform: translateY(0); } }
.fade-in { animation: fadeInUp .35s ease both; }
`;
