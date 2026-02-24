"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type RequestForm = {
  full_name: string;
  preferred_name: string;
  email: string;
  birthday: string; // YYYY-MM-DD from <input type="date" />
  phone: string;
  location: string;
  referred_by: string;
  looking_for: string;
  why_brother_collective: string;
  agree: boolean;

  // honeypot
  company: string;
};

export default function RequestAccessPage() {
  const router = useRouter();

  const [req, setReq] = React.useState<RequestForm>({
    full_name: "",
    preferred_name: "",
    email: "",
    birthday: "",
    phone: "",
    location: "",
    referred_by: "",
    looking_for: "",
    why_brother_collective: "",
    agree: false,
    company: "",
  });

  const [status, setStatus] = React.useState<
    | { kind: "idle" }
    | { kind: "submitting" }
    | { kind: "success" }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  function setField<K extends keyof RequestForm>(key: K, value: RequestForm[K]) {
    setReq((p) => ({ ...p, [key]: value }));
  }

  const canSubmit =
    req.full_name.trim().length >= 2 &&
    req.email.trim().includes("@") &&
    req.birthday.trim().length === 10 && // YYYY-MM-DD
    req.looking_for.trim().length >= 10 &&
    req.why_brother_collective.trim().length >= 10 &&
    req.agree &&
    status.kind !== "submitting";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "submitting" });

    // honeypot bot trap
    if (req.company.trim().length > 0) {
      setStatus({ kind: "success" });
      return;
    }

    const payload = {
      full_name: req.full_name.trim(),
      preferred_name: req.preferred_name.trim() || null,
      email: req.email.trim().toLowerCase(),
      birthday: req.birthday || null, // date string accepted by Postgres date
      phone: req.phone.trim() || null,
      location: req.location.trim() || null,
      referred_by: req.referred_by.trim() || null,
      looking_for: req.looking_for.trim(),
      why_brother_collective: req.why_brother_collective.trim(),
      agree_confidentiality: req.agree,
    };

    const { error } = await supabase.from("access_requests").insert(payload);

    if (error) {
      const msg =
        error.message.includes("access_requests_email_day_uniq")
          ? "We already received a request from this email today."
          : error.message;

      setStatus({ kind: "error", message: msg });
      return;
    }

    setStatus({ kind: "success" });
  }

  const styles = `
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body { margin: 0; }

    .page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 28px;
      background:
        radial-gradient(1200px 700px at 20% 30%, rgba(90,140,255,0.35), transparent 60%),
        radial-gradient(900px 600px at 80% 70%, rgba(160,120,255,0.25), transparent 55%),
        linear-gradient(135deg, #5c7cff 0%, #7c78ff 35%, #8db8ff 100%);
    }

    .cardWrap { width: 100%; max-width: 520px; position: relative; }

    .glassShadow {
      position: absolute;
      inset: -26px;
      border-radius: 26px;
      background: rgba(255,255,255,0.10);
      filter: blur(18px);
      opacity: 0.35;
      z-index: 0;
    }

    .card {
      position: relative;
      z-index: 1;
      width: 100%;
      border-radius: 16px;
      background: rgba(255,255,255,0.92);
      border: 1px solid rgba(0,0,0,0.06);
      box-shadow: 0 18px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.35) inset;
      overflow: hidden;
    }

    .header { padding: 18px 18px 10px; text-align: center; color: #0b0b12; }
    .title { margin: 0; font-size: 14px; font-weight: 800; letter-spacing: 0.02em; }
    .subtitle { margin: 6px 0 0; font-size: 12px; color: rgba(11,11,18,0.55); }

    .body { padding: 14px 18px 18px; color: #0b0b12; }

    .topRow {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 10px;
    }

    .backBtn {
      height: 34px;
      padding: 0 12px;
      border-radius: 10px;
      border: 1px solid rgba(0,0,0,0.10);
      background: rgba(0,0,0,0.04);
      color: rgba(11,11,18,0.78);
      font-weight: 900;
      font-size: 12px;
      cursor: pointer;
    }

    .badge { font-size: 11px; font-weight: 900; color: rgba(11,11,18,0.55); }

    .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .field { margin-top: 10px; }

    .label {
      display: block;
      font-size: 11px;
      font-weight: 800;
      color: rgba(11,11,18,0.72);
      margin-bottom: 6px;
    }

    .input, .textarea {
      width: 100%;
      border-radius: 10px;
      border: 1px solid rgba(0,0,0,0.12);
      background: rgba(255,255,255,0.92);
      padding: 10px 11px;
      font-size: 13px;
      outline: none;
      color: #0b0b12;
      transition: border-color .12s ease, box-shadow .12s ease;
    }

    .textarea { min-height: 92px; resize: vertical; }

    .input:focus, .textarea:focus {
      border-color: rgba(75,120,255,0.6);
      box-shadow: 0 0 0 3px rgba(75,120,255,0.15);
    }

    .agree {
      margin-top: 12px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px solid rgba(0,0,0,0.08);
      background: rgba(0,0,0,0.03);
      color: rgba(11,11,18,0.70);
      font-size: 12px;
      font-weight: 700;
      line-height: 1.35;
    }

    .agree input { margin-top: 2px; }

    .btnPrimary {
      margin-top: 14px;
      width: 100%;
      height: 40px;
      border-radius: 10px;
      border: none;
      background: #4c78ff;
      color: white;
      font-weight: 900;
      font-size: 13px;
      cursor: pointer;
      transition: transform .12s ease, opacity .12s ease;
    }

    .btnPrimary:hover { transform: translateY(-1px); opacity: 0.95; }
    .btnPrimary:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

    .error {
      margin-top: 10px;
      border-radius: 10px;
      padding: 10px 12px;
      background: rgba(255, 70, 70, 0.10);
      border: 1px solid rgba(255, 70, 70, 0.20);
      color: rgba(150, 0, 0, 0.95);
      font-weight: 800;
      font-size: 12px;
    }

    .success {
      margin-top: 10px;
      border-radius: 10px;
      padding: 12px;
      background: rgba(60, 200, 120, 0.12);
      border: 1px solid rgba(60, 200, 120, 0.22);
      color: rgba(0, 80, 40, 0.95);
      font-weight: 900;
      font-size: 12px;
      text-align: center;
    }

    .fineprint {
      margin-top: 10px;
      font-size: 11px;
      color: rgba(11,11,18,0.55);
      line-height: 1.4;
      text-align: center;
    }

    .hidden { display: none; }
  `;

  return (
    <div className="page">
      <style>{styles}</style>

      <div className="cardWrap">
        <div className="glassShadow" />

        <div className="card">
          <div className="header">
            <div className="title">Request Access</div>
            <div className="subtitle">Built on presence, not noise • reviewed manually</div>
          </div>

          <div className="body">
            <div className="topRow">
              <button type="button" className="backBtn" onClick={() => router.push("/login")}>
                ← Back to Login
              </button>
              <div className="badge">broTHER collecTive</div>
            </div>

            {status.kind === "success" ? (
              <>
                <div className="success">Request received. You’ll hear back after review.</div>
                <div className="fineprint">Keep an eye on your email.</div>
              </>
            ) : (
              <form onSubmit={onSubmit}>
                {/* honeypot */}
                <div className="hidden">
                  <label className="label">Company</label>
                  <input
                    className="input"
                    value={req.company}
                    onChange={(e) => setField("company", e.target.value)}
                  />
                </div>

                <div className="row2">
                  <div className="field">
                    <label className="label">Legal Full Name</label>
                    <input
                      className="input"
                      placeholder="First + last"
                      value={req.full_name}
                      onChange={(e) => setField("full_name", e.target.value)}
                      autoComplete="name"
                      required
                    />
                  </div>

                  <div className="field">
                    <label className="label">Preferred name</label>
                    <input
                      className="input"
                      placeholder="What should we call you?"
                      value={req.preferred_name}
                      onChange={(e) => setField("preferred_name", e.target.value)}
                    />
                  </div>
                </div>

                <div className="row2">
                  <div className="field">
                    <label className="label">Email Address</label>
                    <input
                      className="input"
                      placeholder="you@email.com"
                      value={req.email}
                      onChange={(e) => setField("email", e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div className="field">
                    <label className="label">Birthday 00/00/0000</label>
                    <input
                      type="date"
                      className="input"
                      value={req.birthday}
                      onChange={(e) => setField("birthday", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="row2">
                  <div className="field">
                    <label className="label">Phone Number</label>
                    <input
                      className="input"
                      placeholder="(###) ###-####"
                      value={req.phone}
                      onChange={(e) => setField("phone", e.target.value)}
                      autoComplete="tel"
                    />
                  </div>

                  <div className="field">
                    <label className="label">Location (general)</label>
                    <input
                      className="input"
                      placeholder="City / State"
                      value={req.location}
                      onChange={(e) => setField("location", e.target.value)}
                    />
                  </div>
                </div>

                <div className="field">
                  <label className="label">Referred by (optional)</label>
                  <input
                    className="input"
                    placeholder="Name or @handle"
                    value={req.referred_by}
                    onChange={(e) => setField("referred_by", e.target.value)}
                  />
                </div>

                <div className="field">
                  <label className="label">What are you looking for right now?</label>
                  <textarea
                    className="textarea"
                    placeholder="A steady room. Accountability. Support. Keep it high level."
                    value={req.looking_for}
                    onChange={(e) => setField("looking_for", e.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <label className="label">Why Brother Collective specifically?</label>
                  <textarea
                    className="textarea"
                    placeholder="What made you choose this space?"
                    value={req.why_brother_collective}
                    onChange={(e) => setField("why_brother_collective", e.target.value)}
                    required
                  />
                </div>

                <label className="agree">
                  <input
                    type="checkbox"
                    checked={req.agree}
                    onChange={(e) => setField("agree", e.target.checked)}
                  />
                  <span>
                    I understand this is a respectful, confidential space and I’m willing to follow structure.
                  </span>
                </label>

                {status.kind === "error" ? <div className="error">{status.message}</div> : null}

                <button type="submit" className="btnPrimary" disabled={!canSubmit}>
                  {status.kind === "submitting" ? "Submitting…" : "Submit Request"}
                </button>

                <div className="fineprint">
                  Don’t overshare. Keep it high level. You’ll get next steps after review.
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
