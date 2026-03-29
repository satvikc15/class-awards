import { useState, useEffect } from "react";
import { apiGet, apiPost } from "./src/api.js";

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

const toTitle = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());
const rankLabel = (i) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`);

/* ── Main component ──────────────────────────────────── */
export default function VotingSite({ me, rosterMap, onLogout }) {
  const [initializing, setInitializing] = useState(true);
  const [phase, setPhase]           = useState("nominating"); // nominating | voting | results
  const [finalists, setFinalists]   = useState({});
  const [allVotes, setAllVotes]     = useState({});

  // mode: hub | admin | student-login | voting | voted | results
  const [mode, setMode]             = useState(me?.admin ? "admin" : "hub");
  const [nominations, setNominations] = useState({});

  const studentName = me?.roll || "";
  const [nameErr, setNameErr]         = useState("");
  const [votes, setVotes]             = useState({});
  const [voteIdx, setVoteIdx]         = useState(0);
  const [busy, setBusy]               = useState(false);
  const [enc, setEnc]                 = useState("");
  const [voteFilter, setVoteFilter]   = useState("");
  const [adminSummary, setAdminSummary] = useState({ nomination_count: 0, vote_count: 0 });

  useEffect(() => { init(); }, []);
  useEffect(() => {
    if (!me?.admin) return;
    setMode("admin");
    (async () => {
      try {
        const s = await apiGet("/api/admin/state");
        setPhase(s.phase || "nominating");
        setNominations(s.nominations || {});
        setFinalists(s.finalists || {});
        setAllVotes(s.votes || {});
        setAdminSummary({
          nomination_count: s.nomination_count || 0,
          vote_count: s.vote_count || 0,
        });
      } catch {}
    })();
  }, [me?.admin]);
  useEffect(() => {
    if (mode !== "voted") return;
    const options = [
      "Class is about to crown someone… and we love it.",
      "Your vote is in. Democracy (but make it fun) works.",
      "You made the scoreboard more exciting. Respect.",
      "Thanks for participating. The legends thank you.",
    ];
    const seed = (studentName || "").trim().toLowerCase();
    const pick = options[(seed.length + (seed.charCodeAt(0 || 0) || 0)) % options.length] || options[0];
    setEnc(pick);
  }, [mode, studentName]);

  useEffect(() => {
    if (mode !== "results") return;
    refreshVotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const init = async () => {
    try {
      const r = await apiGet("/api/public/state");
      const p = r.phase || "nominating";
      setPhase(p);
      setFinalists(r.finalists || {});
      setAllVotes(r.votes || {});
    } catch {}
    setInitializing(false);
  };

  /* ── ADMIN ── (hidden entry via special login) */

  const finalizeNominations = async () => {
    setBusy(true);
    try {
      const r = await apiPost("/api/admin/finalize");
      setFinalists(r.finalists || {});
      setAllVotes({});
      setPhase("voting");
      setBusy(false);
      alert("✅ Voting phase is now OPEN. Students can vote!");
    } catch (e) {
      setBusy(false);
      alert("Could not open voting. Try again.");
    }
  };

  const lockVoting = async () => {
    setBusy(true);
    try {
      const r = await apiPost("/api/admin/lock-voting");
      setPhase("results");
      setFinalists(r.finalists || finalists);
      setAllVotes(r.votes || {});
      setBusy(false);
      alert("🏆 Voting locked! Results are visible.");
    } catch (e) {
      setBusy(false);
      alert("Could not lock voting. Try again.");
    }
  };

  const refreshVotes = async () => {
    try {
      const r = await apiGet("/api/public/state");
      setPhase(r.phase || "nominating");
      setFinalists(r.finalists || {});
      setAllVotes(r.votes || {});
    } catch {}
  };

  const resetSystem = async () => {
    if (!window.confirm("⚠️ DANGER: This will PERMANENTLY delete all nominations, votes, and user data. Are you absolutely sure?")) return;
    if (!window.confirm("FINAL CONFIRMATION: Start over from scratch? There is no undo.")) return;
    
    setBusy(true);
    try {
      await apiPost("/api/admin/reset");
      alert("✅ System has been reset. All data cleared.");
      window.location.reload();
    } catch (e) {
      alert("Reset failed: " + e.message);
    }
    setBusy(false);
  };


  /* ── STUDENT VOTING ── */
const handleStudentStart = async () => {
    if (!me?.roll) { setNameErr("Missing roll number"); return; }
    setBusy(true);
    try {
      const status = await apiGet("/api/me/status");
      if (status.vote_submitted) {
        setNameErr("You have already voted!");
        setBusy(false); return;
      }
    } catch {
      setNameErr("Could not check your vote status. Please try again.");
      setBusy(false);
      return;
    }
    setBusy(false);
    setMode("voting");
  };

  const handleVoteNext = (choice) => {
    const cat = CATEGORIES[voteIdx];
    const newVotes = { ...votes };
    if (choice) newVotes[cat.id] = choice;
    setVotes(newVotes);
    if (voteIdx < CATEGORIES.length - 1) setVoteIdx(voteIdx + 1);
    else submitVotes(newVotes);
  };

const submitVotes = async (finalVotes) => {
    setBusy(true);
    try {
      await apiPost("/api/votes/submit", { votes: finalVotes });

      setMode("voted");
    } catch (e) { alert("Vote failed, please try again."); }
    setBusy(false);
  };

  /* ── RENDER ── */
  if (initializing) return (
    <Shell><style>{css}</style>
      <p style={{ color: "rgba(255,255,255,.5)", fontSize: 18 }}>Loading…</p>
    </Shell>
  );

  /* ─ HUB ─ */
  if (mode === "hub") return (
    <Shell clearPhotos><style>{css}</style>
      <div className="card fade-in" style={{ maxWidth: 420, textAlign: "center" }}>
        <div style={{ fontSize: 64 }}>🏆</div>
        <h1 className="title">Class Awards</h1>
        <p className="sub" style={{ marginBottom: 32 }}>
          {phase === "nominating" && "Nominations are open — voting hasn't started yet."}
          {phase === "voting"     && "Voting is OPEN! Cast your votes below."}
          {phase === "results"    && "Voting is closed. See the results!"}
        </p>

        {phase === "voting" && (
          <button className="btn-gold" onClick={() => setMode("student-login")} style={{ width: "100%", marginBottom: 10 }}>
            🗳️ Vote Now
          </button>
        )}
        {phase === "results" && (
          <button className="btn-gold" onClick={() => setMode("results")} style={{ width: "100%", marginBottom: 10 }}>
            🏅 See Results
          </button>
        )}
      </div>
    </Shell>
  );

  /* ─ ADMIN PANEL ─ */
  if (mode === "admin") {
    const nominatorCount = (() => {
      try { return JSON.parse("[]").length; } catch { return "?"; }
    })();

    return (
      <Shell><style>{css}</style>
        <div style={{ maxWidth: 560, width: "100%" }} className="fade-in">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
            <h1 className="title" style={{ fontSize: "1.6rem" }}>🎛️ Admin Panel</h1>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className={`phase-badge phase-${phase}`}>
                {phase === "nominating" ? "Nominations Open" : phase === "voting" ? "Voting Open" : "Results Locked"}
              </span>
              {onLogout && (
                <button
                  className="btn-logout"
                  onClick={onLogout}
                >
                  Logout
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="card" style={{ marginBottom: 16 }}>
            <p style={{ color: "rgba(255,255,255,.6)", fontSize: 13, marginBottom: 14 }}>
              Phase controls · current phase: <strong style={{ color: "rgba(255,255,255,.85)" }}>{phase}</strong>
            </p>
            {phase === "nominating" && (
              <button className="btn-gold" onClick={finalizeNominations} disabled={busy} style={{ width: "100%" }}>
                {busy ? "Processing…" : "✅ Lock Nominations & Open Voting"}
              </button>
            )}
            {phase === "voting" && (
              <>
                <button className="btn-ghost" onClick={refreshVotes} style={{ marginBottom: 10, width: "100%" }}>
                  🔄 Refresh Vote Counts
                </button>
                <button className="btn-gold" onClick={lockVoting} style={{ width: "100%" }}>
                  🏆 Lock Voting & Publish Results
                </button>
              </>
            )}
            {phase === "results" && (
              <button className="btn-ghost" onClick={refreshVotes} style={{ width: "100%" }}>
                🔄 Refresh Results
              </button>
            )}
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <p style={{ color: "rgba(255,255,255,.6)", fontSize: 13, marginBottom: 12 }}>
              Privacy summary
            </p>
            <p className="sub" style={{ textAlign: "left" }}>
              Submitted nominations: <strong style={{ color: "rgba(255,255,255,.85)" }}>{adminSummary.nomination_count}</strong><br />
              Submitted votes: <strong style={{ color: "rgba(255,255,255,.85)" }}>{adminSummary.vote_count}</strong>
            </p>
            <p style={{ color: "rgba(255,255,255,.35)", fontSize: 12, marginTop: 10, lineHeight: 1.5 }}>
              Individual submissions are no longer stored after final submit. That keeps ballots anonymous, but it also removes per-user reversal and audit views.
            </p>
          </div>

          {/* Per-category nominees & vote counts */}
          <div className="scroll-list" style={{ maxHeight: 480 }}>
            {CATEGORIES.map((cat) => {
              const nomEntries = Object.entries(nominations[cat.id] || {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
              return (
                <div key={cat.id} className="admin-cat-row">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span>{cat.emoji}</span>
                    <span style={{ fontWeight: 600, color: "#fff", fontSize: 14 }}>{cat.label}</span>
                  </div>
                  <p style={{ color: "rgba(255,255,255,.45)", fontSize: 12, marginBottom: 8 }}>
                    Top 5 nominations
                  </p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {nomEntries.length === 0
                      ? <span className="row-skip">no nominations yet</span>
                      : nomEntries.map(([n, c], i) => (
                        <span key={n} className={`nom-chip ${i === 0 ? "chip-lead" : ""}`}>
                          #{i + 1} {toTitle(n)} <strong>({c})</strong>
                        </span>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Danger Zone */}
          <div className="card" style={{ marginTop: 24, borderColor: "rgba(255, 80, 80, 0.3)", background: "rgba(255, 0, 0, 0.02)" }}>
            <p style={{ color: "rgba(255, 120, 120, 0.9)", fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
              ⚠️ Danger Zone
            </p>
            <button 
              className="btn-ghost" 
              onClick={resetSystem} 
              disabled={busy}
              style={{ 
                width: "100%", 
                borderColor: "rgba(255, 80, 80, 0.4)", 
                color: "rgba(255, 120, 120, 0.9)" 
              }}
            >
              {busy ? "Resetting..." : "Reset System & Start Over"}
            </button>
            <p style={{ color: "rgba(255,255,255,.3)", fontSize: 11, marginTop: 8, textAlign: "center" }}>
              This will clear all nominations, votes, and registered users.
            </p>
          </div>

          <button className="btn-ghost" onClick={() => setMode("hub")} style={{ marginTop: 12, width: "100%" }}>← Back</button>
        </div>
      </Shell>
    );
  }

  /* ─ STUDENT LOGIN ─ */
  if (mode === "student-login") return (
    <Shell><style>{css}</style>
      <div className="card fade-in" style={{ maxWidth: 420, textAlign: "center" }}>
        <div style={{ fontSize: 56 }}>🗳️</div>
        <h2 className="title" style={{ marginTop: 8 }}>Cast Your Votes</h2>
        <p className="sub">
          Vote for the finalists in each category<br />
          <span style={{ color: "rgba(255,255,255,.35)" }}>Logged in as</span>{" "}
          <span style={{ color: "rgba(255,255,255,.85)", fontWeight: 800 }}>{me?.roll}</span>
        </p>
        {nameErr && <p className="err">{nameErr}</p>}
        <button className="btn-gold" onClick={handleStudentStart} disabled={busy} style={{ width: "100%", marginTop: 18 }}>
          {busy ? "Checking…" : "Start Voting →"}
        </button>
        <button className="btn-ghost" onClick={() => setMode("hub")} style={{ width: "100%", marginTop: 8 }}>← Back</button>
        <p className="hint">One vote per person per category</p>
      </div>
    </Shell>
  );

  /* ─ VOTING FLOW ─ */
  if (mode === "voting") {
    const cat  = CATEGORIES[voteIdx];
    const optsRaw = finalists[cat.id] || [];
    const f = voteFilter.trim().toLowerCase();
    const opts = !f
      ? optsRaw
      : optsRaw.filter((roll) => {
          const r = String(roll);
          const n = rosterMap?.get(r) || "";
          return `${r} ${n}`.toLowerCase().includes(f);
        });
    const pct  = Math.round((voteIdx / CATEGORIES.length) * 100);
    const selected = votes[cat.id];

    return (
      <Shell><style>{css}</style>
        <div style={{ width: "100%", maxWidth: 480, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,.4)", marginBottom: 6 }}>
            <span>{voteIdx + 1} / {CATEGORIES.length}</span>
            <span>{pct}% done</span>
          </div>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
        </div>

        <div className="card fade-in" style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 50 }}>{cat.emoji}</div>
          <p className="badge" style={{ marginTop: 8 }}>Award #{cat.id}</p>
          <h2 className="q-title">{cat.label}</h2>

          <input
            className="field"
            placeholder="Search finalists by roll or name…"
            value={voteFilter}
            onChange={(e) => setVoteFilter(e.target.value)}
            style={{ marginTop: 18 }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24, marginBottom: 24 }}>
            {optsRaw.length === 0 && (
              <p style={{ color: "rgba(255,255,255,.4)", fontSize: 14 }}>No nominees for this category</p>
            )}
            {optsRaw.length > 0 && opts.length === 0 && (
              <p style={{ color: "rgba(255,255,255,.4)", fontSize: 14 }}>No matches.</p>
            )}
            {opts.map((n, i) => (
              <button
                key={n}
                onClick={() => setVotes({ ...votes, [cat.id]: n })}
                className={`nominee-btn ${selected === n ? "nominee-selected" : ""}`}
              >
                <span style={{ fontSize: 20 }}>{rankLabel(i)}</span>
                <span style={{ flex: 1, textAlign: "left" }}>
                  {rosterMap?.get(String(n)) ? `${rosterMap.get(String(n))} (${n})` : toTitle(n)}
                </span>
                {selected === n && <span>✓</span>}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            {voteIdx > 0 && (
              <button className="btn-ghost" onClick={() => setVoteIdx(voteIdx - 1)} style={{ flex: 1 }}>
                ← Back
              </button>
            )}
            <button
              className="btn-gold"
              disabled={busy}
              onClick={() => handleVoteNext(selected || null)}
              style={{ flex: 2 }}
            >
              {voteIdx === CATEGORIES.length - 1
                ? (busy ? "Submitting…" : "Submit Votes 🎉")
                : selected ? "Next →" : "Skip →"}
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  /* ─ VOTED ─ */
  if (mode === "voted") return (
    <Shell clearPhotos><style>{css}</style>
      <div className="card fade-in" style={{ maxWidth: 420, textAlign: "center" }}>
        <div style={{ fontSize: 72 }}>🎊</div>
        <h2 className="title" style={{ marginTop: 12 }}>Votes Submitted!</h2>
        <p className="sub" style={{ marginTop: 8 }}>
          Thank you, <span style={{ color: "rgba(255,255,255,.85)", fontWeight: 600 }}>{studentName}</span>!<br />
          {enc || "Results will be announced soon. Stay tuned!"}
        </p>
        <div className="sparkles" aria-hidden="true" />
      </div>
    </Shell>
  );

  /* ─ PUBLIC RESULTS ─ */
  if (mode === "results") return (
    <Shell clearPhotos><style>{css}</style>
      <div style={{ maxWidth: 540, width: "100%" }} className="fade-in">
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 56 }}>🏅</div>
          <h1 className="title">Class Awards Results</h1>
          <p className="sub">The class has spoken!</p>
        </div>
        <div className="scroll-list" style={{ maxHeight: 520 }}>
          {CATEGORIES.map((cat) => {
            const f = finalists[cat.id] || [];
            const cv = allVotes[cat.id] || {};
            const sorted = [...f].sort((a, b) => (cv[b] || 0) - (cv[a] || 0));
            const winner = sorted[0];
            return (
              <div key={cat.id} className="admin-cat-row">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span>{cat.emoji}</span>
                  <span style={{ fontWeight: 600, color: "rgba(255,255,255,.85)", fontSize: 14 }}>{cat.label}</span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {sorted.map((n, i) => (
                    <span key={n} className={`nom-chip ${i === 0 ? "chip-lead" : ""}`}>
                      {rankLabel(i)}{" "}
                      {rosterMap?.get(String(n)) ? `${rosterMap.get(String(n))} (${n})` : toTitle(n)} — {cv[n] || 0} votes
                    </span>
                  ))}
                  {f.length === 0 && <span className="row-skip">no data</span>}
                </div>
              </div>
            );
          })}
        </div>
        <button className="btn-ghost" onClick={() => setMode("hub")} style={{ marginTop: 12, width: "100%" }}>← Back</button>
      </div>
    </Shell>
  );

  return null;
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
  --card: rgba(9, 12, 18, 0.92);
  --border: rgba(255, 255, 255, 0.12);
  --muted: rgba(255, 255, 255, 0.55);
  --shadow: rgba(0, 0, 0, 0.65);
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: var(--bg); overflow: hidden; margin: 0; font-family: 'Space Grotesk', system-ui, sans-serif; color: #f7f8ff; }

.app-container {
  position: relative; width: 100vw; height: 100vh;
  overflow: hidden; background: var(--bg);
  font-family: 'Space Grotesk', sans-serif; color: #f7f8ff;
}

.btn-logout {
  cursor: pointer;
  border: 1px solid rgba(255,255,255,.15);
  padding: 6px 14px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 12px;
  font-family: 'Space Grotesk', sans-serif;
  color: rgba(255,255,255,.6);
  background: rgba(0,0,0,.3);
  backdrop-filter: blur(10px);
  transition: background .15s, color .15s, border-color .15s;
}
.btn-logout:hover {
  background: rgba(255,80,80,.15);
  border-color: rgba(255,80,80,.4);
  color: rgba(255,120,120,.9);
}

.background-grid {
  position: absolute; inset: -20% 0;
  display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 18px; padding: 48px;
  transform: rotate(-0.8deg) scale(1.03);
  z-index: 0; pointer-events: none;
  animation: gridScroll 60s linear infinite;
  transition: opacity 0.6s ease;
}

.photo-card {
  width: 100%; aspect-ratio: 0.75 / 1;
  background-size: cover; background-position: center;
  border-radius: 26px; box-shadow: 0 25px 60px rgba(0,0,0,0.65);
  border: 1px solid rgba(255,255,255,0.06);
  transition: opacity 0.6s ease, filter 0.6s ease;
  animation: drift 20s ease-in-out infinite;
}
.background-grid.bg-clear .photo-card { opacity: 1; filter: contrast(1.08) saturate(1.1) brightness(0.95); }
.background-grid.bg-dimmed .photo-card { opacity: 0.92; filter: contrast(1.05) saturate(0.8); }
.photo-card:nth-child(2n) { animation-delay: -5s; animation-duration: 25s; }
.photo-card:nth-child(3n) { animation-delay: -10s; animation-duration: 30s; }

.overlay-gradient {
  position: absolute; inset: 0;
  z-index: 1; pointer-events: none;
  transition: background 0.6s ease;
}
.overlay-gradient.overlay-clear {
  background: radial-gradient(ellipse at 50% 50%, rgba(3,7,18,0.55), rgba(3,7,18,0.78) 60%, rgba(3,7,18,0.92) 100%);
}
.overlay-gradient.overlay-dimmed {
  background: linear-gradient(180deg, rgba(3,7,18,0.84), rgba(3,7,18,0.9) 40%, rgba(3,7,18,0.95) 75%);
}

.content-wrapper {
  position: relative; z-index: 2; width: 100%; height: 100%;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 32px; overflow-y: auto;
}

.ambient-glow { position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.12; pointer-events: none; z-index: 1; }
.glow-1 { width: 480px; height: 480px; background: rgba(255,255,255,0.15); top: -100px; right: -80px; }
.glow-2 { width: 540px; height: 540px; background: rgba(255,255,255,0.06); bottom: -160px; left: -140px; }

.card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 32px; padding: 42px 46px;
  min-width: 320px; max-width: 560px;
  backdrop-filter: blur(24px); box-shadow: 0 40px 120px var(--shadow); color: #f7f8ff;
}

.title  { font-size: 2.3rem; font-weight: 600; text-align: center; letter-spacing: 0.04em; }
.sub    { text-align: center; color: var(--muted); font-size: 14px; margin-top: 6px; line-height: 1.5; }
.err    { color: rgba(255,119,143,0.7); font-size: 13px; text-align: center; margin-top: 6px; }
.hint   { color: rgba(255,255,255,0.35); font-size: 13px; text-align: center; margin-top: 18px; }

.badge  { display: inline-flex; align-items: center; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: var(--muted); font-size: 11px; letter-spacing: 0.4em; text-transform: uppercase; padding: 4px 14px; border-radius: 999px; margin-bottom: 12px; }
.q-title { font-size: 1.7rem; font-weight: 600; color: #f7f8ff; line-height: 1.35; margin-top: 4px; }

.field {
  width: 100%; background: rgba(255,255,255,0.04);
  border: 1.5px solid rgba(255,255,255,0.12); border-radius: 16px;
  padding: 14px 18px; color: #f7f8ff; font-size: 16px;
  outline: none; transition: border-color .2s; display: block;
}
.field::placeholder { color: rgba(255,255,255,0.4); }
.field:focus { border-color: rgba(255,255,255,0.35); }

.btn-gold {
  background: rgba(255,255,255,0.08); color: #f7f8ff;
  font-weight: 600; font-size: 15px;
  border: 1px solid rgba(255,255,255,0.2); border-radius: 18px;
  padding: 14px 24px; cursor: pointer;
  transition: transform .15s, opacity .15s, border-color .15s;
  box-shadow: 0 12px 28px rgba(0,0,0,0.45);
}
.btn-gold:hover { transform: translateY(-1px); border-color: rgba(255,255,255,0.4); }
.btn-gold:active { transform: translateY(1px); }
.btn-gold:disabled { opacity: .5; cursor: default; }

.btn-ghost {
  background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.7);
  font-weight: 500; font-size: 14px;
  border: 1px solid rgba(255,255,255,0.08); border-radius: 18px;
  padding: 14px 18px; cursor: pointer;
  transition: background .15s, border-color .15s;
}
.btn-ghost:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); }

.nominee-btn {
  display: flex; align-items: center; gap: 14px;
  background: rgba(255,255,255,0.04);
  border: 1.5px solid rgba(255,255,255,0.08);
  border-radius: 16px; padding: 16px 18px;
  color: #f7f8ff; font-family: inherit; font-size: 15px; font-weight: 500;
  cursor: pointer; transition: all 0.2s; text-align: left; width: 100%;
}
.nominee-btn:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); }
.nominee-selected { background: rgba(255,255,255,0.12) !important; border-color: rgba(255,255,255,0.4) !important; }

.bar-track { height: 5px; background: rgba(255,255,255,0.05); border-radius: 999px; overflow: hidden; }
.bar-fill  { height: 100%; background: linear-gradient(90deg, rgba(255,255,255,0.35), rgba(255,255,255,0.65)); border-radius: 999px; transition: width .4s ease; }

.scroll-list { max-height: 480px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; width: 100%; }
.scroll-list::-webkit-scrollbar { width: 4px; }
.scroll-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
.row-skip { color: rgba(255,255,255,0.3); font-size: 12px; font-style: italic; }

.admin-cat-row { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 14px 16px; }
.nom-chip { display: inline-block; background: rgba(255,255,255,0.06); border-radius: 99px; padding: 4px 12px; font-size: 13px; color: rgba(255,255,255,0.8); }
.chip-lead { background: rgba(255,255,255,0.12); color: #f7f8ff; font-weight: 600; }

.phase-badge { font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 99px; }
.phase-nominating { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7); }
.phase-voting     { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.8); }
.phase-results    { background: rgba(255,255,255,0.1); color: #f7f8ff; }

.gender-pill {
  display: inline-block; margin: 10px auto 0; padding: 7px 16px;
  border-radius: 999px; font-size: 12px; font-weight: 600;
  border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.02); color: rgba(255,255,255,0.75);
}
.pill-m { background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.25); color: rgba(255,255,255,0.75); }
.pill-f { background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.25); color: rgba(255,255,255,0.75); }

.sparkles {
  position: relative; width: 10px; height: 10px;
  margin: 20px auto 0; border-radius: 50%;
  background: rgba(255,255,255,0.85);
  box-shadow: 0 -22px 0 0 rgba(255,255,255,0.2), 18px -10px 0 0 rgba(255,255,255,0.08),
    22px 6px 0 0 rgba(255,255,255,0.05), -16px 10px 0 0 rgba(255,255,255,0.05), -22px -8px 0 0 rgba(255,255,255,0.05);
  animation: sparklePop .9s ease-out both;
}

@keyframes sparklePop { 0% { transform: scale(.6); opacity: 0; } 35% { opacity: 1; } 100% { transform: scale(1.15); opacity: 0; } }
@keyframes drift { 0% { transform: translateY(0) scale(1); } 50% { transform: translateY(-16px) scale(1.02); } 100% { transform: translateY(0) scale(1); } }
@keyframes gridScroll { 0% { transform: rotate(-0.8deg) scale(1.03) translateY(0); } 100% { transform: rotate(-0.8deg) scale(1.03) translateY(-10%); } }
@keyframes fadeInUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
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
  .nominee-btn {
    padding: 12px 14px;
    font-size: 14px;
    gap: 10px;
  }
  .scroll-list {
    max-height: 280px;
  }
  .admin-cat-row {
    padding: 10px 12px;
  }
  .badge {
    font-size: 10px;
    padding: 3px 10px;
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
  .nom-chip {
    font-size: 11px;
    padding: 3px 8px;
  }
}
`;


