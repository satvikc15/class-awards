import { useEffect, useMemo, useState } from "react";
import Login from "./Login.jsx";
import NominationSite from "./NominationSite.jsx";
import VotingSite from "./VotingSite.jsx";
import { rosterToMap } from "./rosterStore.js";
import { loadRoster } from "./roster.js";

const tabs = [
  { id: "nominate", label: "Nominate" },
  { id: "vote", label: "Vote + Results" },
];

export default function App() {
  const initial = useMemo(() => {
    const h = (window.location.hash || "").replace("#", "");
    return h === "vote" ? "vote" : "nominate";
  }, []);

  const [tab, setTab] = useState(initial);
  const [me, setMe] = useState(null);
  const [roster] = useState(() => loadRoster());
  const rosterMap = useMemo(() => rosterToMap(roster), [roster]);

  useEffect(() => {
    window.location.hash = tab === "vote" ? "#vote" : "#nominate";
  }, [tab]);

  if (!me) {
    return <Login onLogin={(info) => setMe(info)} />;
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
        {tabs.map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                cursor: "pointer",
                border: "1px solid rgba(255,255,255,.2)",
                padding: "10px 22px",
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 13,
                color: isActive ? "#fff" : "rgba(255,255,255,.6)",
                background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                boxShadow: isActive ? "0 24px 60px rgba(0,0,0,.55)" : "none",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div style={{ width: "100%", height: "100%" }}>
        {tab === "nominate"
          ? <NominationSite me={me} roster={roster} rosterMap={rosterMap} />
          : <VotingSite me={me} roster={roster} rosterMap={rosterMap} />}
      </div>
    </div>
  );
}
