import { createClient } from "@/lib/supabase/server";

export default async function AdminInbox() {
  const supabase = createClient();

  const { data: requests } = await supabase
    .from("access_requests")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div style={{ padding: 40 }}>
      <h1>Access Requests</h1>

      {requests?.map((req) => (
        <div key={req.id} style={{
          border: "1px solid #333",
          padding: 20,
          marginBottom: 20,
          borderRadius: 12
        }}>
          <strong>{req.full_name}</strong>
          <p>{req.email}</p>
          <p>{req.message}</p>
          <p>Status: {req.status}</p>

          {req.status === "pending" && (
            <>
              <form action={`/api/admin/access-requests/${req.id}/approve`} method="post">
                <button>Approve</button>
              </form>

              <form action={`/api/admin/access-requests/${req.id}/deny`} method="post">
                <button>Den y</button>
              </form>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
