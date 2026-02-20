"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

export default function SearchBar() {
  const router = useRouter();
  const sp = useSearchParams();
  const initial = useMemo(() => sp.get("q") || "", [sp]);
  const [q, setQ] = useState(initial);

  function apply() {
    const v = q.trim();
    if (!v) router.push("/members/inbox");
    else router.push(`/members/inbox?q=${encodeURIComponent(v)}`);
  }

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="Search broMAIL…"
          className="w-full rounded-xl border border-white/10 bg-[#0b0b12] px-3 py-2 text-sm text-white outline-none"
        />
        <button onClick={apply} className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black">
          Search
        </button>
      </div>
      <div className="mt-2 text-xs text-white/50">
        Tip: search a name or a word you remember.
      </div>
    </div>
  );
}
