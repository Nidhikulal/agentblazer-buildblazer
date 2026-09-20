import React, { useEffect, useState } from "react";
import { getMessages, updateMessageStatus } from "../adminApi.js";

export default function MessagesAdmin() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(null);

  const load = () => {
    setLoading(true);
    getMessages().then(setMessages).catch((err) => setError(err.message || "Could not load messages")).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const changeStatus = async (id, status) => {
    setUpdating(id);
    try {
      await updateMessageStatus(id, status);
      setMessages((msgs) => msgs.map((m) => (m._id === id ? { ...m, status } : m)));
    } catch (err) {
      setError(err.message || "Could not update status");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="adm-section">
      <div className="row-head"><h2>Contact Messages ({messages.length})</h2></div>
      {error && <div className="ab-form-msg error" style={{ marginBottom: 14 }}>{error}</div>}
      {loading ? <div className="adm-loading">Loading messages…</div> : messages.length === 0 ? (
        <div className="adm-empty">No contact messages yet.</div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Name</th><th>Email</th><th>Subject</th><th>Message</th><th>Status</th></tr></thead>
            <tbody>
              {messages.map((m) => (
                <tr key={m._id}>
                  <td>{m.name}</td>
                  <td className="muted">{m.email}</td>
                  <td className="muted">{m.subject || "—"}</td>
                  <td className="muted" style={{ maxWidth: 260 }}>{m.message}</td>
                  <td>
                    <select className="adm-select" value={m.status} disabled={updating === m._id} onChange={(e) => changeStatus(m._id, e.target.value)}>
                      <option value="new">New</option>
                      <option value="read">Read</option>
                      <option value="replied">Replied</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}