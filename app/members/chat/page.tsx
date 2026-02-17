"use client";

import Link from "next/link";
import ChatUI from "@/components/ChatUI";

export default function ChatPage() {
  return (
    <div className="page">
      <div className="shell">
        <div className="topbar">
          <div className="brand">
            <h1>broCHAT</h1>
            <p>Quiet by design • presence over performance</p>
          </div>

          <div className="topActions">
            <Link className="pillBtn" href="/members">← Back</Link>
          </div>
        </div>

        <ChatUI />
      </div>
    </div>
  );
}
