// frontend/src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [emails, setEmails] = useState([]);
  const [count, setCount] = useState(15);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenFromUrl = params.get("access_token");
    const saved = localStorage.getItem("googleToken");
    if (tokenFromUrl) {
      localStorage.setItem("googleToken", tokenFromUrl);
      // clean URL
      window.history.replaceState({}, document.title, "/dashboard");
      fetchEmails(tokenFromUrl);
    } else if (saved) {
      fetchEmails(saved);
    } else {
      navigate("/");
    }
    // eslint-disable-next-line
  }, []);

  async function fetchEmails(token) {
    try {
      setLoading(true);
      const res = await axios.get(`/emails/fetch?access_token=${token}&count=${count}`);
      setEmails(res.data.emails || []);
    } catch (err) {
      console.error("fetch error:", err?.response?.data || err.message);
      alert("Failed to fetch emails. Check backend logs and ensure token is valid.");
    } finally {
      setLoading(false);
    }
  }

  async function classify() {
    try {
      const openaiKey = localStorage.getItem("openaiKey");
      if (!openaiKey) return alert("Save OpenAI key first");
      const res = await axios.post("/emails/classify", { emails, openaiKey });
      setEmails(res.data.classified || []);
    } catch (err) {
      console.error("classification error:", err?.response?.data || err.message);
      alert("Classification failed. See console.");
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
        <div><strong>Gmail Classifier</strong></div>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
            {[5,10,15,20].map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <button onClick={() => fetchEmails(localStorage.getItem("googleToken"))}>Fetch</button>
          <button onClick={classify}>Classify</button>
          <button onClick={() => { localStorage.clear(); navigate("/"); }}>Logout</button>
        </div>
      </div>

      {loading ? <div>Loading emails...</div> : null}

      <div style={{ display: "grid", gap: 12 }}>
        {emails.map(e => (
          <div key={e.id} style={{ border: "1px solid #222", padding: 12, borderRadius: 8 }}>
            <div style={{ fontWeight: 600 }}>{e.from} {e.category ? `— ${e.category}` : ""}</div>
            <div style={{ marginTop: 8 }}>{e.snippet}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
