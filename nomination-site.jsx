import { useState, useEffect } from "react";

const CATEGORIES = [
  { id: "1",  emoji: "💍", label: "Most likely to be late to their own wedding" },
  { id: "2",  emoji: "📢", label: "Loudest mouth in the class" },
  { id: "3",  emoji: "😴", label: "Sleepiest person in the class" },
  { id: "4",  emoji: "🕵️", label: "Most mysterious person" },
  { id: "5",  emoji: "🎭", label: "Most dramatic" },
  { id: "6",  emoji: "🔄", label: "Most likely to switch careers" },
  { id: "7",  emoji: "😂", label: "Will become a meme one day" },
  { id: "8",  emoji: "👑", label: "Best hairline (men)" },
  { id: "9",  emoji: "🧔", label: "Best beard (men)" },
  { id: "10", emoji: "💇", label: "Best hair (women)" },
  { id: "11", emoji: "⚡", label: "Most active person" },
  { id: "12", emoji: "🍎", label: "Teacher's pet" },
  { id: "13", emoji: "💑", label: "Best couple" },
  { id: "14", emoji: "👯", label: "Best friendship duo" },
  { id: "15", emoji: "💼", label: "Most likely to become a CEO" },
  { id: "16", emoji: "🎨", label: "Most creative" },
  { id: "17", emoji: "🖌️", label: "Best artist" },
  { id: "18", emoji: "✍️", label: "Best writer" },
  { id: "19", emoji: "💻", label: "Best programmer" },
  { id: "20", emoji: "🎮", label: "Best pro gamer" },
  { id: "21", emoji: "🏛️", label: "Future politician" },
  { id: "22", emoji: "🍕", label: "Most hungry" },
  { id: "23", emoji: "📱", label: "Phone addict" },
  { id: "24", emoji: "🎓", label: "The professor of the class" },
  { id: "25", emoji: "🏅", label: "Best athlete" },
  { id: "26", emoji: "🏏", label: "Best cricketer" },
  { id: "27", emoji: "🎤", label: "Best singer" },
  { id: "28", emoji: "💃", label: "Best dancer" },
  { id: "29", emoji: "🎙️", label: "Best speaker" },
  { id: "30", emoji: "😈", label: "Most notorious" },
  { id: "31", emoji: "🍬", label: "The sweetest" },
  { id: "32", emoji: "⚽", label: "Best footballer" },
  { id: "33", emoji: "😊", label: "The friendliest" },
  { id: "34", emoji: "💛", label: "Most kind / helpful" },
  { id: "35", emoji: "📅", label: "Best attendance" },
  { id: "36", emoji: "🚔", label: "Most likely to end up in prison" },
  { id: "37", emoji: "🦋", label: "Shortest attention span" },
  { id: "38", emoji: "👂", label: "Best listener" },
  { id: "39", emoji: "📞", label: "Friend available 24/7" },
  { id: "40", emoji: "🐸", label: "Class meme" },
  { id: "41", emoji: "📚", label: "Most likely to become a professor" },
  { id: "42", emoji: "📖", label: "Don't judge a book by its cover" },
  { id: "43", emoji: "🌐", label: "Most likely to go viral on social media" },
  { id: "44", emoji: "👗", label: "Best dressed / most fashionable" },
  { id: "45", emoji: "🌙", label: "Night owl (stays up the latest)" },
  { id: "46", emoji: "🍳", label: "Best cook in the class" },
  { id: "47", emoji: "✈️", label: "Most likely to travel the world" },
  { id: "48", emoji: "☮️", label: "The peacemaker" },
];

const NK = "ca_noms_v3";
const VK = "ca_nominators_v3";

const toTitle = (str) =>
  str.replace(/\b\w/g, (c) => c.toUpperCase());

