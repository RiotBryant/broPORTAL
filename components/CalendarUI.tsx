"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { getMyRole, isAdminRole, type Role } from "@/lib/store";

type CalEvent = {
  id: string;
  title: string;
  starts_at: string; // timestamptz
  description: string | null;
  flyer_url: string | null;
  created_at: string;
};

function toLocalDatetimeValue(date: Date) {
  // for <input type="datetime-local">
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export default function CalendarUI() {
  const [role, setRole] = useState<Role>("member");
  const isAdmin = useMemo(() => isAdminRole(role), [role]);

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [msg, setMsg] = useState("");

  // Create form
  const [title, setTitle] = useState("Weekly Meeting");
  const [startsAt, setStartsAt] = useState(toLocalDatetimeValue(new Date(Date.now() + 86400000)));
  const [description, setDescription] = useState("");
  const [flyerUrl, setFlyerUrl] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editStartsAt, setEditStartsAt] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editFlyerUrl, setEditFlyerUrl] = useState("");

  async function refresh() {
    setLoading(true);
    setMsg("");

    const r = await getMyRole().catch(() => "member" as Role);
    setRole(r);

    const { data, error } = await supabase
      .from("calendar_events")
      .select("id,title,starts_at,description,flyer_url,created_at")
      .order("starts_at", { ascending: true });

    if (error) {
      console.error(error);
      setMsg(error.message);
      setEvents([]);
      setLoading(false);
      return;
    }

    setEvents((data ?? []) as CalEvent[]);
    setLoading(false);
  }

  useEffect(() => {
    refresh().catch((e) => {
      console.error(e);
      setLoading(false);
      setMsg("Failed to load calendar.");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of events) {
      const d = new Date(e.starts_at);
      const key = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "2-digit", year: "numeric" });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries());
  }, [events]);

  async function createEvent() {
    if (!isAdmin) return;

    const t = title.trim();
    if (!t) return setMsg("Title is required.");

    if (!startsAt) return setMsg("Date/time is required.");

    // datetime-local is local; convert to ISO
    const iso = new Date(startsAt).toISOString();

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return setMsg("Not logged in.");

    const { error } = await supabase.from("calendar_events").insert({
      title: t,
      starts_at: iso,
      description: description.trim() || null,
      flyer_url: flyerUrl.trim() || null,
      created_by: userId,
    });

    if (error) {
      console.error(error);
      setMsg(error.message);
      return;
    }

    setDescription("");
    setFlyerUrl("");
    setMsg("Event created.");
    await refresh();
  }

  function startEdit(e: CalEvent) {
    setEditingId(e.id);
    setEditTitle(e.title);
    setEditStartsAt(toLocalDatetimeValue(new Date(e.starts_at)));
    setEditDescription(e.description ?? "");
    setEditFlyerUrl(e.flyer_url ?? "");
    setMsg("");
  }

  function cancelEdit() {
    setEditingId(null);
    setMsg("");
  }

  async function saveEdit() {
    if (!isAdmin || !editingId) return;

    const t = editTitle.trim();
    if (!t) return setMsg("Title is required.");
    if (!editStartsAt) return setMsg("Date/time is required.");

    const iso = new Date(editStartsAt).toISOString();

    const { error } = await supabase
      .from("calendar_events")
      .update({
        title: t,
        starts_at: iso,
        description: editDescription.trim() || null,
        flyer_url: editFlyerUrl.trim() || null,
      })
      .eq("id", editingId);

    if (error) {
      console.error(error);
      setMsg(error.message);
      return;
    }

    setEditingId(null);
    setMsg("Saved.");
    await refresh();
  }

  async function deleteEvent(id: string) {
    if (!isAdmin) return;
    if (!confirm("Delete this event?")) return;

    const { error } = await supabase.from("calendar_events").delete().eq("id", id);
    if (error) {
      console.error(error);
      setMsg(error.message);
      return;
    }

    setMsg("Deleted.");
    await refresh();
  }

  return (
    <div className="grid">
      {isAdmin ? (
        <div className="card">
          <div className="cardTitle">Admin: Add Calendar Event</div>
          <div className="cardDesc">Create events directly from the portal.</div>

          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
            <input
              className="input"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
            <textarea
              className="input"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (textbox)"
            />
            <input
              className="input"
              value={flyerUrl}
              onChange={(e) => setFlyerUrl(e.target.value)}
              placeholder="Flyer link (optional) — paste a URL"
            />
            <button className="btn btnPrimary" onClick={createEvent}>
              Add Event
            </button>
            {msg ? <div style={{ fontSize: 12, opacity: 0.7 }}>{msg}</div> : null}
          </div>
        </div>
      ) : null}

      <div className="card">
        <div className="cardTitle">Calendar</div>
        <div className="cardDesc">{loading ? "Loading…" : "Upcoming events and dates."}</div>

        {msg && !isAdmin ? <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>{msg}</div> : null}

        <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.10)" }}>
          {grouped.length === 0 && !loading ? (
            <div style={{ padding: "10px 0", opacity: 0.7 }}>No events yet.</div>
          ) : null}

          {grouped.map(([day, rows]) => (
            <div key={day} style={{ padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>{day}</div>

              <div style={{ display: "grid", gap: 10 }}>
                {rows.map((e) => {
                  const time = new Date(e.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

                  const isEditing = editingId === e.id;

                  return (
                    <div key={e.id} style={{ padding: 12, border: "1px solid rgba(255,255,255,0.10)", borderRadius: 16 }}>
                      {!isEditing ? (
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                            <div>
                              <div style={{ fontWeight: 900 }}>
                                {time} • {e.title}
                              </div>
                              {e.description ? (
                                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6, whiteSpace: "pre-wrap" }}>
                                  {e.description}
                                </div>
                              ) : null}
                              {e.flyer_url ? (
                                <div style={{ fontSize: 12, opacity: 0.85, marginTop: 8 }}>
                                  <a href={e.flyer_url} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>
                                    View Flyer
                                  </a>
                                </div>
                              ) : null}
                            </div>

                            {isAdmin ? (
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                                <button className="btn btnGhost" onClick={() => startEdit(e)}>
                                  Edit
                                </button>
                                <button className="btn btnGhost" onClick={() => deleteEvent(e.id)}>
                                  Delete
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontWeight: 900, marginBottom: 8 }}>Edit Event</div>
                          <div style={{ display: "grid", gap: 10 }}>
                            <input className="input" value={editTitle} onChange={(ev) => setEditTitle(ev.target.value)} />
                            <input
                              className="input"
                              type="datetime-local"
                              value={editStartsAt}
                              onChange={(ev) => setEditStartsAt(ev.target.value)}
                            />
                            <textarea
                              className="input"
                              rows={4}
                              value={editDescription}
                              onChange={(ev) => setEditDescription(ev.target.value)}
                              placeholder="Description"
                            />
                            <input
                              className="input"
                              value={editFlyerUrl}
                              onChange={(ev) => setEditFlyerUrl(ev.target.value)}
                              placeholder="Flyer link (optional)"
                            />

                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <button className="btn btnPrimary" onClick={saveEdit}>
                                Save
                              </button>
                              <button className="btn btnGhost" onClick={cancelEdit}>
                                Cancel
                              </button>
                            </div>

                            {msg ? <div style={{ fontSize: 12, opacity: 0.7 }}>{msg}</div> : null}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
