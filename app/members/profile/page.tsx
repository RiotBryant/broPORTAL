"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Profile = {
  user_id: string;
  display_name: string | null;
  username: string | null;

  phone: string | null;
  email: string | null;
  instagram: string | null;
  tiktok: string | null;
  x: string | null;
  linkedin: string | null;
  bio: string | null;

  // member toggles (directory/profile visibility)
  show_phone: boolean;
  show_email: boolean;
  show_instagram: boolean;
  show_tiktok: boolean;
  show_x: boolean;
  show_linkedin: boolean;
  show_bio: boolean;

  avatar_path: string | null;
  admin_photo_path: string | null;
};

function slugifyUsername(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);
}

export default function ProfilePage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const [form, setForm] = useState<Profile>({
    user_id: "",
    display_name: "",
    username: "",

    phone: "",
    email: "",
    instagram: "",
    tiktok: "",
    x: "",
    linkedin: "",
    bio: "",

    show_phone: false,
    show_email: false,
    show_instagram: true,
    show_tiktok: true,
    show_x: true,
    show_linkedin: true,
    show_bio: true,

    avatar_path: null,
    admin_photo_path: null,
  });

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [adminPhotoUrl, setAdminPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        router.replace("/login");
        return;
      }

      const { data: u } = await supabase.auth.getUser();
      const id = u.user?.id ?? null;
      if (!id) {
        router.replace("/login");
        return;
      }
      setUid(id);

      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          user_id, display_name, username,
          phone, email, instagram, tiktok, x, linkedin, bio,
          show_phone, show_email, show_instagram, show_tiktok, show_x, show_linkedin, show_bio,
          avatar_path, admin_photo_path
        `
        )
        .eq("user_id", id)
        .maybeSingle();

      if (error) console.error(error);

      const merged: Profile = {
        user_id: id,
        display_name: data?.display_name ?? "",
        username: data?.username ?? "",

        phone: data?.phone ?? "",
        email: data?.email ?? "",
        instagram: data?.instagram ?? "",
        tiktok: data?.tiktok ?? "",
        x: data?.x ?? "",
        linkedin: data?.linkedin ?? "",
        bio: data?.bio ?? "",

        show_phone: data?.show_phone ?? false,
        show_email: data?.show_email ?? false,
        show_instagram: data?.show_instagram ?? true,
        show_tiktok: data?.show_tiktok ?? true,
        show_x: data?.show_x ?? true,
        show_linkedin: data?.show_linkedin ?? true,
        show_bio: data?.show_bio ?? true,

        avatar_path: data?.avatar_path ?? null,
        admin_photo_path: data?.admin_photo_path ?? null,
      };

      setForm(merged);

      // Signed URLs for private buckets
      if (merged.avatar_path) {
        const { data: signed } = await supabase.storage
          .from("avatars")
          .createSignedUrl(merged.avatar_path, 60 * 60);
        setAvatarUrl(signed?.signedUrl ?? null);
      }

      if (merged.admin_photo_path) {
        const { data: signed } = await supabase.storage
          .from("admin-photos")
          .createSignedUrl(merged.admin_photo_path, 60 * 60);
        setAdminPhotoUrl(signed?.signedUrl ?? null);
      }

      setLoading(false);
    })();
  }, [router]);

  const canSave = useMemo(() => {
    return !!uid && !!form.display_name?.trim() && !!form.username?.trim();
  }, [uid, form.display_name, form.username]);

  async function saveProfile() {
    if (!uid) return;
    setSaving(true);
    setMsg("");

    const cleanedUsername = slugifyUsername(form.username ?? "");
    if (!cleanedUsername) {
      setSaving(false);
      setMsg("Username is required (letters/numbers/underscore only).");
      return;
    }

    const payload = {
      user_id: uid,
      display_name: form.display_name?.trim() || null,
      username: cleanedUsername,

      phone: form.phone?.trim() || null,
      email: form.email?.trim() || null,
      instagram: form.instagram?.trim() || null,
      tiktok: form.tiktok?.trim() || null,
      x: form.x?.trim() || null,
      linkedin: form.linkedin?.trim() || null,
      bio: form.bio?.trim() || null,

      show_phone: !!form.show_phone,
      show_email: !!form.show_email,
      show_instagram: !!form.show_instagram,
      show_tiktok: !!form.show_tiktok,
      show_x: !!form.show_x,
      show_linkedin: !!form.show_linkedin,
      show_bio: !!form.show_bio,

      avatar_path: form.avatar_path,
      admin_photo_path: form.admin_photo_path,
    };

    const { error } = await supabase.from("profiles").upsert(payload, {
      onConflict: "user_id",
    });

    if (error) {
      console.error(error);
      setMsg(error.message);
      setSaving(false);
      return;
    }

    setForm((f) => ({ ...f, username: cleanedUsername }));
    setMsg("Saved.");
    setSaving(false);
  }

  async function uploadAvatar(file: File) {
    if (!uid) return;
    setMsg("");

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${uid}/avatar.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (upErr) {
      console.error(upErr);
      setMsg(upErr.message);
      return;
    }

    setForm((f) => ({ ...f, avatar_path: path }));

    const { data: signed } = await supabase.storage
      .from("avatars")
      .createSignedUrl(path, 60 * 60);

    setAvatarUrl(signed?.signedUrl ?? null);
    setMsg("Avatar updated.");
  }

  async function uploadAdminPhoto(file: File) {
    if (!uid) return;
    setMsg("");

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${uid}/photo.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("admin-photos")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (upErr) {
      console.error(upErr);
      setMsg(upErr.message);
      return;
    }

    setForm((f) => ({ ...f, admin_photo_path: path }));

    const { data: signed } = await supabase.storage
      .from("admin-photos")
      .createSignedUrl(path, 60 * 60);

    setAdminPhotoUrl(signed?.signedUrl ?? null);
    setMsg("Admin photo updated.");
  }

  function Toggle({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: boolean;
    onChange: (v: boolean) => void;
  }) {
    return (
      <button
        type="button"
        aria-label={label}
        className={`switch ${value ? "on" : "off"}`}
        onClick={() => onChange(!value)}
      >
        <span className="knob" />
      </button>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070b] text-white grid place-items-center">
        <div className="opacity-70 text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <style>{`
        .wrap { max-width: 900px; margin: 0 auto; padding: 22px 18px 90px; }
        .glass {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.10);
          box-shadow: 0 0 60px rgba(80,170,255,0.06);
          border-radius: 24px;
        }
        .pill {
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          border-radius: 999px;
          height: 42px;
          padding: 0 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform .12s ease, border-color .12s ease, background .12s ease;
        }
        .pill:hover { transform: translateY(-1px); border-color: rgba(255,255,255,0.22); background: rgba(255,255,255,0.08); }
        .primary { background:#fff; color:#000; border:none; }
        label { font-size: 12px; color: rgba(255,255,255,0.7); display:block; margin-bottom:6px; }
        input, textarea {
          width: 100%;
          border-radius: 14px;
          padding: 10px 12px;
          outline: none;
          color: white;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
        }
        textarea { min-height: 110px; resize: vertical; }
        .grid { display:grid; gap: 12px; grid-template-columns: repeat(1, minmax(0, 1fr)); }
        @media (min-width: 900px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        .card { background: rgba(0,0,0,0.28); border: 1px solid rgba(255,255,255,0.10); border-radius: 22px; padding: 16px; }
        .tiny { color: rgba(255,255,255,0.55); font-size: 12px; }
        .avatarBox {
          width: 84px; height: 84px; border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          overflow:hidden;
        }
        .avatarBox img { width:100%; height:100%; object-fit:cover; display:block; }

        .rowField { display:flex; align-items:center; justify-content:space-between; gap:12px; }
        .rowField .left { flex: 1 1 auto; min-width: 0; }

        .switch {
          width: 54px; height: 32px; border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.06);
          position: relative;
          flex: 0 0 auto;
          transition: background .15s ease, border-color .15s ease;
        }
        .switch .knob {
          width: 26px; height: 26px; border-radius: 999px;
          background: rgba(255,255,255,0.85);
          position: absolute; top: 2px; left: 2px;
          transition: transform .18s ease;
        }
        .switch.on { background: rgba(255,255,255,0.18); border-color: rgba(255,255,255,0.22); }
        .switch.on .knob { transform: translateX(22px); background: #fff; }
        .switch.off { opacity: 0.8; }
      `}</style>

      <div className="wrap">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/members" className="pill text-sm">
              ← Back
            </Link>
            <Link href="/members/directory" className="pill text-sm">
              Directory
            </Link>
          </div>
        </div>

        <div className="glass mt-4 p-4">
          <div className="grid">
            <div className="card">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">Display Avatar</div>
                </div>
                <div className="avatarBox">{avatarUrl ? <img src={avatarUrl} alt="" /> : null}</div>
              </div>

              <div className="mt-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadAvatar(f);
                  }}
                />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">Admin Photo</div>
                  <div className="tiny">Admins only.</div>
                </div>
                <div className="avatarBox">{adminPhotoUrl ? <img src={adminPhotoUrl} alt="" /> : null}</div>
              </div>

              <div className="mt-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadAdminPhoto(f);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid mt-4">
            <div>
              <label>Portal Name (display)</label>
              <input
                value={form.display_name ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
                placeholder="Riot Bryant"
              />
            </div>

            <div>
              <label>Username (no spaces)</label>
              <input
                value={form.username ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                placeholder="riotbryant"
              />
              <div className="tiny mt-1">letters / numbers / underscore</div>
            </div>

            <div className="rowField">
              <div className="left">
                <label>Phone (optional)</label>
                <input
                  value={form.phone ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="(555) 555-5555"
                />
                <div className="tiny mt-1">Show to members</div>
              </div>
              <Toggle
                label="show_phone"
                value={form.show_phone}
                onChange={(v) => setForm((f) => ({ ...f, show_phone: v }))}
              />
            </div>

            <div className="rowField">
              <div className="left">
                <label>Email (optional)</label>
                <input
                  value={form.email ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="you@email.com"
                />
                <div className="tiny mt-1">Show to members</div>
              </div>
              <Toggle
                label="show_email"
                value={form.show_email}
                onChange={(v) => setForm((f) => ({ ...f, show_email: v }))}
              />
            </div>

            <div className="rowField">
              <div className="left">
                <label>Instagram (optional)</label>
                <input
                  value={form.instagram ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
                  placeholder="@handle"
                />
                <div className="tiny mt-1">Show to members</div>
              </div>
              <Toggle
                label="show_instagram"
                value={form.show_instagram}
                onChange={(v) => setForm((f) => ({ ...f, show_instagram: v }))}
              />
            </div>

            <div className="rowField">
              <div className="left">
                <label>TikTok (optional)</label>
                <input
                  value={form.tiktok ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, tiktok: e.target.value }))}
                  placeholder="@handle"
                />
                <div className="tiny mt-1">Show to members</div>
              </div>
              <Toggle
                label="show_tiktok"
                value={form.show_tiktok}
                onChange={(v) => setForm((f) => ({ ...f, show_tiktok: v }))}
              />
            </div>

            <div className="rowField">
              <div className="left">
                <label>X (optional)</label>
                <input
                  value={form.x ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, x: e.target.value }))}
                  placeholder="@handle"
                />
                <div className="tiny mt-1">Show to members</div>
              </div>
              <Toggle
                label="show_x"
                value={form.show_x}
                onChange={(v) => setForm((f) => ({ ...f, show_x: v }))}
              />
            </div>

            <div className="rowField">
              <div className="left">
                <label>LinkedIn (optional)</label>
                <input
                  value={form.linkedin ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, linkedin: e.target.value }))}
                  placeholder="linkedin.com/in/…"
                />
                <div className="tiny mt-1">Show to members</div>
              </div>
              <Toggle
                label="show_linkedin"
                value={form.show_linkedin}
                onChange={(v) => setForm((f) => ({ ...f, show_linkedin: v }))}
              />
            </div>
          </div>

          <div className="mt-4 rowField">
            <div className="left">
              <label>Bio (optional)</label>
              <textarea
                value={form.bio ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="A few lines about you."
              />
              <div className="tiny mt-1">Show to members</div>
            </div>
            <Toggle
              label="show_bio"
              value={form.show_bio}
              onChange={(v) => setForm((f) => ({ ...f, show_bio: v }))}
            />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              className={`pill primary text-sm ${saving ? "opacity-70" : ""}`}
              disabled={!canSave || saving}
              onClick={saveProfile}
            >
              {saving ? "Saving…" : "Save"}
            </button>

            {msg ? <div className="tiny">{msg}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
