"use server";

import { createClient } from "@/lib/supabase/server";

export type DMThreadRow = {
  id: string;
  last_message_at: string;
  other_user_id: string;
  other_display_name: string;
  last_body: string | null;
  last_at: string | null;
  unread_count: number; // placeholder (0 for now)
};

export async function dmListThreads(): Promise<DMThreadRow[]> {
  const supabase = createClient();

  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return [];

  // Get threads I’m in
  const { data: memberships, error: mErr } = await supabase
    .from("dm_thread_members")
    .select("thread_id")
    .eq("user_id", uid);

  if (mErr || !memberships?.length) return [];

  const threadIds = memberships.map((x) => x.thread_id);

  // For each thread, find the other member + last message
  const { data: members, error: memErr } = await supabase
    .from("dm_thread_members")
    .select("thread_id,user_id")
    .in("thread_id", threadIds);

  if (memErr || !members) return [];

  const otherByThread = new Map<string, string>();
  for (const row of members) {
    if (row.user_id !== uid) otherByThread.set(row.thread_id, row.user_id);
  }

  const otherIds = Array.from(new Set(Array.from(otherByThread.values())));

  const { data: profs } = await supabase
    .from("profiles")
    .select("id,display_name")
    .in("id", otherIds);

  const nameById = new Map<string, string>();
  (profs ?? []).forEach((p) => nameById.set(p.id, p.display_name));

  const { data: threads } = await supabase
    .from("dm_threads")
    .select("id,last_message_at")
    .in("id", threadIds)
    .order("last_message_at", { ascending: false });

  const { data: lastMsgs } = await supabase
    .from("dm_messages")
    .select("thread_id,body,created_at")
    .in("thread_id", threadIds)
    .order("created_at", { ascending: false });

  const lastByThread = new Map<string, { body: string; at: string }>();
  for (const msg of lastMsgs ?? []) {
    if (!lastByThread.has(msg.thread_id)) {
      lastByThread.set(msg.thread_id, { body: msg.body, at: msg.created_at });
    }
  }

  return (threads ?? []).map((t) => {
    const otherId = otherByThread.get(t.id) ?? "";
    const last = lastByThread.get(t.id) ?? null;

    return {
      id: t.id,
      last_message_at: t.last_message_at,
      other_user_id: otherId,
      other_display_name: nameById.get(otherId) ?? "Unknown",
      last_body: last?.body ?? null,
      last_at: last?.at ?? null,
      unread_count: 0,
    };
  });
}

export async function dmListDirectory(): Promise<{ id: string; display_name: string }[]> {
  const supabase = createClient();

  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return [];

  const { data } = await supabase
    .from("profiles")
    .select("id,display_name")
    .order("display_name", { ascending: true });

  return (data ?? []).filter((p) => p.id !== uid);
}

export async function dmCreateOrGetThread(otherUserId: string): Promise<string> {
  const supabase = createClient();

  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) throw new Error("Not signed in.");

  // Check if a 1:1 thread already exists between uid and otherUserId:
  // Find threads where uid is member, then see if otherUserId also member.
  const { data: myThreads } = await supabase
    .from("dm_thread_members")
    .select("thread_id")
    .eq("user_id", uid);

  const threadIds = (myThreads ?? []).map((x) => x.thread_id);

  if (threadIds.length) {
    const { data: shared } = await supabase
      .from("dm_thread_members")
      .select("thread_id,user_id")
      .in("thread_id", threadIds)
      .eq("user_id", otherUserId);

    const existing = shared?.[0]?.thread_id;
    if (existing) return existing;
  }

  // Create new thread
  const { data: threadRow, error: tErr } = await supabase
    .from("dm_threads")
    .insert({})
    .select("id")
    .single();

  if (tErr || !threadRow?.id) throw new Error(tErr?.message ?? "Failed creating thread.");

  const tid = threadRow.id;

  // Add myself (policy allows)
  const { error: meErr } = await supabase
    .from("dm_thread_members")
    .insert({ thread_id: tid, user_id: uid });

  if (meErr) throw new Error(meErr.message);

  // Add other (policy allows because I'm already a member)
  const { error: otherErr } = await supabase
    .from("dm_thread_members")
    .insert({ thread_id: tid, user_id: otherUserId });

  if (otherErr) throw new Error(otherErr.message);

  return tid;
}

export async function dmListMessages(threadId: string): Promise<
  { id: string; sender_id: string; body: string; created_at: string }[]
> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("dm_messages")
    .select("id,sender_id,body,created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function dmSendMessage(threadId: string, body: string): Promise<void> {
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
