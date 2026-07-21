"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/");
    } else {
      const data = await res.json();
      setError(data.error || "Incorrect password");
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#F9F9F9",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: "40px 36px",
        width: "100%", maxWidth: 360,
        boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
        border: "1px solid #E7E5E0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
          <svg width="28" height="28" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <circle cx="256" cy="256" r="256" fill="#F55D3E"/>
            <g transform="translate(256 256)">
              <g transform="translate(-120 -120) scale(10)" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </g>
            </g>
          </svg>
          <span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 20, fontWeight: 400, color: "#1C1917", letterSpacing: -0.5 }}>
            Job Tracker
          </span>
        </div>

        <form onSubmit={submit}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            style={{
              width: "100%", padding: "10px 14px", fontSize: 15,
              border: "1px solid #E7E5E0", borderRadius: 8, outline: "none",
              boxSizing: "border-box", marginBottom: 12, color: "#1C1917",
              background: "#fff",
            }}
          />
          {error && (
            <div style={{ fontSize: 13, color: "#DC2626", marginBottom: 12 }}>{error}</div>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: "100%", padding: "10px 0", fontSize: 15, fontWeight: 500,
              background: "#F55D3E", color: "#fff", border: "none",
              borderRadius: 8, cursor: loading || !password ? "not-allowed" : "pointer",
              opacity: loading || !password ? 0.6 : 1,
              transition: "opacity .15s",
            }}
          >
            {loading ? "Signing in…" : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
