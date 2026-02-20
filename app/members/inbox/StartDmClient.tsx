"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient"; // adjust if needed

type ProfileLite = {
  id: string;
  display_name: string | null;
  full_name: string | null;
  email: string | null;
};

export default function StartDmClient() {
  const router = useRouter();
  const [me, setMe] = useState<string>("");
  const [members, setMembers] = useState<ProfileLite[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) return;
      setMe(uid);

      const { data: profs } = await supabase
        .from("profiles")
        .select("id, display_name, full_name, email")
        .order("display_name", { ascending: true })
        .limit(200);

      setMembers((profs || []).filter((p: any) => p.id !== uid));
    })();
  }, []);

  const labelFor = (p: ProfileLite) =>
    p.display_name || p.full_name || p.email || p.id;

  async function start() {
    if (!selectedUserId) return;

    const { data, error } = await supabase.rpc("get_or_create_dm_thread", {
      other_user: selectedUserId,
    });

    if (error) {
      console.error(error);
      alert("Couldn’t start DM. This is usually RLS or the RPC function missing.");
      return;
    }

    router.push(`/members/dm/${data}`);
  }

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-medium">Start a broMAIL</div>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#0b0b12] px-3 py-2 text-sm text-white outline-none"
        >
          <option value="">Choose a member…</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {labelFor(m)}
            </option>
          ))}
        </select>

        <button
          onClick={start}
          disabled={!selectedUserId}
          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-40"
        >
          Start
        </button>
      </div>
    </div>
  );
}
