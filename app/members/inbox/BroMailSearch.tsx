"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function BroMailSearch() {
  const router = useRouter();
  const sp = useSearchParams();

  const currentQ = sp.get("q") || "";
  const box = (sp.get("box") || "inbox") as "inbox" | "sent";

  const [value, setValue] = useState(currentQ);

  const href = useMemo(() => {
    const params = new URLSearchParams();
    params.set("box", box);
    if (value.trim()) params.set("q", value.trim());
    return `/members/inbox?${params.toString()}`;
  }, [value, box]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.push(href);
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search broMAIL"
        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm outline-none placeholder:text-white/35"
      />
      <button
        type="submit"
        className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
      >
        Search
      </button>
    </form>
  );
}