export default function NominationSite() {
  const [screen, setScreen] = useState("landing");
  const [name, setName]     = useState("");
  const [nameErr, setNameErr] = useState("");
  const [idx, setIdx]       = useState(0);
  const [picks, setPicks]   = useState({});
  const [inp, setInp]       = useState("");
  const [busy, setBusy]     = useState(false);

  /* Navigate forward (+1) or back (-1), saving current input first */
  const navigate = (dir) => {
    const newPicks = { ...picks };
    const trimmed = inp.trim();
    if (trimmed) newPicks[CATEGORIES[idx].id] = trimmed;
    else         delete newPicks[CATEGORIES[idx].id];
    setPicks(newPicks);

    const nextIdx = idx + dir;
    if (nextIdx >= 0 && nextIdx < CATEGORIES.length) {
      setInp(newPicks[CATEGORIES[nextIdx].id] || "");
      setIdx(nextIdx);
    } else if (dir === 1) {
      setScreen("review");
    }
  };

  const handleStart = async () => {
    const n = name.trim();
    if (!n) { setNameErr("Please enter your name"); return; }
    setBusy(true);
    try {
      const r = await window.storage.get(VK, true);
      const list = r ? JSON.parse(r.value) : [];
      if (list.some((x) => x.toLowerCase() === n.toLowerCase())) {
        setNameErr("You have already submitted nominations!");
        setBusy(false);
        return;
      }
    } catch {}
    setBusy(false);
    setScreen("nominate");
  };

  const handleSubmit = async () => {
    setBusy(true);
    try {
      let data = {};
      try { const r = await window.storage.get(NK, true); if (r) data = JSON.parse(r.value); } catch {}
      for (const [cid, pname] of Object.entries(picks)) {
        if (!data[cid]) data[cid] = {};
        const k = pname.toLowerCase().trim();
        data[cid][k] = (data[cid][k] || 0) + 1;
      }
      await window.storage.set(NK, JSON.stringify(data), true);

      let list = [];
      try { const r = await window.storage.get(VK, true); if (r) list = JSON.parse(r.value); } catch {}
      list.push(name.trim());
      await window.storage.set(VK, JSON.stringify(list), true);

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
        <p className="sub">Nominate your classmates · 48 categories</p>
        <input
          className="field"
          placeholder="Enter your full name"
          value={name}
          onChange={(e) => { setName(e.target.value); setNameErr(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleStart()}
          style={{ textAlign: "center", marginTop: 28 }}
        />
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
    return (
      <Shell>
        <style>{css}</style>
        {/* Progress */}
        <div style={{ width: "100%", maxWidth: 480, marginBottom: 16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"rgba(255,255,255,.45)", marginBottom:6 }}>
            <span>{idx + 1} / {CATEGORIES.length}</span>
            <span>{pct}% done</span>
          </div>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
        </div>

        <div className="card fade-in" style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 54, marginBottom: 8 }}>{cat.emoji}</div>
          <p className="badge">Award #{cat.id}</p>
          <h2 className="q-title">{cat.label}</h2>
          <input
            key={idx}
            className="field"
            placeholder="Classmate's name…"
            value={inp}
            onChange={(e) => setInp(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && navigate(1)}
            style={{ textAlign: "center", marginTop: 24, marginBottom: 20 }}
            autoFocus
          />
          <div style={{ display: "flex", gap: 10 }}>
            {idx > 0 && (
              <button className="btn-ghost" onClick={() => navigate(-1)} style={{ flex: 1 }}>
                ← Back
              </button>
            )}
            <button className="btn-gold" onClick={() => navigate(1)} style={{ flex: 2 }}>
              {idx === CATEGORIES.length - 1 ? "Review →" : inp.trim() ? "Next →" : "Skip →"}
            </button>
          </div>
          {picks[cat.id] && !inp && (
            <p className="hint" style={{ marginTop: 14 }}>Previously: <em>{toTitle(picks[cat.id])}</em></p>
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
                  ? <span className="row-val">{toTitle(picks[cat.id])}</span>
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
          Thank you, <span style={{ color: "#f5c842", fontWeight: 600 }}>{name}</span>!<br />
          Your nominations are in. Stay tuned for the voting round!
        </p>
      </div>
    </Shell>
  );
}

/* ─── SHELL ─── */
function Shell({ children }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0d0d1a 0%, #1a1040 50%, #0a1628 100%)",
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

@keyframes fadeInUp { from { opacity:0; transform: translateY(18px); } to { opacity:1; transform: translateY(0); } }
.fade-in { animation: fadeInUp .35s ease both; }
`;
