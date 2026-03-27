import { useEffect, useMemo, useState } from "react";
import Login from "./Login.jsx";
import NominationSite from "./NominationSite.jsx";
import VotingSite from "./VotingSite.jsx";
import { rosterToMap } from "./rosterStore.js";
import { loadRoster } from "./roster.js";

const appStyles = `
  .app-topbar {
    position: fixed;
    top: 14px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 50;
    display: flex;
    gap: 8px;
    padding: 8px;
    border-radius: 999px;
    background: rgba(0,0,0,.25);
    border: 1px solid rgba(255,255,255,.12);
    backdrop-filter: blur(10px);
  }
  .app-topbar-btn {
    cursor: pointer;
    border: 1px solid rgba(255,255,255,.2);
    padding: 10px 22px;
    border-radius: 999px;
    font-weight: 600;
    font-size: 13px;
    font-family: 'Space Grotesk', sans-serif;
    transition: background .15s, color .15s;
  }
  .app-logout-btn {
    position: fixed;
    top: 18px;
    right: 18px;
    z-index: 51;
    cursor: pointer;
    border: 1px solid rgba(255,255,255,.15);
    padding: 8px 16px;
    border-radius: 999px;
    font-weight: 600;
    font-size: 12px;
    font-family: 'Space Grotesk', sans-serif;
    color: rgba(255,255,255,.6);
    background: rgba(0,0,0,.3);
    backdrop-filter: blur(10px);
    transition: background .15s, color .15s, border-color .15s;
  }
  .app-logout-btn:hover {
    background: rgba(255,80,80,.15);
    border-color: rgba(255,80,80,.4);
    color: rgba(255,120,120,.9);
  }

  @media (max-width: 768px) {
    .app-topbar {
      top: 10px;
      gap: 4px;
      padding: 6px;
    }
    .app-topbar-btn {
      padding: 8px 14px;
      font-size: 12px;
    }
    .app-logout-btn {
      top: 12px;
      right: 10px;
      padding: 6px 12px;
      font-size: 11px;
    }
  }
  @media (max-width: 480px) {
    .app-topbar {
      top: 8px;
      gap: 3px;
      padding: 4px;
    }
    .app-topbar-btn {
      padding: 7px 12px;
      font-size: 11px;
    }
    .app-logout-btn {
      top: 10px;
      right: 8px;
      padding: 5px 10px;
      font-size: 10px;
    }
  }
`;

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

  if (me.admin) {
    return <VotingSite me={me} roster={roster} rosterMap={rosterMap} onLogout={() => setMe(null)} />;
  }

  const handleLogout = () => setMe(null);

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <style>{appStyles}</style>
      {/* Top bar: tabs + logout */}
      <div className="app-topbar">
        {tabs.map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="app-topbar-btn"
              style={{
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

      {/* Logout button */}
      <button
        className="app-logout-btn"
        onClick={handleLogout}
      >
        Logout
      </button>

      <div style={{ width: "100%", height: "100%" }}>
        {tab === "nominate"
          ? <NominationSite me={me} roster={roster} rosterMap={rosterMap} />
          : <VotingSite me={me} roster={roster} rosterMap={rosterMap} />}
      </div>
    </div>
  );
}
