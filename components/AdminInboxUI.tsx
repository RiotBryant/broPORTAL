"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Role = "new" | "member" | "admin" | "superadmin" | "god";
const rank = (r: Role) =>
  r === "new" ? 0 : r === "member" ? 1 : r === "admin" ? 2 : r === "superadmin" ? 3 : 4;

type AccessRequest = {
  id: string;
  created_at: string;
  status: "pending" | "approved" | "denied";
  full_name: string;
  email: string;
  message: string;
};

export default function AdminInboxUI({ requestId }: { requestId?: string }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role>("member");
  const [items, setItems] = useState<AccessRequest[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = useMemo(() => rank(role) >= rank("admin"), [role]);

  async function load() {
    setError(null);
    setLoading(true);

    // Must be logged in
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      router.replace("/login");
      return;
    }

    // Get role
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id;
    if (!uid) {
      router.replace("/login");
      return;
    }

    const { data: roleRow, error: roleErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .maybeSingle();

    if (roleErr) {
      setError(roleErr.message);
      setLoading(false);
      return;
    }

    const myRole = (roleRow?.role ?? "member") as Role;
    setRole(myRole);

    // Only admins can see inbox
    if (rank(myRole) < rank("admin")) {
      setItems([]);
      setLoading(false);
      return;
    }

    // Load access requests
    const { data, error: reqErr } = await supabase
      .from("access_requests")
      .select("id, created_at, status, full_name, email, message")
      .order("created_at", { ascending: false });

    if (reqErr) {
      setError(reqErr.message);
      setLoading(false);
      return;
    }

    setItems((data ?? []) as AccessRequest[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const item = useMemo(() => {
    if (!requestId) return null;
    return items.find((x) => x.id === requestId) ?? null;
  }, [items, requestId]);

  async function act(id: string, action: "approve" | "deny") {
    setError(null);

    const res = await fetch(`/api/admin/access-requests/${id}/${action}`, {
      method: "POST",
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      setError(txt || `Failed to ${action}.`);
      return;
    }

    // Refresh list + bounce back to inbox list view
    await load();
    router.push("/members/admin/inbox");
  }

  const styles = `
    :root { color-scheme: dark; }
    .wrap{ width:100%; }
    .grid{
      display:grid;
      grid-template-columns: 360px 1fr;
      gap:16px;
      align-items:start;
    }
    @media (max-width: 960px){
      .grid{ grid-template-columns: 1fr; }
    }
    .panel{
      border-radius:16px;
      border:1px solid rgba(255,255,255,0.10);
      background: rgba(255,255,255,0.04);
      overflow:hidden;
    }
    .head{
      padding:14px 14px;
      border-bottom:1px solid rgba(255,255,255,0.10);
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:10px;
    }
    .title{ font-weight:900; letter-spacing:-0.02em; }
    .sub{ font-size:12px; color:rgba(255,255,255,0.55); }
    .list{ display:flex; flex-direction:column; }
    .row{
      padding:12px 14px;
      border-bottom:1px solid rgba(255,255,255,0.08);
      cursor:pointer;
      transition: background .12s ease;
    }
    .row:hover{ background: rgba(255,255,255,0.05); }
    .rowTop{ display:flex; justify-content:space-between; gap:12px; }
    .name{ font-weight:800; font-size:13px; }
    .email{ font-size:12px; color:rgba(255,255,255,0.55); margin-top:2px; }
    .badge{
      font-size:11px;
      border-radius:999px;
      padding:6px 10px;
      border:1px solid rgba(255,255,255,0.14);
      background: rgba(0,0,0,0.2);
      color: rgba(255,255,255,0.8);
      height: fit-content;
      white-space: nowrap;
    }
    .detail{ padding:14px; }
    .kv{ font-size:12px; color:rgba(255,255,255,0.6); margin-top:8px; }
    .msg{
      margin-top:10px;
      padding:12px;
      border-radius:14px;
      border:1px solid rgba(255,255,255,0.10);
      background: rgba(0,0,0,0.22);
      white-space: pre-wrap;
      font-size:13px;
      line-height:1.35;
    }
    .actions{ display:flex; gap:10px; margin-top:12px; flex-wrap:wrap; }
    .btn{
      border-radius:999px;
      padding:10px 12px;
      font-size:13px;
      font-weight:800;
      border:1px solid rgba(255,255,255,0.14);
      background: rgba(255,255,255,0.06);
      color: rgba(255,255,255,0.9);
      cursor:pointer;
      transition: transform .12s ease, background .12s ease;
    }
    .btn:hover{ transform: translateY(-1px); background: rgba(255,255,255,0.08); }
    .btnPrimary{ background: #fff; color:#000; border-color: transparent; }
    .error{ color:#ff6b6b; font-size:13px; padding: 10px 14px; }
    .empty{ padding:14px; font-size:13px; color:rgba(255,255,255,0.6); }
  `;

  if (loading) {
    return <div style={{ opacity: 0.7, fontSize: 13 }}>Loading…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="wrap">
        <style>{styles}</style>
        <div className="panel">
          <div className="head">
            <div>
              <div className="title">Admin Inbox</div>
              <div className="sub">Admins only</div>
            </div>
          </div>
          <div className="empty">You don’t have admin access.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap">
      <style>{styles}</style>

      {error && <div className="error">{error}</div>}

      <div className="grid">
        {/* LIST */}
        <div className="panel">
          <div className="head">
            <div>
              <div className="title">Admin Inbox</div>
              <div className="sub">Access requests</div>
            </div>
            <button className="btn" onClick={load}>Refresh</button>
          </div>

          <div className="list">
            {items.length === 0 ? (
              <div className="empty">No requests yet.</div>
            ) : (
              items.map((r) => (
                <div
                  key={r.id}
                  className="row"
                  onClick={() => router.push(`/members/admin/inbox?id=${r.id}`)}
                >
                  <div className="rowTop">
                    <div className="name">{r.full_name || "Unnamed"}</div>
                    <div className="badge">{r.status}</div>
                  </div>
                  <div className="email">{r.email}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* DETAIL */}
        <div className="panel">
          <div className="head">
            <div>
              <div className="title">{item ? "Request" : "Select a request"}</div>
              <div className="sub">{item ? item.email : "Click a request on the left"}</div>
            </div>

            {item ? (
              <button className="btn" onClick={() => router.push("/members/admin/inbox")}>
                Close
              </button>
            ) : null}
          </div>

          {item ? (
            <div className="detail">
              <div className="kv">
                <b>Name:</b> {item.full_name}
              </div>
              <div className="kv">
                <b>Status:</b> {item.status}
              </div>
              <div className="kv">
                <b>Submitted:</b> {new Date(item.created_at).toLocaleString()}
              </div>

              <div className="msg">{item.message}</div>

              <div className="actions">
                <button
                  className="btn btnPrimary"
                  disabled={item.status !== "pending"}
                  onClick={() => act(item.id, "approve")}
                >
                  Approve
                </button>
                <button
                  className="btn"
                  disabled={item.status !== "pending"}
                  onClick={() => act(item.id, "deny")}
                >
                  Deny
                </button>
              </div>
            </div>
          ) : (
            <div className="empty">Pick a request to review.</div>
          )}
        </div>
      </div>
    </div>
  );
}
