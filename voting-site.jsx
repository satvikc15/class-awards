import { useState, useEffect } from "react";

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

const toTitle = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());
const getTop3 = (obj) =>
  Object.entries(obj || {}).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n]) => n);

/* ── Main component ──────────────────────────────────── */
export default function VotingSite({ me, rosterMap }) {
  const [initializing, setInitializing] = useState(true);
  const [phase, setPhase]           = useState("nominating"); // nominating | voting | results
  const [finalists, setFinalists]   = useState({});
  const [allVotes, setAllVotes]     = useState({});

  // mode: hub | admin | student-login | voting | voted | results
  const [mode, setMode]             = useState(me?.admin ? "admin" : "hub");
  const [adminPass, setAdminPass]   = useState("");
  const [adminErr, setAdminErr]     = useState("");
  const [nominations, setNominations] = useState({});

  const [studentName, setStudentName] = useState(me?.roll || "");
  const [nameErr, setNameErr]         = useState("");
  const [votes, setVotes]             = useState({});
  const [voteIdx, setVoteIdx]         = useState(0);
  const [busy, setBusy]               = useState(false);
  const [enc, setEnc]                 = useState("");
  const [voteFilter, setVoteFilter]   = useState("");

  useEffect(() => { init(); }, []);
  useEffect(() => {
    if (!me?.admin) return;
    setAdminPass(me?.adminPass || "");
    setMode("admin");
    // Load admin state once password is present
    if (!me?.adminPass) return;
    (async () => {
      try {
        const s = await apiPost("/api/admin/state", { adminPass: me.adminPass });
        setPhase(s.phase || "nominating");
        setNominations(s.nominations || {});
        setFinalists(s.finalists || {});
        setAllVotes(s.votes || {});
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.admin, me?.adminPass]);
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
      const r = await apiPost("/api/admin/finalize", { adminPass });
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
      const r = await apiPost("/api/admin/lock-voting", { adminPass });
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

  /* ── STUDENT VOTING ── */
  const handleStudentStart = async () => {
    const n = studentName.trim();
    if (!n) { setNameErr("Missing roll number"); return; }
    setBusy(true);
    try {
      const r = await apiGet(`/api/votes/voted/check?name=${encodeURIComponent(n)}`);
      if (r.exists) {
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
      await apiPost("/api/votes/submit", {
        user_id: studentName.trim(),
        username: rosterMap?.get(String(studentName.trim())) || "",
        votes: finalVotes,
      });

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
    <Shell><style>{css}</style>
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h1 className="title" style={{ fontSize: "1.6rem" }}>🎛️ Admin Panel</h1>
            <span className={`phase-badge phase-${phase}`}>
              {phase === "nominating" ? "Nominations Open" : phase === "voting" ? "Voting Open" : "Results Locked"}
            </span>
          </div>

          {/* Actions */}
          <div className="card" style={{ marginBottom: 16 }}>
            <p style={{ color: "rgba(255,255,255,.6)", fontSize: 13, marginBottom: 14 }}>
              Phase controls · current phase: <strong style={{ color: "#f5c842" }}>{phase}</strong>
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

          {/* Per-category nominees & vote counts */}
          <div className="scroll-list" style={{ maxHeight: 480 }}>
            {CATEGORIES.map((cat) => {
              const nomEntries = Object.entries(nominations[cat.id] || {}).sort((a, b) => b[1] - a[1]);
              const voteEntries = Object.entries(allVotes[cat.id] || {}).sort((a, b) => b[1] - a[1]);
              const f = finalists[cat.id] || [];
              return (
                <div key={cat.id} className="admin-cat-row">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span>{cat.emoji}</span>
                    <span style={{ fontWeight: 600, color: "#fff", fontSize: 14 }}>{cat.label}</span>
                  </div>
                  {phase === "nominating" && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {nomEntries.length === 0
                        ? <span className="row-skip">no nominations yet</span>
                        : nomEntries.map(([n, c]) => (
                          <span key={n} className="nom-chip">{toTitle(n)} <strong>({c})</strong></span>
                        ))}
                    </div>
                  )}
                  {(phase === "voting" || phase === "results") && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {f.map((n, i) => {
                        const vcount = (allVotes[cat.id] || {})[n] || 0;
                        return (
                          <span key={n} className={`nom-chip ${i === 0 && voteEntries[0]?.[0] === n ? "chip-lead" : ""}`}>
                            {i === 0 ? "🥇 " : i === 1 ? "🥈 " : "🥉 "}
                            {toTitle(n)} {phase === "results" ? `— ${vcount} votes` : ""}
                          </span>
                        );
                      })}
                      {f.length === 0 && <span className="row-skip">no finalists set</span>}
                    </div>
                  )}
                </div>
              );
            })}
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
          <span style={{ color: "#f5c842", fontWeight: 800 }}>{me?.roll}</span>
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
                <span style={{ fontSize: 20 }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
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
    <Shell><style>{css}</style>
      <div className="card fade-in" style={{ maxWidth: 420, textAlign: "center" }}>
        <div style={{ fontSize: 72 }}>🎊</div>
        <h2 className="title" style={{ marginTop: 12 }}>Votes Submitted!</h2>
        <p className="sub" style={{ marginTop: 8 }}>
          Thank you, <span style={{ color: "#f5c842", fontWeight: 600 }}>{studentName}</span>!<br />
          {enc || "Results will be announced soon. Stay tuned!"}
        </p>
        <div className="sparkles" aria-hidden="true" />
      </div>
    </Shell>
  );

  /* ─ PUBLIC RESULTS ─ */
  if (mode === "results") return (
    <Shell><style>{css}</style>
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
                      {i === 0 ? "🥇 " : i === 1 ? "🥈 " : "🥉 "}
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
function Shell({ children }) {
  return (
    <div style={{
      minHeight: "100vh",
      background:
        "radial-gradient(900px circle at 20% 12%, rgba(245,200,66,.12), transparent 40%)," +
        "radial-gradient(700px circle at 80% 25%, rgba(80,255,120,.10), transparent 45%)," +
        "linear-gradient(135deg, #0a0f1e 0%, #161040 50%, #0d1f2d 100%)",
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
* { box-sizing: border-box; margin:0; padding:0; }
.card {
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 24px; padding: 36px 32px;
  backdrop-filter: blur(12px); color:#fff;
}
.title { font-family:'Playfair Display',serif; font-size:2rem; font-weight:900; color:#fff; }
.sub   { color:rgba(255,255,255,.5); font-size:14px; margin-top:6px; line-height:1.5; }
.err   { color:#ff8080; font-size:13px; text-align:center; margin-top:6px; }
.hint  { color:rgba(255,255,255,.3); font-size:12px; text-align:center; margin-top:14px; }
.badge { display:inline-block; background:rgba(245,200,66,.15); border:1px solid rgba(245,200,66,.35); color:#f5c842; font-size:11px; letter-spacing:.12em; text-transform:uppercase; padding:3px 12px; border-radius:99px; margin-bottom:10px; }
.q-title { font-family:'Playfair Display',serif; font-size:1.4rem; font-weight:700; color:#fff; line-height:1.3; margin-top:4px; }

.field {
  width:100%; background:rgba(255,255,255,.08); border:1.5px solid rgba(255,255,255,.18);
  border-radius:14px; padding:14px 18px; color:#fff; font-size:16px;
  font-family:'DM Sans',sans-serif; outline:none; transition:border-color .2s; display:block;
}
.field::placeholder { color:rgba(255,255,255,.3); }
.field:focus { border-color:rgba(245,200,66,.7); }

.btn-gold {
  background:linear-gradient(135deg,#f5c842,#e8a800); color:#1a1000; font-weight:700;
  font-family:'DM Sans',sans-serif; font-size:15px; border:none; border-radius:14px;
  padding:14px 20px; cursor:pointer; transition:transform .15s,opacity .15s;
}
.btn-gold:hover { transform:translateY(-1px); }
.btn-gold:disabled { opacity:.5; cursor:default; transform:none; }
.btn-ghost {
  background:rgba(255,255,255,.07); color:rgba(255,255,255,.6); font-weight:500;
  font-family:'DM Sans',sans-serif; font-size:14px; border:1px solid rgba(255,255,255,.12);
  border-radius:14px; padding:13px 18px; cursor:pointer; transition:background .15s;
}
.btn-ghost:hover { background:rgba(255,255,255,.12); }

.nominee-btn {
  display:flex; align-items:center; gap:14px; background:rgba(255,255,255,.07);
  border:1.5px solid rgba(255,255,255,.12); border-radius:16px; padding:16px 18px;
  color:#fff; font-family:'DM Sans',sans-serif; font-size:15px; font-weight:500;
  cursor:pointer; transition:all .2s; text-align:left; width:100%;
}
.nominee-btn:hover { background:rgba(255,255,255,.12); border-color:rgba(245,200,66,.4); }
.nominee-selected { background:rgba(245,200,66,.15) !important; border-color:#f5c842 !important; color:#f5c842; }

.bar-track { height:5px; background:rgba(255,255,255,.12); border-radius:99px; overflow:hidden; }
.bar-fill  { height:100%; background:linear-gradient(90deg,#f5c842,#ff9d00); border-radius:99px; transition:width .4s ease; }

.scroll-list { display:flex; flex-direction:column; gap:8px; overflow-y:auto; }
.scroll-list::-webkit-scrollbar { width:4px; }
.scroll-list::-webkit-scrollbar-thumb { background:rgba(255,255,255,.15); border-radius:2px; }
.row-skip { color:rgba(255,255,255,.25); font-size:12px; font-style:italic; }

.admin-cat-row {
  background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08);
  border-radius:16px; padding:14px 16px;
}
.nom-chip {
  display:inline-block; background:rgba(255,255,255,.1); border-radius:99px;
  padding:4px 12px; font-size:13px; color:rgba(255,255,255,.8);
}
.chip-lead { background:rgba(245,200,66,.2); color:#f5c842; font-weight:600; }

.phase-badge { font-size:12px; font-weight:600; padding:4px 12px; border-radius:99px; }
.phase-nominating { background:rgba(80,200,255,.15); color:#50c8ff; }
.phase-voting     { background:rgba(80,255,120,.15); color:#50ff78; }
.phase-results    { background:rgba(245,200,66,.15); color:#f5c842; }

.sparkles {
  position: relative;
  width: 10px;
  height: 10px;
  margin: 22px auto 0;
  border-radius: 50%;
  background: #f5c842;
  box-shadow:
    0 -22px 0 0 rgba(245,200,66,.25),
    18px -10px 0 0 rgba(80,255,120,.18),
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

@keyframes fadeInUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
.fade-in { animation:fadeInUp .35s ease both; }
`;
