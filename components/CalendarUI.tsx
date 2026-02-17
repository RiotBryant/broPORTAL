"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type CalendarEvent = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_time: string; // ISO
  end_time: string; // ISO
  all_day: boolean;
  created_at: string;
};

type EventForm = {
  id?: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD (local)
  start: string; // HH:MM
  end: string; // HH:MM
  allDay: boolean;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toYMD(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function addMonths(d: Date, delta: number) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

function startOfWeekSunday(d: Date) {
  const dd = new Date(d);
  dd.setHours(0, 0, 0, 0);
  dd.setDate(dd.getDate() - dd.getDay());
  return dd;
}

function endOfWeekSaturday(d: Date) {
  const dd = new Date(d);
  dd.setHours(23, 59, 59, 999);
  dd.setDate(dd.getDate() + (6 - dd.getDay()));
  return dd;
}

/**
 * Create a local datetime from YYYY-MM-DD + HH:MM, then return ISO string.
 * NOTE: This stores an absolute moment (timestamptz), based on the user's local time.
 */
function localDateTimeToISO(dateYMD: string, timeHM: string) {
  const [y, m, day] = dateYMD.split("-").map(Number);
  const [hh, mm] = timeHM.split(":").map(Number);
  const dt = new Date(y, m - 1, day, hh, mm, 0, 0);
  return dt.toISOString();
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatMonthTitle(d: Date) {
  return d.toLocaleString(undefined, { month: "long", year: "numeric" });
}

function formatTimeRange(ev: CalendarEvent) {
  const start = new Date(ev.start_time);
  const end = new Date(ev.end_time);

  if (ev.all_day) return "All day";

  const s = start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const e = end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return `${s}–${e}`;
}

function classNames(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

export default function CalendarUI() {
  const supabase = useMemo(() => createClientComponentClient(), []);

  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(1);
    return d;
  });

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EventForm>({
    title: "",
    description: "",
    date: toYMD(new Date()),
    start: "09:00",
    end: "10:00",
    allDay: false,
  });

  const [authUserId, setAuthUserId] = useState<string | null>(null);

  const visibleRange = useMemo(() => {
    const mStart = startOfMonth(monthCursor);
    const mEnd = endOfMonth(monthCursor);
    const rangeStart = startOfWeekSunday(mStart);
    const rangeEnd = endOfWeekSaturday(mEnd);
    return { rangeStart, rangeEnd };
  }, [monthCursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const d = new Date(ev.start_time);
      const key = toYMD(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
      const arr = map.get(key) ?? [];
      arr.push(ev);
      map.set(key, arr);
    }
    // sort each day by start time
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => +new Date(a.start_time) - +new Date(b.start_time));
      map.set(k, arr);
    }
    return map;
  }, [events]);

  const gridDays = useMemo(() => {
    const days: Date[] = [];
    const { rangeStart, rangeEnd } = visibleRange;

    const cur = new Date(rangeStart);
    cur.setHours(0, 0, 0, 0);

    while (cur <= rangeEnd) {
      days.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  }, [visibleRange]);

  async function loadUserAndEvents() {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser();

      if (authErr) throw authErr;
      if (!user) {
        setAuthUserId(null);
        setEvents([]);
        setLoading(false);
        return;
      }
      setAuthUserId(user.id);

      const { rangeStart, rangeEnd } = visibleRange;

      // Fetch events that overlap the visible range:
      // start_time <= rangeEnd AND end_time >= rangeStart
      const { data, error: evErr } = await supabase
        .from("calendar_events")
        .select("*")
        .lte("start_time", rangeEnd.toISOString())
        .gte("end_time", rangeStart.toISOString())
        .order("start_time", { ascending: true });

      if (evErr) throw evErr;

      setEvents((data ?? []) as CalendarEvent[]);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load calendar events.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUserAndEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthCursor]);

  // Optional: live updates (insert/update/delete) for the visible range
  useEffect(() => {
    if (!authUserId) return;

    const channel = supabase
      .channel("calendar_events_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "calendar_events" },
        () => {
          // keep it simple: refetch when any change occurs
          loadUserAndEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUserId, visibleRange.rangeStart.toISOString(), visibleRange.rangeEnd.toISOString()]);

  function openCreate(day: Date) {
    const ymd = toYMD(day);
    setSelectedDay(day);
    setForm({
      title: "",
      description: "",
      date: ymd,
      start: "09:00",
      end: "10:00",
      allDay: false,
    });
    setModalOpen(true);
  }

  function openEdit(ev: CalendarEvent) {
    const start = new Date(ev.start_time);
    const end = new Date(ev.end_time);

    const date = toYMD(new Date(start.getFullYear(), start.getMonth(), start.getDate()));
    const startHM = `${pad2(start.getHours())}:${pad2(start.getMinutes())}`;
    const endHM = `${pad2(end.getHours())}:${pad2(end.getMinutes())}`;

    setSelectedDay(start);
    setForm({
      id: ev.id,
      title: ev.title,
      description: ev.description ?? "",
      date,
      start: startHM,
      end: endHM,
      allDay: ev.all_day,
    });
    setModalOpen(true);
  }

  async function saveEvent() {
    if (!authUserId) {
      setError("You must be signed in to create events.");
      return;
    }

    const title = form.title.trim();
    if (!title) {
      setError("Title is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let startISO = localDateTimeToISO(form.date, form.start);
      let endISO = localDateTimeToISO(form.date, form.end);

      if (form.allDay) {
        // Store as midnight-to-23:59 of that day (local) -> absolute ISO
        startISO = localDateTimeToISO(form.date, "00:00");
        endISO = localDateTimeToISO(form.date, "23:59");
      } else {
        // basic validation: end must be after start
        if (+new Date(endISO) <= +new Date(startISO)) {
          setError("End time must be after start time.");
          setSaving(false);
          return;
        }
      }

      const payload = {
        title,
        description: form.description.trim() ? form.description.trim() : null,
        start_time: startISO,
        end_time: endISO,
        all_day: form.allDay,
      };

      if (form.id) {
        const { error: upErr } = await supabase
          .from("calendar_events")
          .update(payload)
          .eq("id", form.id);

        if (upErr) throw upErr;
      } else {
        const { error: insErr } = await supabase.from("calendar_events").insert(payload);
        if (insErr) throw insErr;
      }

      setModalOpen(false);
      await loadUserAndEvents();
    } catch (e: any) {
      setError(e?.message ?? "Failed to save event.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteEvent() {
    if (!form.id) return;
    setSaving(true);
    setError(null);
    try {
      const { error: delErr } = await supabase.from("calendar_events").delete().eq("id", form.id);
      if (delErr) throw delErr;

      setModalOpen(false);
      await loadUserAndEvents();
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete event.");
    } finally {
      setSaving(false);
    }
  }

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const weekDayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 active:scale-[0.99]"
            onClick={() => setMonthCursor((d) => addMonths(d, -1))}
            aria-label="Previous month"
          >
            ←
          </button>
          <button
            className="px-3 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 active:scale-[0.99]"
            onClick={() => setMonthCursor((d) => addMonths(d, 1))}
            aria-label="Next month"
          >
            →
          </button>
          <button
            className="px-3 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 active:scale-[0.99]"
            onClick={() => {
              const d = new Date();
              d.setHours(0, 0, 0, 0);
              d.setDate(1);
              setMonthCursor(d);
            }}
          >
            Today
          </button>
        </div>

        <div className="text-lg font-semibold">{formatMonthTitle(monthCursor)}</div>

        <div className="text-sm text-neutral-500">
          {authUserId ? "Signed in" : "Sign in to create events"}
        </div>
      </div>

      {/* Error / Loading */}
      {error && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {loading && (
        <div className="mb-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
          Loading…
        </div>
      )}

      {/* Calendar grid */}
      <div className="rounded-2xl border border-neutral-200 overflow-hidden">
        {/* Weekday header */}
        <div className="grid grid-cols-7 bg-neutral-50 border-b border-neutral-200">
          {weekDayLabels.map((w) => (
            <div key={w} className="px-3 py-2 text-xs font-semibold text-neutral-600">
              {w}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {gridDays.map((day) => {
            const inMonth = day.getMonth() === monthCursor.getMonth();
            const isToday = isSameDay(day, today);
            const key = toYMD(day);
            const dayEvents = eventsByDay.get(key) ?? [];

            return (
              <div
                key={key}
                className={classNames(
                  "min-h-[120px] border-b border-neutral-200 border-r border-neutral-200 last:border-r-0",
                  !inMonth && "bg-neutral-50/60"
                )}
              >
                <div className="flex items-center justify-between px-2 pt-2">
                  <div
                    className={classNames(
                      "text-xs font-semibold px-2 py-1 rounded-lg",
                      isToday ? "bg-black text-white" : "text-neutral-700"
                    )}
                  >
                    {day.getDate()}
                  </div>
                  <button
                    className="text-xs px-2 py-1 rounded-lg border border-neutral-200 hover:bg-neutral-50 active:scale-[0.99]"
                    onClick={() => openCreate(day)}
                    title="Add event"
                  >
                    + Add
                  </button>
                </div>

                <div className="px-2 pb-2 mt-2 space-y-1">
                  {dayEvents.slice(0, 4).map((ev) => (
                    <button
                      key={ev.id}
                      className="w-full text-left rounded-lg border border-neutral-200 hover:bg-neutral-50 px-2 py-1"
                      onClick={() => openEdit(ev)}
                      title="Edit event"
                    >
                      <div className="text-xs font-semibold truncate">{ev.title}</div>
                      <div className="text-[11px] text-neutral-600 truncate">
                        {formatTimeRange(ev)}
                      </div>
                    </button>
                  ))}
                  {dayEvents.length > 4 && (
                    <div className="text-[11px] text-neutral-500 px-1">
                      +{dayEvents.length - 4} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onMouseDown={(e) => {
            // click outside to close
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-neutral-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
              <div className="font-semibold">
                {form.id ? "Edit event" : "New event"}{" "}
                <span className="text-sm font-normal text-neutral-500">
                  {selectedDay ? toYMD(selectedDay) : form.date}
                </span>
              </div>
              <button
                className="px-2 py-1 rounded-lg hover:bg-neutral-100"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="px-4 py-4 space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <label className="text-xs font-semibold text-neutral-700">Title</label>
                <input
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Meeting / appointment / reminder"
                />
              </div>

              <div className="grid grid-cols-1 gap-2">
                <label className="text-xs font-semibold text-neutral-700">Description</label>
                <textarea
                  className="w-full min-h-[90px] rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional notes"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid grid-cols-1 gap-2">
                  <label className="text-xs font-semibold text-neutral-700">Date</label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  />
                </div>

                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-2 text-sm text-neutral-700 select-none">
                    <input
                      type="checkbox"
                      checked={form.allDay}
                      onChange={(e) => setForm((f) => ({ ...f, allDay: e.target.checked }))}
                    />
                    All day
                  </label>
                </div>
              </div>

              {!form.allDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid grid-cols-1 gap-2">
                    <label className="text-xs font-semibold text-neutral-700">Start</label>
                    <input
                      type="time"
                      className="w-full rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
                      value={form.start}
                      onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <label className="text-xs font-semibold text-neutral-700">End</label>
                    <input
                      type="time"
                      className="w-full rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
                      value={form.end}
                      onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-neutral-200">
              <div className="flex items-center gap-2">
                {form.id && (
                  <button
                    className="px-3 py-2 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
                    onClick={deleteEvent}
                    disabled={saving}
                  >
                    Delete
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-2 rounded-xl bg-black text-white hover:opacity-90 disabled:opacity-50"
                  onClick={saveEvent}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
