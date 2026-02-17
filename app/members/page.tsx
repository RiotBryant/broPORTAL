"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import TopBar from "@/components/TopBar";
import Card from "@/components/Card";
import Countdown from "@/components/Countdown";
import { supabase } from "@/lib/supabase/client";

type Role = "member" | "admin" | "superadmin";

export default function MembersHome() {
  const [role, setRole] = useState<Role>("member");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadUserRole() {
  const { data: authRes, error: authErr } = await supabase.auth.getUser();
  const user = authRes?.user;

  if (authErr || !user) {
    window.location.href = "/login";
    return;
  }

  const { data: roleRes, error: roleErr } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!alive) return;

  if (roleErr) {
    console.error(roleErr);
    setRole("member");
  } else {
    setRole((roleRes?.role as Role) ?? "member");
  }

  setLoading(false);
}

    loadUserRole();

    return () => {
      alive = false;
    };
  }, []);

  const isAdmin = useMemo(
    () => role === "admin" || role === "superadmin",
    [role]
  );

  return (
    <>
      <TopBar
        title="broT Members Portal"
        subtitle="Quiet by design • presence over performance"
        right={
          <>
            {isAdmin && (
              <Link
                className="pill pillPrimary"
                href="/members/admin/inbox"
              >
                Admin Inbox
              </Link>
            )}

            <Link className="pill" href="/members/profile">
              Profile
            </Link>
{isAdmin ? (
  <Link className="pill" href="/members/admin/events">Events</Link>
) : null}

            <Link
              className="pill"
              href="#"
              onClick={async (e) => {
                e.preventDefault();
                await supabase.auth.signOut();
                window.location.href = "/login";
              }}
            >
              Log out
            </Link>
          </>
        }
      />

      <div className="hero">
        <div className="heroRow">
          <div className="chipRow">
            <div className="chip">
              Role: <b>{loading ? "…" : role}</b>
            </div>
            <div className="chip">Nothing auto-joins</div>
            <div className="chip">Nothing is recorded</div>
          </div>

          <div className="heroButtons">
            <Link className="cta ctaPrimary" href="/members/support">
              Request Support
            </Link>
            <Link className="cta" href="/members/lounge">
              Enter Lounge
            </Link>
            <Link className="cta" href="/members/forms">
              Forms
            </Link>
          </div>
        </div>

        <div className="heroTitle">Built for Brotherhood.</div>

        <div style={{ marginTop: 12 }}>
          <Countdown />
        </div>
      </div>

      <div className="sectionLabel">Core</div>

      <div className="grid">
        <Card
          title="broCHAT"
          subtitle="Group chat"
          desc="Real-time group room. Keep it intentional."
          actions={
            <>
              <Link className="btn btnPrimary" href="/members/chat">
                Open broCHAT →
              </Link>
              <Link className="btn btnGhost" href="/members/inbox">
                DM Inbox
              </Link>
            </>
          }
        />

        <Card
          title="broLOUNGE"
          subtitle="Live rooms"
          desc="Choose a door. Jitsi links live here."
          actions={
            <>
              <Link className="btn btnPrimary" href="/members/lounge">
                Enter Lounge
              </Link>
              <Link
                className="btn btnGhost"
                href="/members/room/weekly"
              >
                Next Meeting Room
              </Link>
            </>
          }
        />

        <Card
          title="Calendar"
          subtitle="Next events"
          desc="Events list + countdown."
          actions={
            <>
              <Link className="btn btnPrimary" href="/members/calendar">
                Open Calendar
              </Link>
              <Link className="btn btnGhost" href="/members/vote">
                Voting
              </Link>
            </>
          }
        />

        <Card
          title="broBOT"
          subtitle="Guidance + routing"
          desc="Answers from your docs and routes requests."
          actions={
            <>
              <Link className="btn btnPrimary" href="/members/brobot">
                Signal broBOT
              </Link>
              <Link className="btn btnGhost" href="/members/badges">
                Badges
              </Link>
            </>
          }
        />
      </div>
    </>
  );
}
