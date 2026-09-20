import React, { useState } from "react";
import { adminLogin, setSession } from "./adminApi.js";
import AdminBackground from "./AdminBackground.jsx";
import AdminCursorTrail from "./AdminCursorTrail.jsx";

export default function AdminLogin({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const data = await adminLogin(email, password);
      setSession(data.token, data.admin);
      onSuccess();
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
      setStatus("error");
    }
  };

      return (
    <div className="adm-login-shell">
      <AdminBackground />
      <AdminCursorTrail />
      <div className="adm-login-card">
        <div className="logo">⚡</div>
        <h1>Admin Login</h1>
        <p className="sub">AgentBlazer Club &mdash; content management</p>
        <form className="ab-form" onSubmit={submit}>
          <div className="ab-field">
            <label htmlFor="al-email">Email</label>
            <input id="al-email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" autoFocus />
          </div>
          <div className="ab-field">
            <label htmlFor="al-password">Password</label>
            <input id="al-password" required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {status === "error" && <div className="ab-form-msg error">{error}</div>}
          <button className="btn primary" type="submit" disabled={status === "sending"}>
            {status === "sending" ? "Signing In…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}