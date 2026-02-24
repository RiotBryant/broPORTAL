"use client";

import { useMemo, useState } from "react";
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

  // honeypot (bots fill it, humans never see it)
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

  const canSubmit =
    form.full_name.trim().length >= 2 &&
    form.email.trim().includes("@") &&
    form.looking_for.trim().length >= 10 &&
    form.why_brother_collective.trim().length >= 10 &&
    form.agree_confidentiality &&
    status.kind !== "submitting";

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Honeypot: if filled, silently "succeed" (bot)
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
      // Common: duplicate same day (unique index)
      const msg =
        error.message.includes("access_requests_email_day_uniq")
          ? "We already received a request from this email today. If you need to update something, email us."
          : error.message;

      setStatus({ kind: "error", message: msg });
      return;
    }

    setStatus({ kind: "success" });
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <div className="text-sm tracking-wide text-neutral-400">
            broTher collecTive
          </div>
          <h1 className="mt-2 text-3xl font-semibold leading-tight">
            Request Access
          </h1>
          <p className="mt-3 text-neutral-300">
            Built on presence, not noise. Brotherhood without performance.
          </p>
          <p className="mt-3 text-sm text-neutral-400">
            Requests are reviewed manually to keep the space safe and intentional.
          </p>
        </div>

        {status.kind === "success" ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
            <h2 className="text-xl font-semibold">Request received.</h2>
            <p className="mt-2 text-neutral-300">
              You’ll hear back after review. If you don’t hear back soon, email us from the site.
            </p>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-neutral-800 bg-neutral-900/30 p-6 shadow-lg"
          >
            {/* Honeypot (hidden) */}
            <div className="hidden">
              <label>
                Company
                <input
                  value={form.company}
                  onChange={(e) => update("company", e.target.value)}
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Full name" required>
                <input
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 outline-none focus:border-neutral-600"
                  value={form.full_name}
                  onChange={(e) => update("full_name", e.target.value)}
                  placeholder="First + last"
                  autoComplete="name"
                />
              </Field>

              <Field label="Preferred name">
                <input
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 outline-none focus:border-neutral-600"
                  value={form.preferred_name}
                  onChange={(e) => update("preferred_name", e.target.value)}
                  placeholder="What should we call you?"
                />
              </Field>

              <Field label="Email" required>
                <input
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 outline-none focus:border-neutral-600"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="you@email.com"
                  autoComplete="email"
                />
              </Field>

              <Field label="Phone (optional)">
                <input
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 outline-none focus:border-neutral-600"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="(###) ###-####"
                  autoComplete="tel"
                />
              </Field>

              <Field label="Location (general)">
                <input
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 outline-none focus:border-neutral-600"
                  value={form.location}
                  onChange={(e) => update("location", e.target.value)}
                  placeholder="City / State"
                />
              </Field>

              <Field label="Referred by (if applicable)">
                <input
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 outline-none focus:border-neutral-600"
                  value={form.referred_by}
                  onChange={(e) => update("referred_by", e.target.value)}
                  placeholder="Name or @handle"
                />
              </Field>
            </div>

            <div className="mt-4 grid gap-4">
              <Field label="What are you looking for right now?" required>
                <textarea
                  className="min-h-[110px] w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 outline-none focus:border-neutral-600"
                  value={form.looking_for}
                  onChange={(e) => update("looking_for", e.target.value)}
                  placeholder="A steady room. Accountability. Support through transition and life. Say it straight."
                />
              </Field>

              <Field label="Why Brother Collective specifically?" required>
                <textarea
                  className="min-h-[110px] w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 outline-none focus:border-neutral-600"
                  value={form.why_brother_collective}
                  onChange={(e) => update("why_brother_collective", e.target.value)}
                  placeholder="What made you choose this space?"
                />
              </Field>

              <label className="mt-1 flex items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-950/40 p-4">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={form.agree_confidentiality}
                  onChange={(e) => update("agree_confidentiality", e.target.checked)}
                />
                <span className="text-sm text-neutral-300">
                  I understand this is a respectful, confidential space and I’m willing to follow structure.
                </span>
              </label>

              {status.kind === "error" && (
                <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-200">
                  {status.message}
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="rounded-xl bg-neutral-50 px-5 py-3 font-semibold text-neutral-950 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {status.kind === "submitting" ? "Submitting…" : "Submit request"}
              </button>

              <p className="text-xs text-neutral-500">
                Don’t overshare. Keep it high level. You’ll get next steps after review.
              </p>
            </div>
          </form>
        )}
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
      <div className="mb-2 text-sm text-neutral-300">
        {label} {required ? <span className="text-neutral-500">*</span> : null}
      </div>
      {children}
    </label>
  );
}
