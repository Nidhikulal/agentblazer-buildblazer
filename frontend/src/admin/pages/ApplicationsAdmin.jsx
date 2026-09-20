import React, { useEffect, useState } from "react";
import { getApplications, updateApplicationStatus } from "../adminApi.js";

export default function ApplicationsAdmin() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(null);

  const load = () => {
    setLoading(true);
    getApplications().then(setApplications).catch((err) => setError(err.message || "Could not load applications")).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const changeStatus = async (id, status) => {
    setUpdating(id);
    try {
      await updateApplicationStatus(id, status);
      setApplications((apps) => apps.map((a) => (a._id === id ? { ...a, status } : a)));
    } catch (err) {
      setError(err.message || "Could not update status");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="adm-section">
      <div className="row-head"><h2>Membership Applications ({applications.length})</h2></div>
      {error && <div className="ab-form-msg error" style={{ marginBottom: 14 }}>{error}</div>}
      {loading ? <div className="adm-loading">Loading applications…</div> : applications.length === 0 ? (
        <div className="adm-empty">No membership applications yet.</div>
      ) : (
                <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Name</th><th>USN</th><th>College Email</th><th>Phone</th><th>Year / Branch</th><th>Message</th><th>Status</th></tr></thead>
            <tbody>
              {applications.map((a) => (
                <tr key={a._id}>
                  <td>{a.name}</td>
                  <td className="muted">{a.usn || "—"}</td>
                  <td className="muted">{a.email}</td>
                  <td className="muted">{a.phone || "—"}</td>
                  <td className="muted">{[a.year, a.branch].filter(Boolean).join(" · ") || "—"}</td>
                  <td className="muted" style={{ maxWidth: 240 }}>{a.message || "—"}</td>
                  <td>
                    <select className="adm-select" value={a.status} disabled={updating === a._id} onChange={(e) => changeStatus(a._id, e.target.value)}>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
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