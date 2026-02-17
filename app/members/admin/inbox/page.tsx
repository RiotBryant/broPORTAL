import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type AccessRequest = {
  id: string;
  created_at: string;
  status: string;
  full_name: string | null;
  email: string | null;
  message: string | null;
};

export default async function AdminInboxPage() {
  const supabase = createClient();

  const { data: rows, error } = await supabase
    .from("access_requests")
    .select("id,created_at,status,full_name,email,message")
    .order("created_at", { ascending: false });

  const requests = (rows ?? []) as AccessRequest[];

  return (
    <div style={{ padding: 22, maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>Admin Inbox</h1>
          <div style={{ opacity: 0.7, marginTop: 6 }}>Access Requests + actions</div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/members" style={pill()}>
            ← Back
          </Link>
          <Link href="/members/admin" style={pill()}>
            Admin Home
          </Link>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        {error ? (
          <div style={card()}>
            <b>Couldn’t load access requests:</b>
            <div style={{ opacity: 0.75, marginTop: 6 }}>{error.message}</div>
          </div>
        ) : null}

        {requests.length === 0 ? (
          <div style={card()}>
            <div style={{ fontWeight: 900 }}>No requests</div>
            <div style={{ opacity: 0.7, marginTop: 6 }}>Inbox is clear.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {requests.map((req) => (
              <div key={req.id} style={card()}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900, fontSize: 16 }}>
                      {req.full_name ?? "Unnamed"}{" "}
                      <span style={{ opacity: 0.6, fontWeight: 700 }}>
                        • {req.status ?? "unknown"}
                      </span>
                    </div>
                    <div style={{ opacity: 0.7, marginTop: 4 }}>{req.email ?? "no email"}</div>
                    {req.message ? (
                      <div style={{ marginTop: 10, opacity: 0.85, whiteSpace: "pre-wrap" }}>{req.message}</div>
                    ) : (
                      <div style={{ marginTop: 10, opacity: 0.55 }}>No message.</div>
                    )}
                    <div style={{ marginTop: 10, opacity: 0.55, fontSize: 12 }}>
                      {new Date(req.created_at).toLocaleString()}
                    </div>
                  </div>

                  {req.status === "pending" ? (
                    <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                      <form action={`/api/admin/access-requests/${req.id}/approve`} method="post">
                        <button type="submit" style={btnPrimary()}>
                          Approve
                        </button>
                      </form>

                      <form action={`/api/admin/access-requests/${req.id}/deny`} method="post">
                        <button type="submit" style={btnGhost()}>
                          Deny
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div style={{ opacity: 0.7, fontSize: 12, flexShrink: 0 }}>No action</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function pill(): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: 13,
  };
}

function card(): React.CSSProperties {
  return {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.28)",
    padding: 16,
  };
}

function btnPrimary(): React.CSSProperties {
  return {
    borderRadius: 12,
    border: "none",
    background: "white",
    color: "black",
    padding: "10px 12px",
    fontWeight: 900,
    cursor: "pointer",
  };
}

function btnGhost(): React.CSSProperties {
  return {
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    padding: "10px 12px",
    fontWeight: 900,
    cursor: "pointer",
  };
}
