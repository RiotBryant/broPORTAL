"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { getMyRole, isAdminRole, requireUser, type Role } from "@/lib/store";

type Badge = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  can_self_claim: boolean;
};

type Award = {
  id: string;
  badge_id: string;
  user_id: string;
  created_at: string;
  source: string;
  note: string | null;
  revoked_at: string | null;
};

export default function BadgesUI() {
  const [role, setRole] = useState<Role>("member");
  const [loading, setLoading] = useState(true);

  const [badges, setBadges] = useState<Badge[]>([]);
  const [myAwards, setMyAwards] = useState<Award[]>([]);

  // Admin inputs
  const [newSlug, setNewSlug] = useState("");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [newSelfClaim, setNewSelfClaim] = useState(false);

  const [awardEmail, setAwardEmail] = useState("");
  const [awardBadgeId, setAwardBadgeId] = useState("");
  const [awardNote, setAwardNote] = useState("");

  const isAdmin = useMemo(() => isAdminRole(role), [role]);
  const myBadgeIds = useMemo(() => new Set(myAwards.map((a) => a.badge_id)), [myAwards]);

  async function refreshAll() {
    setLoading(true);

    const user = await requireUser();
    const r = await getMyRole();
    setRole(r);

    // badges catalog
    const { data: badgeRows, error: badgeErr } = await supabase
      .from("badges")
      .select("id,slug,name,description,icon,is_active,can_self_claim")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (badgeErr) throw badgeErr;
    setBadges((badgeRows ?? []) as Badge[]);

    // my active awards
    const { data: awardRows, error: awardErr } = await supabase
      .from("badge_awards")
      .select("id,badge_id,user_id,created_at,source,note,revoked_at")
      .eq("user_id", user.id)
      .is("revoked_at", null)
      .order("created_at", { ascending: false });

    if (awardErr) throw awardErr;
    setMyAwards((awardRows ?? []) as Award[]);

    setLoading(false);
  }

  useEffect(() => {
    refreshAll().catch((e) => {
      console.error(e);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createBadge() {
    if (!isAdmin) return;

    const slug = newSlug.trim();
    const name = newName.trim();
    if (!slug || !name) return alert("Slug + Name required");

    const user = await requireUser();

    const { error } = await supabase.from("badges").insert({
      slug,
      name,
      description: newDesc.trim() || null,
      icon: newIcon.trim() || null,
      created_by: user.id,
      is_active: true,
      can_self_claim: !!newSelfClaim,
    });

    if (error) return alert(error.message);

    setNewSlug("");
    setNewName("");
    setNewDesc("");
    setNewIcon("");
    setNewSelfClaim(false);

    await refreshAll();
  }

  async function awardBadgeToEmail() {
    if (!isAdmin) return;

    const email = awardEmail.trim().toLowerCase();
    if (!email) return alert("Email required");
    if (!awardBadgeId) return alert("Choose a badge");

    // IMPORTANT: your profiles table key is user_id
    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("user_id,email")
      .eq("email", email)
      .maybeSingle();

    if (profErr) return alert(profErr.message);

    if (!prof?.user_id) {
      return alert(
        "No profile found with that email. Make sure the member saved their email in Profile (or you fill it in profiles.email)."
      );
    }

    const admin = await requireUser();

    const { error } = await supabase.from("badge_awards").insert({
      user_id: prof.user_id,
      badge_id: awardBadgeId,
      awarded_by: admin.id,
      source: "admin",
      note: awardNote.trim() || null,
    });

    if (error) return alert(error.message);

    setAwardEmail("");
    setAwardBadgeId("");
    setAwardNote("");

    await refreshAll();
  }

  async function revokeAward(awardId: string) {
    if (!isAdmin) return;

    const admin = await requireUser();

    const { error } = await supabase
      .from("badge_awards")
      .update({
        revoked_at: new Date().toISOString(),
        revoked_by: admin.id,
        revoke_note: "Revoked by admin",
      })
      .eq("id", awardId);

    if (error) return alert(error.message);
    await refreshAll();
  }

  async function selfClaim(badgeId: string) {
    const user = await requireUser();

    const { error } = await supabase.from("badge_awards").insert({
      user_id: user.id,
      badge_id: badgeId,
      awarded_by: null,
      source: "self",
      note: "Self-claimed",
    });

    if (error) return alert(error.message);
    await refreshAll();
  }

  return (
    <div className="grid">
      <div className="card">
        <div className="cardTitle">Your Badges</div>
        <div className="cardDesc">
          {loading ? "Loading…" : "Earned + awarded badges attached to your account."}
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {Array.from(myBadgeIds).length === 0 ? (
            <div className="chip">No badges yet</div>
          ) : (
            badges
              .filter((b) => myBadgeIds.has(b.id))
              .map((b) => (
                <div key={b.id} className="chip">
                  <b>{b.icon ? `${b.icon} ` : ""}{b.name}</b>
                </div>
              ))
          )}
        </div>
      </div>

      <div className="card">
        <div className="cardTitle">All Badges</div>
        <div className="cardDesc">What exists in the system right now.</div>

        <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.10)" }}>
          {badges.map((b) => {
            const hasIt = myBadgeIds.has(b.id);
            const canClaim = !!b.can_self_claim;

            return (
              <div
                key={b.id}
                style={{
                  padding: "10px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 900 }}>
                    {b.icon ? `${b.icon} ` : ""}{b.name}{" "}
                    {hasIt ? <span style={{ opacity: 0.7, fontWeight: 700 }}>(owned)</span> : null}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.65 }}>{b.description ?? ""}</div>
                  <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>slug: {b.slug}</div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {!hasIt && canClaim ? (
                    <button className="btn btnGhost" onClick={() => selfClaim(b.id)}>
                      Claim
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isAdmin ? (
        <>
          <div className="card">
            <div className="cardTitle">Admin: Create Badge</div>
            <div className="cardDesc">Only admin/superadmin can create badges.</div>

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <input
                className="input"
                placeholder="slug (e.g. founder, helper, builder)"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
              />
              <input
                className="input"
                placeholder="name (e.g. Founder)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <input
                className="input"
                placeholder="icon (optional, emoji like 🛡️)"
                value={newIcon}
                onChange={(e) => setNewIcon(e.target.value)}
              />
              <textarea
                className="input"
                placeholder="description"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={3}
              />
              <label style={{ display: "flex", gap: 10, alignItems: "center", opacity: 0.85 }}>
                <input
                  type="checkbox"
                  checked={newSelfClaim}
                  onChange={(e) => setNewSelfClaim(e.target.checked)}
                />
                Allow self-claim
              </label>

              <button className="btn btnPrimary" onClick={createBadge}>
                Create Badge
              </button>
            </div>
          </div>

          <div className="card">
            <div className="cardTitle">Admin: Award Badge</div>
            <div className="cardDesc">Award by member email (profiles.email must be filled).</div>

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <input
                className="input"
                placeholder="member email"
                value={awardEmail}
                onChange={(e) => setAwardEmail(e.target.value)}
              />

              <select
                className="input"
                value={awardBadgeId}
                onChange={(e) => setAwardBadgeId(e.target.value)}
              >
                <option value="">Choose badge…</option>
                {badges.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.slug})
                  </option>
                ))}
              </select>

              <input
                className="input"
                placeholder="note (optional)"
                value={awardNote}
                onChange={(e) => setAwardNote(e.target.value)}
              />

              <button className="btn btnPrimary" onClick={awardBadgeToEmail}>
                Award
              </button>
            </div>
          </div>

          <div className="card">
            <div className="cardTitle">Admin: Revoke (your awards list)</div>
            <div className="cardDesc">Next upgrade: search any member and manage them.</div>

            <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.10)" }}>
              {myAwards.length === 0 ? (
                <div style={{ padding: "10px 0", opacity: 0.7 }}>No awards found.</div>
              ) : (
                myAwards.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      padding: "10px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 900 }}>
                        award_id: <span style={{ opacity: 0.8, fontWeight: 700 }}>{a.id}</span>
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.65 }}>
                        badge_id: {a.badge_id} • source: {a.source}
                      </div>
                      {a.note ? <div style={{ fontSize: 12, opacity: 0.65 }}>note: {a.note}</div> : null}
                    </div>

                    <button className="btn btnGhost" onClick={() => revokeAward(a.id)}>
                      Revoke
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
