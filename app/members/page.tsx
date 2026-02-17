"use client";

import Link from "next/link";
import { useMemo } from "react";
import TopBar from "@/components/TopBar";
import Card from "@/components/Card";
import Countdown from "@/components/Countdown";
import { mockMe } from "@/lib/mock";

export default function MembersHome() {
  // Skeleton mode: fake role/user (later comes from Supabase)
  const me = mockMe();
  const isAdmin = useMemo(() => me.role === "admin" || me.role === "superadmin", [me.role]);

  return (
    <>
      <TopBar
        title="broT Members Portal"
        subtitle="Quiet by design • presence over performance"
        right={
          <>
            {isAdmin ? (
              <Link className="pill pillPrimary" href="/members/admin/inbox">Admin Inbox</Link>
            ) : null}
            <Link className="pill" href="/members/profile">Profile</Link>
            <Link className="pill" href="/login">Log out</Link>
          </>
        }
      />

      <div className="hero">
        <div className="heroRow">
          <div className="chipRow">
            <div className="chip">Role: <b>{me.role}</b></div>
            <div className="chip">Nothing auto-joins</div>
            <div className="chip">Nothing is recorded</div>
          </div>

          <div className="heroButtons">
            <Link className="cta ctaPrimary" href="/members/support">Request Support</Link>
            <Link className="cta" href="/members/lounge">Enter Lounge</Link>
            <Link className="cta" href="/members/forms">Forms</Link>
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
              <Link className="btn btnPrimary" href="/members/chat">Open broCHAT →</Link>
              <Link className="btn btnGhost" href="/members/inbox">DM Inbox</Link>
            </>
          }
        />

        <Card
          title="broLOUNGE"
          subtitle="Live rooms"
          desc="Choose a door. Jitsi links live here."
          actions={
            <>
              <Link className="btn btnPrimary" href="/members/lounge">Enter Lounge</Link>
              <Link className="btn btnGhost" href="/members/room/weekly">Next Meeting Room</Link>
            </>
          }
        />

        <Card
          title="Calendar"
          subtitle="Next events"
          desc="Events list + countdown."
          actions={
            <>
              <Link className="btn btnPrimary" href="/members/calendar">Open Calendar</Link>
              <Link className="btn btnGhost" href="/members/vote">Voting</Link>
            </>
          }
        />

        <Card
          title="broBOT"
          subtitle="Guidance + routing"
          desc="Answers from your docs and routes requests."
          actions={
            <>
              <Link className="btn btnPrimary" href="/members/brobot">Signal broBOT</Link>
              <Link className="btn btnGhost" href="/members/badges">Badges</Link>
            </>
          }
        />
      </div>
    </>
  );
}
