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

/* storage keys — must match nomination site */
const NK          = "ca_noms_v3";
const PHASE_KEY   = "ca_phase_v3";
const FINALIST_K  = "ca_finalists_v3";
const VOTES_K     = "ca_votes_v3";
const VOTED_K     = "ca_voted_v3";
const ADMIN_PASS  = "awards2025";

const toTitle = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());
const getTop3 = (obj) =>
  Object.entries(obj || {}).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n]) => n);

/* ── Main component ──────────────────────────────────── */
export default function VotingSite() {
  const [initializing, setInitializing] = useState(true);
  const [phase, setPhase]           = useState("nominating"); // nominating | voting | results
  const [finalists, setFinalists]   = useState({});
  const [allVotes, setAllVotes]     = useState({});

  // mode: hub | admin-login | admin | student-login | voting | voted | results
  const [mode, setMode]             = useState("hub");
  const [adminPass, setAdminPass]   = useState("");
  const [adminErr, setAdminErr]     = useState("");
  const [nominations, setNominations] = useState({});

  const [studentName, setStudentName] = useState("");
  const [nameErr, setNameErr]         = useState("");
  const [votes, setVotes]             = useState({});
  const [voteIdx, setVoteIdx]         = useState(0);
  const [busy, setBusy]               = useState(false);

  useEffect(() => { init(); }, []);

  const init = async () => {
    try {
      const pr = await window.storage.get(PHASE_KEY, true);
      const p  = pr ? pr.value : "nominating";
      setPhase(p);
      if (p === "voting" || p === "results") {
        try { const r = await window.storage.get(FINALIST_K, true); if (r) setFinalists(JSON.parse(r.value)); } catch {}
        try { const r = await window.storage.get(VOTES_K, true);    if (r) setAllVotes(JSON.parse(r.value));  } catch {}
      }
    } catch {}
    setInitializing(false);
  };

  /* ── ADMIN ── */
  const handleAdminLogin = async () => {
    if (adminPass !== ADMIN_PASS) { setAdminErr("Wrong password"); return; }
    try { const r = await window.storage.get(NK, true); if (r) setNominations(JSON.parse(r.value)); } catch {}
    setMode("admin");
  };

  const finalizeNominations = async () => {
    setBusy(true);
    const computed = {};
    for (const c of CATEGORIES) computed[c.id] = getTop3(nominations[c.id]);
    await window.storage.set(FINALIST_K, JSON.stringify(computed), true);
    await window.storage.set(PHASE_KEY, "voting", true);
    setFinalists(computed);
    setPhase("voting");
    setBusy(false);
    alert("✅ Voting phase is now OPEN. Students can vote!");
  };

  const lockVoting = async () => {
    await window.storage.set(PHASE_KEY, "results", true);
    try { const r = await window.storage.get(VOTES_K, true); if (r) setAllVotes(JSON.parse(r.value)); } catch {}
    setPhase("results");
    alert("🏆 Voting locked! Results are visible.");
  };

  const refreshVotes = async () => {
    try { const r = await window.storage.get(VOTES_K, true); if (r) setAllVotes(JSON.parse(r.value)); } catch {}
  };

  /* ── STUDENT VOTING ── */
  const handleStudentStart = async () => {
    const n = studentName.trim();
    if (!n) { setNameErr("Please enter your name"); return; }
    setBusy(true);
    try {
      const r = await window.storage.get(VOTED_K, true);
      const list = r ? JSON.parse(r.value) : [];
      if (list.some((x) => x.toLowerCase() === n.toLowerCase())) {
        setNameErr("You have already voted!");
        setBusy(false); return;
      }
    } catch {}
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
      let vdata = {};
      try { const r = await window.storage.get(VOTES_K, true); if (r) vdata = JSON.parse(r.value); } catch {}
      for (const [cid, nominee] of Object.entries(finalVotes)) {
        if (!vdata[cid]) vdata[cid] = {};
        vdata[cid][nominee] = (vdata[cid][nominee] || 0) + 1;
      }
      await window.storage.set(VOTES_K, JSON.stringify(vdata), true);

      let list = [];
      try { const r = await window.storage.get(VOTED_K, true); if (r) list = JSON.parse(r.value); } catch {}
      list.push(studentName.trim());
      await window.storage.set(VOTED_K, JSON.stringify(list), true);

      setMode("voted");
    } catch { alert("Vote failed, please try again."); }
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
        <button className="btn-ghost" onClick={() => setMode("admin-login")} style={{ width: "100%", marginTop: 4 }}>
          🔒 Admin Panel
        </button>
      </div>
    </Shell>
  );

  /* ─ ADMIN LOGIN ─ */
  if (mode === "admin-login") return (
    <Shell><style>{css}</style>
      <div className="card fade-in" style={{ maxWidth: 380, textAlign: "center" }}>
        <div style={{ fontSize: 48 }}>🔒</div>
        <h2 className="title" style={{ fontSize: "1.5rem", marginTop: 8 }}>Admin Access</h2>
        <input
          className="field"
          type="password"
          placeholder="Enter admin password"
          value={adminPass}
          onChange={(e) => { setAdminPass(e.target.value); setAdminErr(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
          style={{ textAlign: "center", marginTop: 24 }}
        />
        {adminErr && <p className="err">{adminErr}</p>}
        <button className="btn-gold" onClick={handleAdminLogin} style={{ width: "100%", marginTop: 12 }}>
          Login
        </button>
        <button className="btn-ghost" onClick={() => setMode("hub")} style={{ width: "100%", marginTop: 8 }}>
          ← Back
        </button>
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
        <p className="sub">Vote for the top 3 nominees in each category</p>
        <input
          className="field"
          placeholder="Enter your full name"
          value={studentName}
          onChange={(e) => { setStudentName(e.target.value); setNameErr(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleStudentStart()}
          style={{ textAlign: "center", marginTop: 24 }}
        />
        {nameErr && <p className="err">{nameErr}</p>}
        <button className="btn-gold" onClick={handleStudentStart} disabled={busy} style={{ width: "100%", marginTop: 12 }}>
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
    const opts = finalists[cat.id] || [];
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

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24, marginBottom: 24 }}>
            {opts.length === 0 && (
              <p style={{ color: "rgba(255,255,255,.4)", fontSize: 14 }}>No nominees for this category</p>
            )}
            {opts.map((n, i) => (
              <button
                key={n}
                onClick={() => setVotes({ ...votes, [cat.id]: n })}
                className={`nominee-btn ${selected === n ? "nominee-selected" : ""}`}
              >
                <span style={{ fontSize: 20 }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                <span style={{ flex: 1, textAlign: "left" }}>{toTitle(n)}</span>
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
          Results will be announced soon. Stay tuned!
        </p>
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
                      {toTitle(n)} — {cv[n] || 0} votes
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
      background: "linear-gradient(135deg, #0a0f1e 0%, #161040 50%, #0d1f2d 100%)",
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

@keyframes fadeInUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
.fade-in { animation:fadeInUp .35s ease both; }
`;
