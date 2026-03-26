import { useMemo, useState } from "react";

const PREFIX = "1005227290";
const ROLL_RE = /^1005227290\d{2}$/;
const ADMIN_ROLL = "1985";

export default function Login({ onLogin }) {
  const [xx, setXx] = useState("");
  const [email, setEmail] = useState("");
  const [adminStep, setAdminStep] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // OTP flow states
  const [otpStep, setOtpStep] = useState(false); // true = OTP input visible
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

  // Start countdown timer for resend
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
    if (!email.trim() || !email.includes("@")) {
      setErr("Please enter a valid email address.");
      return;
    }

    setErr("");
    setBusy(true);
    try {
      await apiPost("/api/otp/send", { roll: r, email: email.trim() });
      setOtpStep(true);
      setOtpSent(true);
      startCountdown();
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
      onLogin({ roll: roll.trim(), admin: false, email: email.trim() });
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
      await apiPost("/api/otp/send", { roll: roll.trim(), email: email.trim() });
      startCountdown();
      setOtp("");
      setErr("");
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

  return (
    <div style={{
      minHeight: "100vh",
      background:
        "radial-gradient(900px circle at 15% 10%, rgba(245,200,66,.12), transparent 40%)," +
        "radial-gradient(700px circle at 85% 20%, rgba(80,200,255,.10), transparent 45%)," +
        "linear-gradient(135deg, #0d0d1a 0%, #1a1040 50%, #0a1628 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      fontFamily: "'DM Sans', sans-serif",
      color: "#fff",
    }}>
      <style>{css}</style>

      <div className="card fade-in" style={{ maxWidth: 520, width: "100%" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 68 }}>🎓</div>
          <h1 className="title">Class Awards</h1>
          <p className="sub">
            {otpStep
              ? "Enter the verification code sent to your email"
              : "Log in with your roll number to nominate and vote"}
          </p>
        </div>

        <div style={{ marginTop: 28 }}>
          {!otpStep ? (
            <>
              {/* Roll number input */}
              <div className="roll-wrap">
                <span className="roll-prefix">{PREFIX}</span>
                <input
                  className="roll-xx"
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

              {/* Email input */}
              <input
                className="field"
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErr(""); }}
                onKeyDown={(e) => e.key === "Enter" && !adminStep && handleSendOtp()}
                style={{ textAlign: "center", marginTop: 12 }}
              />

              {err && <p className="err">{err}</p>}

              {!adminStep ? (
                <button
                  className="btn-gold"
                  onClick={handleSendOtp}
                  disabled={busy}
                  style={{ width: "100%", marginTop: 12 }}
                >
                  {busy ? "Sending OTP…" : "Send OTP →"}
                </button>
              ) : (
                <div style={{ marginTop: 12 }}>
                  <input
                    className="field"
                    type="password"
                    placeholder="Admin password"
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdminAuth()}
                    style={{ textAlign: "center" }}
                    autoFocus
                  />
                  <button
                    className="btn-gold"
                    onClick={handleAdminAuth}
                    disabled={busy}
                    style={{ width: "100%", marginTop: 10 }}
                  >
                    {busy ? "Checking…" : "Admin Login →"}
                  </button>
                </div>
              )}
              <p className="hint" style={{ marginTop: 10 }}>
                Format: <strong style={{ color: "#f5c842" }}>1005227290XX</strong>
              </p>
            </>
          ) : (
            <>
              {/* OTP verification step */}
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <p style={{ color: "rgba(255,255,255,.5)", fontSize: 13 }}>
                  OTP sent to <strong style={{ color: "#f5c842" }}>{email}</strong>
                </p>
                <p style={{ color: "rgba(255,255,255,.35)", fontSize: 12, marginTop: 4 }}>
                  Roll: <strong>{roll}</strong>
                </p>
              </div>

              <div className="otp-wrap">
                <input
                  className="otp-input"
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

              {err && <p className="err">{err}</p>}

              <button
                className="btn-gold"
                onClick={handleVerifyOtp}
                disabled={busy || otp.length < 6}
                style={{ width: "100%", marginTop: 12 }}
              >
                {busy ? "Verifying…" : "Verify & Login →"}
              </button>

              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button
                  className="btn-ghost"
                  onClick={resetAll}
                  style={{ flex: 1 }}
                >
                  ← Back
                </button>
                <button
                  className="btn-ghost"
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
  );
}

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
.title  { font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 900; text-align: center; color: #fff; }
.sub    { text-align: center; color: rgba(255,255,255,.55); font-size: 14px; margin-top: 8px; line-height: 1.4; }
.err    { color: #ff8080; font-size: 13px; text-align: center; margin-top: 10px; }
.hint   { color: rgba(255,255,255,.35); font-size: 12px; text-align: center; margin-top: 14px; line-height: 1.45; }
.badge  { display: inline-block; background: rgba(245,200,66,.15); border: 1px solid rgba(245,200,66,.35); color: #f5c842; font-size: 11px; letter-spacing: 0.10em; text-transform: uppercase; padding: 5px 12px; border-radius: 99px; }
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
  font-weight: 800;
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
  color: rgba(255,255,255,.7);
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 14px;
  padding: 13px 18px;
  cursor: pointer;
  transition: background .15s, opacity .15s;
}
.btn-ghost:hover { background: rgba(255,255,255,.12); }
.btn-ghost:disabled { opacity: .45; cursor: default; }
.divider {
  height: 1px;
  background: rgba(255,255,255,.10);
  margin: 22px 0;
}
.roll-wrap {
  display: flex;
  align-items: stretch;
  border-radius: 16px;
  overflow: hidden;
  border: 1.5px solid rgba(255,255,255,.18);
  background: rgba(255,255,255,.08);
}
.roll-prefix {
  padding: 14px 16px;
  color: rgba(255,255,255,.55);
  font-weight: 700;
  letter-spacing: .06em;
  font-size: 14px;
  border-right: 1px solid rgba(255,255,255,.12);
}
.roll-xx {
  flex: 1;
  min-width: 90px;
  padding: 14px 16px;
  border: none;
  outline: none;
  background: transparent;
  color: #fff;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: .12em;
  text-transform: uppercase;
}
.roll-xx::placeholder { color: rgba(255,255,255,.25); letter-spacing: .18em; }
.otp-wrap {
  display: flex;
  justify-content: center;
}
.otp-input {
  width: 220px;
  padding: 18px 24px;
  border: 2px solid rgba(245,200,66,.5);
  border-radius: 16px;
  background: rgba(255,255,255,.08);
  color: #f5c842;
  font-size: 32px;
  font-weight: 900;
  letter-spacing: 0.5em;
  text-align: center;
  font-family: 'DM Sans', monospace;
  outline: none;
  transition: border-color .2s;
}
.otp-input::placeholder { color: rgba(245,200,66,.2); letter-spacing: 0.5em; }
.otp-input:focus { border-color: #f5c842; }
@keyframes fadeInUp { from { opacity:0; transform: translateY(18px); } to { opacity:1; transform: translateY(0); } }
.fade-in { animation: fadeInUp .35s ease both; }
`;
