"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function ResetPassword() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Password set successfully. Redirecting...");
    setTimeout(() => {
      router.push("/members");
    }, 1500);
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#07070b",
      color: "white"
    }}>
      <form onSubmit={handleSubmit} style={{
        width: 400,
        padding: 40,
        borderRadius: 20,
        background: "rgba(255,255,255,0.05)"
      }}>
        <h1>Set Your Password</h1>

        <input
          type="password"
          placeholder="New Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            marginTop: 20,
            borderRadius: 8,
            border: "1px solid #333",
            background: "#111",
            color: "white"
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            marginTop: 20,
            borderRadius: 999,
            background: "white",
            color: "black",
            fontWeight: 600
          }}
        >
          {loading ? "Saving..." : "Set Password"}
        </button>

        {message && <p style={{ marginTop: 20 }}>{message}</p>}
      </form>
    </div>
  );
}
