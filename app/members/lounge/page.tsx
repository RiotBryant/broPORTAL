import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Room = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
};

export default async function LoungePage() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("rooms")
    .select("id,name,description,is_active")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const rooms = (data ?? []) as Room[];

  return (
    <div style={{ padding: 22, maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>
            Lounge
          </h1>
          <div style={{ opacity: 0.7, marginTop: 6 }}>
            Live rooms + conversations
          </div>
        </div>

        <Link href="/members" style={pill()}>
          ← Back
        </Link>
      </div>

      <div style={{ marginTop: 18 }}>
        {error ? (
          <div style={card()}>
            Error loading rooms: {error.message}
          </div>
        ) : rooms.length === 0 ? (
          <div style={card()}>
            No rooms yet.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {rooms.map((room) => (
              <div key={room.id} style={card()}>
                <div style={{ fontWeight: 900, fontSize: 16 }}>
                  {room.name}
                </div>
                <div style={{ opacity: 0.7, marginTop: 6 }}>
                  {room.description ?? ""}
                </div>

                <Link
                  href={`/members/lounge/${room.id}`}
                  style={{ ...pill(), marginTop: 10, display: "inline-flex" }}
                >
                  Enter Room
                </Link>
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
    padding: "8px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 700,
  };
}

function card(): React.CSSProperties {
  return {
    padding: 16,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(0,0,0,0.28)",
  };
}
