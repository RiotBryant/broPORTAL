"use server";

import { createClient } from "@/lib/supabase/server";

export type DirectoryUser = { user_id: string; display_name: string };

export type ThreadListItem = {
  id: string;
  other_user_id: string;
  other_display_name: string;
  last_body: string | null;
  last_at: string | null;
};

export async function dmListDirectory(): Promise<DirectoryUser[]> {
  const supabase = createClient();

  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, display_name")
    .order("display_name", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).filter((p) => p.user_id !== uid);
}

export async function dmCreateOrGetThread(otherUserId: string): Promise<string> {
  const supabase = createClient();

  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) throw new Error("Not signed in.");

  // Find my threads
  const { data: myRows, error: myErr } = await supabase
    .from("dm_thread_members")
    .select("thread_id")
    .eq("user_id", uid);

  if (myErr) throw new Error(myErr.message);

  const myThreadIds = (myRows ?? []).map((r) => r.thread_id);

  // Check if any of my threads also has the other user
  if (myThreadIds.length) {
    const { data: shared, error: shErr } = await supabase
      .from("dm_thread_members")
      .select("thread_id")
      .in("thread_id", myThreadIds)
      .eq("user_id", otherUserId)
      .limit(1);

    if (shErr) throw new Error(shErr.message);

    const existing = shared?.[0]?.thread_id;
    if (existing) return existing;
  }

  // Create new thread
  const { data: tRow, error: tErr } = await supabase
    .from("dm_threads")
    .insert({})
    .select("id")
    .single();

  if (tErr) throw new Error(tErr.message);
  const tid = tRow.id as string;

  // Add me first (allowed by policy user_id=auth.uid())
  const { error: meErr } = await supabase
    .from("dm_thread_members")
    .insert({ thread_id: tid, user_id: uid });

  if (meErr) throw new Error(meErr.message);

  // Add other (allowed after I'm a member OR if your policy allows member-adds)
  const { error: otherErr } = await supabase
    .from("dm_thread_members")
    .insert({ thread_id: tid, user_id: otherUserId });

  if (otherErr) throw new Error(otherErr.message);

  return tid;
}

export async function dmListThreads(): Promise<ThreadListItem[]> {
  const supabase = createClient();

  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return [];

  // Get my thread ids
  const { data: myRows, error: myErr } = await supabase
    .from("dm_thread_members")
    .select("thread_id")
    .eq("user_id", uid);

  if (myErr) throw new Error(myErr.message);

  const threadIds = (myRows ?? []).map((r) => r.thread_id);
  if (!threadIds.length) return [];

  // Get all members for those threads so we can find the "other"
  const { data: members, error: memErr } = await supabase
    .from("dm_thread_members")
    .select("thread_id, user_id")
    .in("thread_id", threadIds);

  if (memErr) throw new Error(memErr.message);

  const otherByThread = new Map<string, string>();
  for (const row of members ?? []) {
    if (row.user_id !== uid) otherByThread.set(row.thread_id, row.user_id);
  }

  const otherIds = Array.from(new Set(Array.from(otherByThread.values())));

  const { data: profs, error: pErr } = await supabase
    .from("profiles")
    .select("user_id, display_name")
    .in("user_id", otherIds);

  if (pErr) throw new Error(pErr.message);

  const nameById = new Map<string, string>();
  (profs ?? []).forEach((p) => nameById.set(p.user_id, p.display_name));

  // Last message per thread (simple: pull recent messages and take first per thread)
  const { data: lastMsgs, error: mErr } = await supabase
    .from("dm_messages")
    .select("thread_id, body, created_at")
    .in("thread_id", threadIds)
    .order("created_at", { ascending: false });

  if (mErr) throw new Error(mErr.message);

  const lastByThread = new Map<string, { body: string; at: string }>();
  for (const msg of lastMsgs ?? []) {
    if (!lastByThread.has(msg.thread_id)) {
      lastByThread.set(msg.thread_id, { body: msg.body, at: msg.created_at });
    }
  }

  // Order threads by dm_threads.last_message_at
  const { data: threads, error: tErr } = await supabase
    .from("dm_threads")
    .select("id, last_message_at")
    .in("id", threadIds)
    .order("last_message_at", { ascending: false });

  if (tErr) throw new Error(tErr.message);

  return (threads ?? []).map((t) => {
    const otherId = otherByThread.get(t.id) ?? "";
    const otherName = nameById.get(otherId) ?? "Unknown";
    const last = lastByThread.get(t.id) ?? null;

    return {
      id: t.id,
      other_user_id: otherId,
      other_display_name: otherName,
      last_body: last?.body ?? null,
      last_at: last?.at ?? null,
    };
  });
}

export async function dmListMessages(threadId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("dm_messages")
    .select("id, sender_id, body, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function dmSendMessage(threadId: string, body: string) {
  const supabase = createClient();

  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) throw new Error("Not signed in.");

  const clean = body.trim();
  if (!clean) return;

  const { error } = await supabase
    .from("dm_messages")
    .insert({ thread_id: threadId, sender_id: uid, body: clean });

  if (error) throw new Error(error.message);
}
