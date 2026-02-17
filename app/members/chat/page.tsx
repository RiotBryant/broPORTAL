
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type MessageRow = {
  id: string;
  content: string;
  created_at: string;
  // Supabase join is coming back as an array in your setup
  profiles?: { username: string | null }[] | null;
};

export default function BroChat() {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [text, setText] = useState("");
  const [me, setMe] = useState<any>(null);
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (!mounted) return;

      if (userErr) console.error(userErr);
      const user = userData.user;
      setMe(user);

      if (!user) {
        setLoading(false);
        return;
      }

      // Your roles are in user_roles, not profiles.role (based on your screenshot)
     const { data: roleRow, error: roleErr } = await supabase
  .from("user_roles")
  .select("role")
  .eq("user_id", user.id)
  .maybeSingle();

if (roleErr) console.error(roleErr);
setRole(roleRow?.role || "member");

      const { data: initialMessages, error: msgErr } = await supabase
        .from("group_messages")
        .select("id, content, created_at, profiles(username)")
        .order("created_at", { ascending: true });

      if (msgErr) console.error(msgErr);

      setMessages((initialMessages as MessageRow[]) || []);
      setLoading(false);
    }

    init();

    const channel = supabase
      .channel("brochat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_messages" },
        async () => {
          // IMPORTANT: realtime payload doesn't include joined profile
          // simplest reliable move: refetch list
          const { data, error } = await supabase
            .from("group_messages")
            .select("id, content, created_at, profiles(username)")
            .order("created_at", { ascending: true });

          if (error) console.error(error);
          setMessages((data as MessageRow[]) || []);
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  async function send() {
    const msg = text.trim();
    if (!msg || !me) return;

    const { error } = await supabase.from("group_messages").insert({
      user_id: me.id,
      content: msg,
    });

    if (error) console.error(error);
    setText("");
  }

  async function del(id: string) {
    const { error } = await supabase.from("group_messages").delete().eq("id", id);
    if (error) console.error(error);

    setMessages((prev) => prev.filter((m) => m.id !== id));
  }

  if (loading) return <p style={{ padding: 48 }}>Loading chat...</p>;

  return (
    <main style={{ padding: 48 }}>
      <h1>broChAT</h1>

      {messages.map((m) => {
        const username = m.profiles?.[0]?.username || "member";
        return (
          <div key={m.id} style={{ marginBottom: 8 }}>
            <b>{username}:</b> {m.content}
            {["admin", "superadmin"].includes(role) && (
              <button style={{ marginLeft: 8 }} onClick={() => del(m.id)}>
                x
              </button>
            )}
          </div>
        );
      })}

      <div style={{ marginTop: 16 }}>
        <input value={text} onChange={(e) => setText(e.target.value)} />
        <button onClick={send} style={{ marginLeft: 8 }}>
          Send
        </button>
      </div>
    </main>
  );
}
