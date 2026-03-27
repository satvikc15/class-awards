import { useMemo, useState } from "react";

const PREFIX = "1005227290";
const ROLL_RE = /^1005227290\d{2}$/;
const ADMIN_ROLL = "1985";

const CLASS_PHOTOS = [
  "/cp1.jpeg", "/cp2.jpeg", "/cp3.jpeg", "/cp4.jpeg", "/cp5.jpeg", "/cp6.jpeg", "/cp7.jpeg"
];

export default function Login({ onLogin }) {
  const [xx, setXx] = useState("");
  const [adminStep, setAdminStep] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  // OTP flow states
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const roll = useMemo(() => `${PREFIX}${xx}`, [xx]);

  const apiPost = async (path, body) => {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      let msg = text;
      try { msg = JSON.parse(text).detail || text; } catch {}
      throw new Error(msg);
    }
    return res.json();
  };

  const startCountdown = () => {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    const digits = String(xx).replace(/\D/g, "");
    if (digits === ADMIN_ROLL) {
      setAdminStep(true);
      setErr("");
      return;
    }
    const r = roll.trim();
    if (!ROLL_RE.test(r)) {
      setErr("Roll must look like 1005227290XX (XX = two digits).");
      return;
    }

    setErr("");
    setBusy(true);
    try {
      const res = await apiPost("/api/otp/send", { roll: r });
      setSentEmail(res.email || "your registered email");
      setOtpStep(true);
      setOtpSent(true);
      startCountdown();
      window.alert(`An OTP has been sent to ${res.email || "your registered email"}. Please enter it.`);
    } catch (e) {
      setErr(e.message || "Failed to send OTP. Please try again.");
    }
    setBusy(false);
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setErr("Please enter the OTP.");
      return;
    }
    setErr("");
    setBusy(true);
    try {
      await apiPost("/api/otp/verify", { roll: roll.trim(), otp: otp.trim() });
      onLogin({ roll: roll.trim(), admin: false });
    } catch (e) {
      setErr(e.message || "Verification failed.");
    }
    setBusy(false);
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setErr("");
    setBusy(true);
    try {
      const res = await apiPost("/api/otp/send", { roll: roll.trim() });
      setSentEmail(res.email || "your registered email");
      startCountdown();
      setOtp("");
      setErr("");
      window.alert(`A new OTP has been sent to ${res.email || "your respective email"}. Please enter it.`);
    } catch (e) {
      setErr(e.message || "Failed to resend OTP.");
    }
    setBusy(false);
  };

  const handleAdminAuth = async () => {
    setErr("");
    setBusy(true);
    try {
      await apiPost("/api/admin/login", { adminPass });
      onLogin({ roll: ADMIN_ROLL, admin: true, adminPass });
    } catch {
      setErr("Wrong password.");
    }
    setBusy(false);
  };

  const resetAll = () => {
    setOtpStep(false);
    setOtp("");
    setOtpSent(false);
    setCountdown(0);
    setErr("");
  };

  // Build two reel strips — each reel has photos repeated to create seamless loop
  const reel1 = [...CLASS_PHOTOS, ...CLASS_PHOTOS, ...CLASS_PHOTOS, ...CLASS_PHOTOS];
  const reel2 = [...CLASS_PHOTOS.slice(3), ...CLASS_PHOTOS, ...CLASS_PHOTOS, ...CLASS_PHOTOS.slice(0, 3), ...CLASS_PHOTOS];

  return (
    <div className="login-app-container">
      <style>{css}</style>

      {/* LEFT: Form side */}
      <div className="login-form-side">
        <div className="login-ambient-glow login-glow-1" />
        <div className="login-ambient-glow login-glow-2" />

        <div className="login-card fade-in">
          <div style={{ textAlign: "center" }}>
            <h1 className="login-title">Class Awards</h1>
            <p style={{
              color: "rgba(255,255,255,.45)",
              fontSize: 13,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              marginTop: 8,
              fontWeight: 500,
            }}>
              AIML · Batch of 2026
            </p>
            <p style={{
              color: "rgba(255,255,255,.5)",
              fontSize: 14,
              lineHeight: 1.6,
              marginTop: 14,
              maxWidth: 380,
              marginLeft: "auto",
              marginRight: "auto",
            }}>
              Four years of late-night laughs, shared struggles, and unforgettable moments — this one's for all of us. Celebrate the people who made this journey extraordinary.
            </p>
            <div style={{ height: 1, background: "rgba(255,255,255,.08)", margin: "20px 0 16px" }} />
            <p className="login-sub">
              {otpStep
                ? "Enter the verification code sent to your email"
                : "Log in with your roll number to nominate and vote"}
            </p>
          </div>

          <div style={{ marginTop: 28 }}>
            {!otpStep ? (
              <>
                {/* Roll number input */}
                <div className="login-roll-wrap">
                  <span className="login-roll-prefix">{PREFIX}</span>
                  <input
                    className="login-roll-xx"
                    inputMode="numeric"
                    placeholder="XX"
                    value={xx}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setXx(v);
                      setErr("");
                      setAdminStep(false);
                      setAdminPass("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && !adminStep && handleSendOtp()}
                  />
                </div>

                {err && <p className="login-err">{err}</p>}

                {!adminStep ? (
                  <button
                    className="login-btn-primary"
                    onClick={handleSendOtp}
                    disabled={busy}
                    style={{ width: "100%", marginTop: 12 }}
                  >
                    {busy ? "Logging in…" : "Login →"}
                  </button>
                ) : (
                  <div style={{ marginTop: 12 }}>
                    <input
                      className="login-field"
                      type="password"
                      placeholder="Admin password"
                      value={adminPass}
                      onChange={(e) => setAdminPass(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAdminAuth()}
                      style={{ textAlign: "center" }}
                      autoFocus
                    />
                    <button
                      className="login-btn-primary"
                      onClick={handleAdminAuth}
                      disabled={busy}
                      style={{ width: "100%", marginTop: 10 }}
                    >
                      {busy ? "Checking…" : "Admin Login →"}
                    </button>
                  </div>
                )}
                <p className="login-hint" style={{ marginTop: 10 }}>
                  Format: <strong style={{ color: "rgba(255,255,255,.85)" }}>1005227290XX</strong>
                </p>
              </>
            ) : (
              <>
                {/* OTP verification step */}
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <p style={{ color: "rgba(255,255,255,.5)", fontSize: 13 }}>
                    OTP sent to <strong style={{ color: "rgba(255,255,255,.85)" }}>{sentEmail}</strong>
                  </p>
                  <p style={{ color: "rgba(255,255,255,.35)", fontSize: 12, marginTop: 4 }}>
                    Roll: <strong>{roll}</strong>
                  </p>
                </div>

                <div className="login-otp-wrap">
                  <input
                    className="login-otp-input"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setOtp(v);
                      setErr("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                    autoFocus
                  />
                </div>

                {err && <p className="login-err">{err}</p>}

                <button
                  className="login-btn-primary"
                  onClick={handleVerifyOtp}
                  disabled={busy || otp.length < 6}
                  style={{ width: "100%", marginTop: 12 }}
                >
                  {busy ? "Verifying…" : "Verify & Login →"}
                </button>

                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <button
                    className="login-btn-ghost"
                    onClick={resetAll}
                    style={{ flex: 1 }}
                  >
                    ← Back
                  </button>
                  <button
                    className="login-btn-ghost"
                    onClick={handleResendOtp}
                    disabled={countdown > 0 || busy}
                    style={{ flex: 1 }}
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Film reel side */}
      <div className="login-reel-side">
        <div className="login-reel-overlay" />
        <div className="login-reel-column reel-col-1">
          <div className="login-reel-strip reel-scroll-down">
            {reel1.map((photo, i) => (
              <div key={`r1-${i}`} className="login-reel-frame">
                <div className="login-reel-perfs">
                  <span /><span /><span /><span />
                </div>
                <div className="login-reel-img" style={{ backgroundImage: `url(${photo})` }} />
                <div className="login-reel-perfs">
                  <span /><span /><span /><span />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="login-reel-column reel-col-2">
          <div className="login-reel-strip reel-scroll-up">
            {reel2.map((photo, i) => (
              <div key={`r2-${i}`} className="login-reel-frame">
                <div className="login-reel-perfs">
                  <span /><span /><span /><span />
                </div>
                <div className="login-reel-img" style={{ backgroundImage: `url(${photo})` }} />
                <div className="login-reel-perfs">
                  <span /><span /><span /><span />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

/* ── Main split layout ── */
.login-app-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #030712;
  font-family: 'Space Grotesk', system-ui, sans-serif;
  color: #f7f8ff;
  display: flex;
}

/* ── LEFT: Form side ── */
.login-form-side {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  z-index: 2;
  background: #030712;
}

.login-ambient-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.1;
  pointer-events: none;
  z-index: 0;
}
.login-glow-1 { width: 400px; height: 400px; background: rgba(140,120,255,0.2); top: -60px; right: -40px; }
.login-glow-2 { width: 350px; height: 350px; background: rgba(255,180,120,0.12); bottom: -80px; left: -60px; }

/* ── Card ── */
.login-card {
  position: relative;
  z-index: 1;
  background: rgba(9, 12, 18, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 32px;
  padding: 42px 46px;
  max-width: 480px;
  width: 100%;
  backdrop-filter: blur(24px);
  box-shadow: 0 40px 120px rgba(0,0,0,0.65);
  color: #f7f8ff;
}

.login-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 2.3rem;
  font-weight: 600;
  text-align: center;
  letter-spacing: 0.04em;
  color: #f7f8ff;
}

.login-sub {
  text-align: center;
  color: rgba(255,255,255,0.55);
  font-size: 14px;
  margin-top: 8px;
  line-height: 1.4;
}

.login-err {
  color: rgba(255, 119, 143, 0.7);
  font-size: 13px;
  text-align: center;
  margin-top: 10px;
}

.login-hint {
  color: rgba(255,255,255,0.35);
  font-size: 12px;
  text-align: center;
  margin-top: 14px;
}

/* ── Roll input ── */
.login-roll-wrap {
  display: flex;
  align-items: stretch;
  border-radius: 16px;
  overflow: hidden;
  border: 1.5px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.04);
}
.login-roll-prefix {
  padding: 14px 16px;
  color: rgba(255,255,255,0.45);
  font-weight: 700;
  letter-spacing: .06em;
  font-size: 14px;
  border-right: 1px solid rgba(255,255,255,0.08);
  display: flex;
  align-items: center;
}
.login-roll-xx {
  flex: 1;
  min-width: 90px;
  padding: 14px 16px;
  border: none;
  outline: none;
  background: transparent;
  color: #f7f8ff;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: .12em;
  text-transform: uppercase;
  font-family: 'Space Grotesk', sans-serif;
}
.login-roll-xx::placeholder { color: rgba(255,255,255,.2); letter-spacing: .18em; }

/* ── Field ── */
.login-field {
  width: 100%;
  background: rgba(255,255,255,0.04);
  border: 1.5px solid rgba(255,255,255,0.12);
  border-radius: 16px;
  padding: 14px 18px;
  color: #f7f8ff;
  font-size: 16px;
  font-family: 'Space Grotesk', sans-serif;
  outline: none;
  transition: border-color .2s;
  display: block;
}
.login-field::placeholder { color: rgba(255,255,255,.3); }
.login-field:focus { border-color: rgba(255,255,255,.35); }

/* ── OTP input ── */
.login-otp-wrap {
  display: flex;
  justify-content: center;
}
.login-otp-input {
  width: 220px;
  padding: 18px 24px;
  border: 2px solid rgba(255,255,255,0.2);
  border-radius: 16px;
  background: rgba(255,255,255,0.04);
  color: #f7f8ff;
  font-size: 32px;
  font-weight: 900;
  letter-spacing: 0.5em;
  text-align: center;
  font-family: 'Space Grotesk', monospace;
  outline: none;
  transition: border-color .2s;
}
.login-otp-input::placeholder { color: rgba(255,255,255,.15); letter-spacing: 0.5em; }
.login-otp-input:focus { border-color: rgba(255,255,255,.5); }

/* ── Buttons ── */
.login-btn-primary {
  background: rgba(255,255,255,0.08);
  color: #f7f8ff;
  font-weight: 600;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 15px;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 18px;
  padding: 14px 24px;
  cursor: pointer;
  transition: transform .15s, opacity .15s, border-color .15s;
  box-shadow: 0 12px 28px rgba(0,0,0,0.45);
}
.login-btn-primary:hover { transform: translateY(-1px); border-color: rgba(255,255,255,0.4); }
.login-btn-primary:active { transform: translateY(1px); }
.login-btn-primary:disabled { opacity: .5; cursor: default; transform: none; }

.login-btn-ghost {
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.7);
  font-weight: 500;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 14px;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 18px;
  padding: 13px 18px;
  cursor: pointer;
  transition: background .15s, border-color .15s;
}
.login-btn-ghost:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); }
.login-btn-ghost:disabled { opacity: .45; cursor: default; }

/* ══════════════════════════════════════════════
   RIGHT: Film Reel Side
   ══════════════════════════════════════════════ */
.login-reel-side {
  position: relative;
  width: 420px;
  flex-shrink: 0;
  display: flex;
  gap: 0;
  overflow: hidden;
  background: #0a0e17;
}

/* Subtle gradient overlay so reel edges blend into dark bg */
.login-reel-overlay {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  background:
    linear-gradient(to right, rgba(3,7,18,0.95) 0%, transparent 15%, transparent 85%, rgba(3,7,18,0.6) 100%),
    linear-gradient(to bottom, rgba(3,7,18,0.7) 0%, transparent 8%, transparent 92%, rgba(3,7,18,0.7) 100%);
}

.login-reel-column {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #08090e;
}

/* The continuously scrolling strip */
.login-reel-strip {
  display: flex;
  flex-direction: column;
  gap: 0;
  will-change: transform;
}

.reel-scroll-down {
  animation: reelDown 35s linear infinite;
}
.reel-scroll-up {
  animation: reelUp 40s linear infinite;
}

/* Each frame: perforations | image | perforations */
.login-reel-frame {
  display: flex;
  align-items: stretch;
  padding: 3px 0;
  background: #0c0e14;
  border-bottom: 2px solid #111318;
}

/* Film strip perforation holes */
.login-reel-perfs {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
  width: 18px;
  flex-shrink: 0;
  padding: 6px 0;
}
.login-reel-perfs span {
  display: block;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: #1a1d26;
  border: 1px solid #22252f;
}

/* The actual photo */
.login-reel-img {
  flex: 1;
  min-height: 180px;
  background-size: cover;
  background-position: center;
  border-radius: 4px;
  margin: 2px 0;
  filter: brightness(0.85) saturate(1.1) contrast(1.05);
  transition: filter 0.4s;
}

/* ── Reel scroll keyframes ── */
@keyframes reelDown {
  0%   { transform: translateY(0); }
  100% { transform: translateY(-50%); }
}

@keyframes reelUp {
  0%   { transform: translateY(-50%); }
  100% { transform: translateY(0); }
}

/* ── Animations ── */
@keyframes fadeInUp { from { opacity:0; transform: translateY(18px); } to { opacity:1; transform: translateY(0); } }
.fade-in { animation: fadeInUp .45s ease both; }

/* ══════════════════════════════════════════════
   Responsive
   ══════════════════════════════════════════════ */
@media (max-width: 1024px) {
  .login-reel-side {
    width: 320px;
  }
  .login-reel-img {
    min-height: 150px;
  }
}

@media (max-width: 768px) {
  .login-app-container {
    flex-direction: column;
  }
  .login-form-side {
    padding: 24px 20px;
    flex: 1;
  }
  .login-reel-side {
    width: 100%;
    height: 180px;
    flex-direction: row;
    order: -1;
  }
  .login-reel-column {
    flex: 1;
  }
  .login-reel-strip {
    flex-direction: column;
  }
  .login-reel-img {
    min-height: 140px;
  }
  .login-reel-overlay {
    background:
      linear-gradient(to bottom, rgba(3,7,18,0.3) 0%, transparent 20%, transparent 70%, rgba(3,7,18,0.95) 100%),
      linear-gradient(to right, rgba(3,7,18,0.5) 0%, transparent 10%, transparent 90%, rgba(3,7,18,0.5) 100%);
  }
  .login-card {
    padding: 28px 22px;
    border-radius: 24px;
    max-width: 100%;
  }
  .login-title {
    font-size: 1.7rem;
  }
  .login-btn-primary {
    padding: 12px 18px;
    font-size: 14px;
  }
  .login-btn-ghost {
    padding: 11px 14px;
    font-size: 13px;
  }
  .login-otp-input {
    width: 180px;
    padding: 14px 18px;
    font-size: 26px;
    letter-spacing: 0.4em;
  }
}

@media (max-width: 480px) {
  .login-reel-side {
    height: 140px;
  }
  .login-reel-img {
    min-height: 110px;
  }
  .login-form-side {
    padding: 16px 14px;
  }
  .login-card {
    padding: 22px 16px;
    border-radius: 20px;
  }
  .login-title {
    font-size: 1.4rem;
  }
  .login-sub {
    font-size: 12px;
  }
  .login-roll-prefix {
    padding: 12px 10px;
    font-size: 12px;
  }
  .login-roll-xx {
    padding: 12px 10px;
    font-size: 16px;
  }
  .login-btn-primary {
    padding: 10px 14px;
    font-size: 13px;
    border-radius: 14px;
  }
  .login-btn-ghost {
    padding: 10px 12px;
    font-size: 12px;
    border-radius: 14px;
  }
  .login-otp-input {
    width: 160px;
    padding: 12px 14px;
    font-size: 22px;
    letter-spacing: 0.35em;
  }
  .login-field {
    padding: 12px 14px;
    font-size: 14px;
  }
}
`;
