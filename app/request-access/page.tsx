"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

type FormState = {
  full_name: string;
  preferred_name: string;
  email: string;
  phone: string;
  location: string;
  referred_by: string;
  looking_for: string;
  why_brother_collective: string;
  agree_confidentiality: boolean;

  // honeypot
  company: string;
};

export default function RequestAccessPage() {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(url, key);
  }, []);

  const [form, setForm] = useState<FormState>({
    full_name: "",
    preferred_name: "",
    email: "",
    phone: "",
    location: "",
    referred_by: "",
    looking_for: "",
    why_brother_collective: "",
    agree_confidentiality: false,
    company: "",
  });

  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "submitting" }
    | { kind: "success" }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  const canSubmit =
    form.full_name.trim().length >= 2 &&
    form.email.trim().includes("@") &&
    form.looking_for.trim().length >= 10 &&
    form.why_brother_collective.trim().length >= 10 &&
    form.agree_confidentiality &&
    status.kind !== "submitting";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Bot trap
    if (form.company.trim().length > 0) {
      setStatus({ kind: "success" });
      return;
    }

    setStatus({ kind: "submitting" });

    const payload = {
      full_name: form.full_name.trim(),
      preferred_name: form.preferred_name.trim() || null,
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim() || null,
      location: form.location.trim() || null,
      referred_by: form.referred_by.trim() || null,
      looking_for: form.looking_for.trim(),
      why_brother_collective: form.why_brother_collective.trim(),
      agree_confidentiality: form.agree_confidentiality,
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

  return (
    <div className="min-h-screen w-full bg-[#05050a] text-white">
      {/* subtle background glow */}
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-[120px]" />
        <div className="absolute -bottom-40 right-[-120px] h-[520px] w-[520px] rounded-full bg-white/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-5 py-10">
        <div className="w-full max-w-xl">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="text-xs tracking-[0.35em] text-white/45">broTHER collecTive</div>
            <h1 className="mt-2 text-3xl font-semibold">Request Access</h1>
            <p className="mt-2 text-sm text-white/65">
              Built on presence, not noise. Brotherhood without performance.
            </p>
          </div>

          {/* Card */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur">
            {/* Top row actions */}
            <div className="mb-5 flex items-center justify-between">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition"
              >
                ← Back to Login
              </Link>

              <div className="text-xs text-white/45">Reviewed manually</div>
            </div>

            {status.kind === "success" ? (
              <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
                <div className="text-lg font-semibold">Request received.</div>
                <p className="mt-2 text-sm text-white/70">
                  You’ll hear back after review. Keep an eye on your email.
                </p>
                <div className="mt-4">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 transition"
                  >
                    Return to Login
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                {/* honeypot */}
                <div className="hidden">
                  <label>
                    Company
                    <input value={form.company} onChange={(e) => update("company", e.target.value)} />
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Full name" required>
                    <input
                      value={form.full_name}
                      onChange={(e) => update("full_name", e.target.value)}
                      placeholder="First + last"
                      autoComplete="name"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Preferred name">
                    <input
                      value={form.preferred_name}
                      onChange={(e) => update("preferred_name", e.target.value)}
                      placeholder="What should we call you?"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Email" required>
                    <input
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="you@email.com"
                      autoComplete="email"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Phone (optional)">
                    <input
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      placeholder="(###) ###-####"
                      autoComplete="tel"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Location (general)">
                    <input
                      value={form.location}
                      onChange={(e) => update("location", e.target.value)}
                      placeholder="City / State"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Referred by (if applicable)">
                    <input
                      value={form.referred_by}
                      onChange={(e) => update("referred_by", e.target.value)}
                      placeholder="Name or @handle"
                      className={inputClass}
                    />
                  </Field>
                </div>

                <Field label="What are you looking for right now?" required>
                  <textarea
                    value={form.looking_for}
                    onChange={(e) => update("looking_for", e.target.value)}
                    placeholder="A steady room. Accountability. Support. Keep it high level."
                    className={textareaClass}
                  />
                </Field>

                <Field label="Why Brother Collective specifically?" required>
                  <textarea
                    value={form.why_brother_collective}
                    onChange={(e) => update("why_brother_collective", e.target.value)}
                    placeholder="What made you choose this space?"
                    className={textareaClass}
                  />
                </Field>

                <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <input
                    type="checkbox"
                    checked={form.agree_confidentiality}
                    onChange={(e) => update("agree_confidentiality", e.target.checked)}
                    className="mt-1 h-4 w-4"
                  />
                  <span className="text-sm text-white/75">
                    I understand this is a respectful, confidential space and I’m willing to follow structure.
                  </span>
                </label>

                {status.kind === "error" ? (
                  <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-100">
                    {status.message}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {status.kind === "submitting" ? "Submitting…" : "Submit request"}
                </button>

                <p className="text-xs text-white/45">
                  Don’t overshare. Keep it high level. You’ll get next steps after review.
                </p>
              </form>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-white/35">
            If you were sent here automatically, logging in will return you to the page you tried to open.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-xs tracking-wide text-white/60">
        {label} {required ? <span className="text-white/35">*</span> : null}
      </div>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/12 bg-black/25 px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/25 focus:bg-black/35 transition";

const textareaClass =
  "min-h-[110px] w-full rounded-xl border border-white/12 bg-black/25 px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/25 focus:bg-black/35 transition";
