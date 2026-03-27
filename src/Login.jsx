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

  const backgroundTiles = Array.from({ length: 12 }, (_, i) => CLASS_PHOTOS[i % CLASS_PHOTOS.length]);

  return (
    <div className="login-app-container">
      <style>{css}</style>

      {/* Clear photo background */}
      <div className="login-bg-grid">
        {backgroundTiles.map((photo, index) => (
          <div key={index} className="login-photo-card" style={{ backgroundImage: `url(${photo})` }} />
        ))}
      </div>
      <div className="login-overlay" />

      <div className="login-content">
        <div className="login-ambient-glow login-glow-1" />
        <div className="login-ambient-glow login-glow-2" />

        <div className="login-card fade-in" style={{ maxWidth: 520, width: "100%" }}>
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
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

.login-app-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #030712;
  font-family: 'Space Grotesk', system-ui, sans-serif;
  color: #f7f8ff;
}

/* ── Clear, highlighted photo background ── */
.login-bg-grid {
  position: absolute;
  inset: -20% 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 18px;
  padding: 48px;
  transform: rotate(-0.8deg) scale(1.03);
  z-index: 0;
  pointer-events: none;
  animation: loginGridScroll 60s linear infinite;
}

.login-photo-card {
  width: 100%;
  aspect-ratio: 0.75 / 1;
  background-size: cover;
  background-position: center;
  border-radius: 26px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255,255,255,0.1);
  opacity: 1;
  filter: contrast(1.08) saturate(1.1) brightness(0.95);
  animation: loginDrift 20s ease-in-out infinite;
}
.login-photo-card:nth-child(2n) { animation-delay: -5s; animation-duration: 25s; }
.login-photo-card:nth-child(3n) { animation-delay: -10s; animation-duration: 30s; }

/* lighter overlay so photos are more visible */
.login-overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 50% 50%, rgba(3,7,18,0.55), rgba(3,7,18,0.78) 60%, rgba(3,7,18,0.92) 100%);
  z-index: 1;
  pointer-events: none;
}

.login-content {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
}

.login-ambient-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.12;
  pointer-events: none;
  z-index: 1;
}
.login-glow-1 { width: 480px; height: 480px; background: rgba(255,255,255,0.15); top: -100px; right: -80px; }
.login-glow-2 { width: 540px; height: 540px; background: rgba(255,255,255,0.06); bottom: -160px; left: -140px; }

/* ── Card ── */
.login-card {
  background: rgba(9, 12, 18, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 32px;
  padding: 42px 46px;
  min-width: 320px;
  max-width: 560px;
  backdrop-filter: blur(24px);
  box-shadow: 0 40px 120px rgba(0,0,0,0.65);
  color: #f7f8ff;
}

.login-hero-symbol {
  width: 72px;
  height: 72px;
  margin: 0 auto 24px;
  border-radius: 24px;
  border: 1px solid rgba(255,255,255,0.15);
  background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), transparent 65%);
  box-shadow: inset 0 -6px 10px rgba(0,0,0,0.3);
  position: relative;
}
.login-hero-symbol::after {
  content: "";
  position: absolute;
  inset: 18px;
  border-radius: 16px;
  background: rgba(255,255,255,0.05);
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

/* ── Animations ── */
@keyframes loginGridScroll {
  0% { transform: rotate(-0.8deg) scale(1.03) translateY(0); }
  100% { transform: rotate(-0.8deg) scale(1.03) translateY(-10%); }
}

@keyframes loginDrift {
  0% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-16px) scale(1.02); }
  100% { transform: translateY(0) scale(1); }
}

@keyframes fadeInUp { from { opacity:0; transform: translateY(18px); } to { opacity:1; transform: translateY(0); } }
.fade-in { animation: fadeInUp .35s ease both; }
`;
