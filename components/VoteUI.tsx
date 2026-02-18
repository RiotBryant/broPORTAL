"use client";

import * as React from "react";

type PollOption = { id: string; label: string };
type Poll = { question: string; options: PollOption[] };

function getPoll(): Poll {
  // Minimal default poll (you can wire to Supabase later without breaking build)
  return {
    question: "Vote",
    options: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
      { id: "maybe", label: "Maybe" },
    ],
  };
}

export default function VoteUI() {
  const poll = React.useMemo(() => getPoll(), []);
  const [picked, setPicked] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  function submit() {
    if (!picked) return;
    // Live-safe placeholder: persists in-memory only (no build-breaking undefineds)
    setSubmitted(true);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white">
      <div className="text-lg font-semibold">{poll.question}</div>

      <div className="mt-4 grid gap-2">
        {poll.options.map((o) => {
          const active = picked === o.id;
          return (
            <button
              key={o.id}
              onClick={() => setPicked(o.id)}
              className="w-full rounded-xl border border-white/10 px-3 py-2 text-left text-sm hover:border-white/20"
              style={{ background: active ? "rgba(255,255,255,0.08)" : "transparent" }}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm hover:bg-white/15 disabled:opacity-50"
          onClick={submit}
          disabled={!picked || submitted}
        >
          {submitted ? "Voted" : "Submit Vote"}
        </button>

        <button
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          onClick={() => {
            setPicked(null);
            setSubmitted(false);
          }}
        >
          Reset
        </button>
      </div>

      {submitted ? (
        <div className="mt-3 text-xs text-white/60">
          Recorded locally. If you want this to write to Supabase, tell me which table you want for polls/votes.
        </div>
      ) : null}
    </div>
  );
}
