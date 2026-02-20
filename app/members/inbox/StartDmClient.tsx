"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type ProfileLite = {
  id: string;
  display_name: string | null;
  full_name: string | null;
  email: string | null;
};

function pickName(p: ProfileLite | null) {
  return p?.display_name || p?.full_name || p?.email || "broTHER";
}

export default function StartDmClient({ otherUserId }: { otherUserId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setErr(null);
      setLoading(true);

      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) return router.replace("/login?redirect=/members/directory");

      const { data: u } = await supabase.auth.getUser();
      const meId = u.user?.id;
      if (!meId) return router.replace("/login?redirect=/members/directory");

      if (!otherUserId) {
        setErr("Missing recipient.");
        setLoading(false);
        return;
      }

      try {
        // If a thread already exists with BOTH members, use it
        const { data: myThreads } = await supabase
          .from("dm_thread_members")
          .select("thread_id")
          .eq("user_id", meId);

        const threadIds = (myThreads || []).map((r: any) => r.thread_id).filter(Boolean);

        if (threadIds.length > 0) {
          const { data: members } = await supabase
            .from("dm_thread_members")
            .select("thread_id, user_id")
            .in("thread_id", threadIds);

          const byThread = new Map<string, Set<string>>();
          for (const m of members || []) {
            if (!m?.thread_id || !m?.user_id) continue;
            if (!byThread.has(m.thread_id)) byThread.set(m.thread_id, new Set());
            byThread.get(m.thread_id)!.add(m.user_id);
          }

          const existing = Array.from(byThread.entries()).find(([_, set]) => {
            return set.has(meId) && set.has(otherUserId);
          });

          if (existing?.[0]) {
            router.replace(`/members/inbox/${existing[0]}`);
            return;
          }
        }

        // Otherwise create a new thread + memberships
        const { data: newThread, error: tErr } = await supabase
          .from("dm_threads")
          .insert({})
          .select("id")
          .single();

        if (tErr) throw tErr;

        const threadId = (newThread as any).id as string;

        const { error: mErr } = await supabase.from("dm_thread_members").insert([
          { thread_id: threadId, user_id: meId },
          { thread_id: threadId, user_id: otherUserId },
        ]);

        if (mErr) throw mErr;

        // Mark as read right away for me
        await supabase.from("dm_thread_reads").upsert(
          { thread_id: threadId, user_id: meId, last_read_at: new Date().toISOString() },
          { onConflict: "thread_id,user_id" }
        );

        router.replace(`/members/inbox/${threadId}`);
      } catch (e: any) {
        setErr(e?.message ?? "Couldn’t start broMAIL.");
        setLoading(false);
      }
    })();
  }, [otherUserId, router]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm text-white/80">
        {loading ? "Opening broMAIL…" : "Ready."}
      </div>
      {err ? <div className="mt-2 text-sm text-red-300">{err}</div> : null}
    </div>
  );
}
