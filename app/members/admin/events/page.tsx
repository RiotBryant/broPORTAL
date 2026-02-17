"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { getMyRole, isAdminRole, requireUser, type Role } from "@/lib/store";

type EventRow = {
  id: string;
  title: string;
  starts_at: string;
  location: string | null;
  description: string | null;
  is_active: boolean;
};

export default function AdminEventsPage() {
  const [role, setRole] = useState<Role>("member");
  const isAdmin = useMemo(() => isAdminRole(role), [role]);

  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("Weekly Meeting");
  const [startsAt, setStartsAt] = useState(""); // local datetime input string
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  async function refresh() {
    setLoading(true);

    const r = await getMyRole();
    setRole(r);

    const { data, error } = await supabase
      .from("events")
      .select("id,title,starts_at,location,description,is_active")
      .order("starts_at", { ascending: true });

    if (error) console.error(error);
    setEvents((data ?? []) as EventRow[]);
    setLoading(false);
  }

  useEffect(() => {
    refresh().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createEvent() {
    if (!isAdmin) return alert("Admins only.");

    if (!title.trim()) return alert("Title required");
    if (!startsAt) return alert("Start time required");

    // startsAt from <input type="datetime-local"> is local; convert to ISO
    const iso = new Date(startsAt).toISOString();
    const user = await requireUser();

    const { error } = await supabase.from("events").insert({
      title: title.trim(),
      starts_at: iso,
      location: location.trim() || null,
      description: description.trim() || null,
      is_active: true,
      created_by: user.id,
    });

    if (error) return alert(error.message);

    setLocation("");
    setDescription("");
    await refresh();
  }

  async function setActiveOnly(id: string) {
    if (!isAdmin) return;

    // Make this the only active event (simple “set next event” behavior)
    const { error: offErr } = await supabase
      .from("events")
      .update({ is_active: false })
      .neq("id", id);

    if (offErr) return alert(offErr.message);

    const { error: onErr } = await supabase
      .from("events")
      .update({ is_active: true })
      .eq("id", id);

    if (onErr) return alert(onErr.message);

    await refresh();
  }

  async function toggleActive(id: string, next: boolean) {
    if (!isAdmin) return;

    const { error } = await supabase.from("events").update({ is_active: next }).eq("id", id);
    if (error) return alert(error.message);
    await refresh();
  }

  return (
    <div style={{ padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Admin: Events</div>
          <div style={{ opacity: 0.7, marginTop: 4 }}>
            Set the next meeting Countdown shows.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link className="pill" href="/members">← Back</Link>
        </div>
      </div>

      {!isAdmin ? (
        <div className="card" style={{ marginTop: 14, padding: 14 }}>
          Admins only.
        </div>
      ) : (
        <div className="card" style={{ marginTop: 14, padding: 14 }}>
          <div style={{ fontWeight: 900 }}>Create Event</div>

          <div style={{ display: "grid", gap: 10, marginTop: 10, maxWidth: 520 }}>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
            <input className="input" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location (optional)" />
            <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" />
            <button className="btn btnPrimary" onClick={createEvent}>Create</button>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 14, padding: 14 }}>
        <div style={{ fontWeight: 900 }}>All Events</div>
        <div style={{ opacity: 0.7, marginTop: 4 }}>
          {loading ? "Loading…" : "Click “Set as Next” to make Countdown use it."}
        </div>

        <div style={{ marginTop: 10, borderTop: "1px solid rgba(255,255,255,0.10)" }}>
          {events.map((e) => (
            <div
              key={e.id}
              style={{
                padding: "10px 0",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 900 }}>
                  {e.title} {e.is_active ? <span style={{ opacity: 0.7 }}>(active)</span> : null}
                </div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  {new Date(e.starts_at).toLocaleString()} {e.location ? `• ${e.location}` : ""}
                </div>
              </div>

              {isAdmin ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <button className="btn btnPrimary" onClick={() => setActiveOnly(e.id)}>
                    Set as Next
                  </button>
                  <button className="btn btnGhost" onClick={() => toggleActive(e.id, !e.is_active)}>
                    {e.is_active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              ) : null}
            </div>
          ))}
          {events.length === 0 && !loading ? <div style={{ padding: "10px 0", opacity: 0.7 }}>No events yet.</div> : null}
        </div>
      </div>
    </div>
  );
}
