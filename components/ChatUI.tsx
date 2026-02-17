"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type ProfileMini = {
  user_id: string;
  username: string | null;
  display_name: string | null;
};

type ChatMessageRow = {
  id: string;
  created_at: string;
  room: string;
  sender_id: string;
  body: string;
};

export default function ChatUI() {
  const [loading, setLoading] = useState(true);
  const [meId, setMeId] = useState<string | null>(null);
  const [meLabel, setMeLabel] = useState<string>("You");
  const [text, setText] = useState("");
  const [items, setItems] = useState<ChatMessageRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileMini>>({});
  const [error, setError] = useState<string | null>(null);

  const room = "group";
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const ordered = useMemo(() => {
    // already ordered, but keep it stable
    return items.slice().sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
  }, [items]);

  async function loadInitial() {
    setError(null);
    setLoading(true);

    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      window.location.href = "/login";
      return;
    }

    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id ?? null;
    setMeId(uid);

    // Load my profile label
    if (uid) {
      const { data: p } = await supabase
        .from("profiles")
        .select("user_id, username, display_name")
        .eq("user_id", uid)
        .maybeSingle();

      const label = p?.display_name || p?.username || "You";
      setMeLabel(label);
      if (p?.user_id) setProfiles((m) => ({ ...m, [p.user_id]: p }));
    }

    // Load last 100 messages
    const { data: msgs, error: msgsErr } = await supabase
      .from("chat_messages")
      .select("id, created_at, room, sender_id, body")
      .eq("room", room)
      .order("created_at", { ascending: true })
      .limit(100);

    if (msgsErr) {
      setError(msgsErr.message);
      setLoading(false);
      return;
    }

    const list = (msgs ?? []) as ChatMessageRow[];
    setItems(list);

    // Fetch sender profiles for nice names
    const senderIds = Array.from(new Set(list.map((m) => m.sender_id))).filter(Boolean);
    if (senderIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, username, display_name")
        .in("user_id", senderIds);

      const map: Record<string, ProfileMini> = {};
      (profs ?? []).forEach((x: any) => (map[x.user_id] = x));
      setProfiles((prev) => ({ ...prev, ...map }));
    }

    setLoading(false);
  }

  useEffect(() => {
    loadInitial();

    // Realtime subscription: inserts only
    const channel = supabase
      .channel("room_group_chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `room=eq.${room}` },
        async (payload) => {
          const row = payload.new as ChatMessageRow;
          setItems((prev) => [...prev, row]);

          // Lazy-load profile for new sender
          if (!profiles[row.sender_id]) {
            const { data: p } = await supabase
              .from("profiles")
              .select("user_id, username, display_name")
              .eq("user_id", row.sender_id)
              .maybeSingle();

            if (p?.user_id) {
              setProfiles((prev) => ({ ...prev, [p.user_id]: p as any }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // auto scroll to bottom when messages change
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ordered.length]);

  async function send() {
    const body = text.trim();
    if (!body) return;
    if (!meId) return;

    setError(null);

    // Optimistic clear
    setText("");

    const { error: insErr } = await supabase.from("chat_messages").insert({
      room,
      sender_id: meId,
      body,
    });

    if (insErr) {
      setError(insErr.message);
      // restore draft if it failed
      setText(body);
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="cardDesc">Loading broCHAT…</div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="cardHeader">
        <div className="cardTitle">broCHAT</div>
        <div className="cardSub">Real-time group chat (members-only)</div>
      </div>

      {error ? (
        <div style={{ marginTop: 10, color: "#ff6b6b", fontSize: 13 }}>{error}</div>
      ) : null}

      <div
        style={{
          marginTop: 12,
          borderTop: "1px solid rgba(255,255,255,0.10)",
          maxHeight: 520,
          overflow: "auto",
          paddingTop: 6,
        }}
      >
        {ordered.map((m) => {
          const p = profiles[m.sender_id];
          const from = p?.display_name || p?.username || (m.sender_id === meId ? meLabel : "member");
          return (
            <div
              key={m.id}
              style={{
                padding: "10px 0",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.60)" }}>
                <b style={{ color: "rgba(255,255,255,0.9)" }}>{from}</b> •{" "}
                {new Date(m.created_at).toLocaleString()}
              </div>
              <div style={{ marginTop: 6, fontSize: 13, color: "rgba(255,255,255,0.85)" }}>
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="cardActions" style={{ marginTop: 12 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)",
            color: "white",
            outline: "none",
          }}
        />
        <button className="btn btnPrimary" onClick={send}>
          Send
        </button>

        <Link className="btn btnGhost" href="/members/inbox">
          DM Inbox
        </Link>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
        Signed in as <b style={{ color: "rgba(255,255,255,0.9)" }}>{meLabel}</b>
      </div>
    </div>
  );
}
