import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [apiKey, setApiKey] = useState(localStorage.getItem("openaiKey") || "");
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/auth/google";
  };

  const handleSaveKey = () => {
    if (!apiKey.trim()) return alert("Enter OpenAI API key");
    localStorage.setItem("openaiKey", apiKey.trim());
    alert("OpenAI key saved");
    navigate("/dashboard");
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div style={{ width: 420 }}>
        <button
          onClick={handleGoogleLogin}
          style={{ width: "100%", padding: 14, borderRadius: 6, marginBottom: 12 }}
        >
          Sign in with Google
        </button>

        <div style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="OpenAI API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{ flex: 1, padding: 10, borderRadius: 6 }}
          />
          <button onClick={handleSaveKey} style={{ padding: "10px 14px", borderRadius: 6 }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
