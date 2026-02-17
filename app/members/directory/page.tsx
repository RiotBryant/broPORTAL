"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Row = {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

export default function DirectoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url")
        .order("created_at", { ascending: true });

      if (!error && data) setRows(data as Row[]);
      setLoading(false);
    })();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <div className="mx-auto w-[min(980px,calc(100%-24px))] py-10">
        <h1 className="text-3xl font-semibold">Directory</h1>
        <p className="mt-2 text-white/70">Members only.</p>

        <style>{`
          .card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.10); border-radius: 18px; padding: 14px 16px; display:flex; align-items:center; justify-content:space-between; gap:14px; }
          .left { display:flex; align-items:center; gap:12px; min-width: 0; }
          .avatar { width:44px; height:44px; border-radius: 999px; background: rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.10); overflow:hidden; flex:0 0 auto; display:flex; align-items:center; justify-content:center; font-weight:700; }
          .avatar img { width:100%; height:100%; object-fit:cover; }
          .name { font-weight:700; line-height:1.1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
          .user { font-size: 13px; color: rgba(255,255,255,0.65); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
          .btn { height:38px; padding:0 14px; border-radius: 999px; border:1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.06); display:inline-flex; align-items:center; gap:8px; }
          .btn:hover { background: rgba(255,255,255,0.10); }
          .list { margin-top: 18px; display:flex; flex-direction:column; gap:10px; }
          .skeleton { height: 72px; border-radius: 18px; background: rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.10); }
        `}</style>

        {loading ? (
          <div className="list">
            <div className="skeleton" />
            <div className="skeleton" />
            <div className="skeleton" />
          </div>
        ) : (
          <div className="list">
            {rows.map((r) => {
              const display = r.display_name || "Member";
              const uname = r.username ? `@${r.username}` : "";
              const slug = r.username || r.user_id;

              return (
                <div key={r.user_id} className="card">
                  <div className="left">
                    <div className="avatar" aria-label="avatar">
                      {r.avatar_url ? (
                        // If avatar_url is a full URL, this works.
                        // If you store just a storage path, we’ll swap to getPublicUrl in the profile uploader.
                        <img src={r.avatar_url} alt="" />
                      ) : (
                        <span>{display.slice(0, 1).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="name">{display}</div>
                      <div className="user">{uname}</div>
                    </div>
                  </div>

                  <Link className="btn" href={`/members/directory/${encodeURIComponent(slug)}`}>
                    View
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
