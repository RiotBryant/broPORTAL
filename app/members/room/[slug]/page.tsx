import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function RoomPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const { data } = await supabase
    .from("rooms")
    .select("title,subtitle,jitsi_url,is_admin_only")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!data) redirect("/members/lounge");

  return (
    <div style={{ padding: 22 }}>
      <div style={{ fontSize: 26, fontWeight: 900 }}>{data.title}</div>
      <div style={{ opacity: 0.7, marginTop: 6 }}>{data.subtitle}</div>

      <div style={{ marginTop: 16 }}>
        <iframe
          src={data.jitsi_url}
          allow="camera; microphone; fullscreen; display-capture"
          style={{ width: "100%", height: "80vh", border: 0 }}
        />
      </div>
    </div>
  );
}
