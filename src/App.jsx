import { useEffect, useMemo, useState } from "react";
import Login from "./Login.jsx";
import NominationSite from "./NominationSite.jsx";
import VotingSite from "./VotingSite.jsx";
import { rosterToMap } from "./rosterStore.js";
import { loadRoster } from "./roster.js";

const tabs = [
  { id: "nominate", label: "Nominate", icon: "📝" },
  { id: "vote", label: "Vote + Results", icon: "🗳️" },
];

export default function App() {
  const initial = useMemo(() => {
    const h = (window.location.hash || "").replace("#", "");
    return h === "vote" ? "vote" : "nominate";
  }, []);

  const [tab, setTab] = useState(initial);
  const [me, setMe] = useState(null); // { roll }
  const [roster] = useState(() => loadRoster());
  const rosterMap = useMemo(() => rosterToMap(roster), [roster]);

  useEffect(() => {
    window.location.hash = tab === "vote" ? "#vote" : "#nominate";
  }, [tab]);

  if (!me) {
    return (
      <Login
        onLogin={(info) => setMe(info)}
      />
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <div
        style={{
          position: "fixed",
          top: 14,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
          display: "flex",
          gap: 8,
          padding: 8,
          borderRadius: 999,
          background: "rgba(0,0,0,.25)",
          border: "1px solid rgba(255,255,255,.12)",
          backdropFilter: "blur(10px)",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              cursor: "pointer",
              border: "none",
              padding: "10px 14px",
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 13,
              color: tab === t.id ? "#141018" : "rgba(255,255,255,.75)",
              background:
                tab === t.id
                  ? "linear-gradient(135deg, #f5c842, #e8a800)"
                  : "rgba(255,255,255,.06)",
              boxShadow: tab === t.id ? "0 10px 24px rgba(0,0,0,.35)" : "none",
            }}
          >
            <span style={{ marginRight: 8 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Render selected screen */}
      <div style={{ width: "100%", height: "100%" }}>
        {tab === "nominate"
          ? <NominationSite me={me} roster={roster} rosterMap={rosterMap} />
          : <VotingSite me={me} roster={roster} rosterMap={rosterMap} />}
      </div>
    </div>
  );
}

