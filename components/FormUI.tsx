"use client";

import { useState } from "react";
import { store } from "@/lib/store";
import Link from "next/link";
import { getMyRole } from "@/lib/store";

export default function FormUI({ kind }: { kind: "support" | "access" }) {
  const role = "member"();
  const [subject, setSubject] = useState(kind === "access" ? "Request Access" : "");
  const [category, setCategory] = useState(kind === "access" ? "access" : "support");
  const [body, setBody] = useState("");
  const [done, setDone] = useState(false);

  function submit() {
    if (!body.trim()) return;
    store.requests.create({
      from: me.displayName,
      subject: subject || (kind === "access" ? "Request Access" : "(no subject)"),
      category,
      body: body.trim()
    });
    setDone(true);
    setBody("");
  }

  return (
    <div className="card">
      <div className="cardDesc">This submits into the Admin Inbox mock store.</div>

      {done ? (
        <div style={{ marginTop: 10 }}>
          <div className="chipRow">
            <div className="chip"><b>Submitted.</b> Admins will see it in Admin Inbox.</div>
          </div>
          <div className="cardActions">
            <Link className="btn btnPrimary" href="/members">Back Home</Link>
            <Link className="btn btnGhost" href="/members/admin/inbox">Admin Inbox</Link>
          </div>
        </div>
      ) : (
        <>
          <div style={{ marginTop: 12 }}>
            <div className="tiny">Subject</div>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
          </div>

          <div style={{ marginTop: 12 }}>
            <div className="tiny">Category</div>
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="support | access | general" />
          </div>

          <div style={{ marginTop: 12 }}>
            <div className="tiny">Message</div>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write the request…" />
          </div>

          <div className="cardActions">
            <button className="btn btnPrimary" onClick={submit}>Submit</button>
            <Link className="btn btnGhost" href="/members/forms">Back to Forms</Link>
          </div>
        </>
      )}
    </div>
  );
}
