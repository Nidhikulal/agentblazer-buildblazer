import React, { useEffect, useState } from "react";
import { getAdminTeam, createTeamMember, updateTeamMember, deleteTeamMember } from "../adminApi.js";

const EMPTY_FORM = { name: "", role: "", category: "", department: "", description: "", image: "", order: "" };

function MemberFormModal({ initial, onClose, onSaved }) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState(initial ? { ...EMPTY_FORM, ...initial } : EMPTY_FORM);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const payload = { ...form, order: form.order ? Number(form.order) : undefined };
      if (isEdit) await updateTeamMember(initial._id, payload);
      else await createTeamMember(payload);
      onSaved();
    } catch (err) {
      setError(err.message || "Could not save team member.");
      setStatus("error");
    }
  };

  return (
    <div className="ab-modal-overlay" onClick={onClose}>
      <div className="ab-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button type="button" className="ab-modal-close" onClick={onClose} aria-label="Close">×</button>
        <h3>{isEdit ? "Edit Team Member" : "Add Team Member"}</h3>
        <form className="ab-form" onSubmit={submit}>
          <div className="ab-field"><label>Name *</label><input required value={form.name} onChange={update("name")} placeholder="Full name" /></div>
          <div className="ab-row">
            <div className="ab-field"><label>Role *</label><input required value={form.role} onChange={update("role")} placeholder="e.g. Tech Lead" /></div>
            <div className="ab-field"><label>Category</label><input value={form.category} onChange={update("category")} placeholder="e.g. Tech Lead" /></div>
          </div>
          <div className="ab-field"><label>Department / Focus Area</label><input value={form.department} onChange={update("department")} placeholder="e.g. Technical Direction" /></div>
          <div className="ab-field"><label>Description</label><textarea rows={3} value={form.description} onChange={update("description")} placeholder="What do they do for the club?" /></div>
          <div className="ab-row">
            <div className="ab-field"><label>Image URL</label><input value={form.image} onChange={update("image")} placeholder="Optional" /></div>
            <div className="ab-field"><label>Display Order</label><input type="number" min="0" value={form.order} onChange={update("order")} placeholder="e.g. 1" /></div>
          </div>
          {status === "error" && <div className="ab-form-msg error">{error}</div>}
          <button className="btn primary" type="submit" disabled={status === "sending"}>
            {status === "sending" ? "Saving…" : isEdit ? "Save Changes" : "Add Member"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function TeamAdmin() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = () => {
    setLoading(true);
    getAdminTeam().then(setMembers).catch((err) => setError(err.message || "Could not load team members")).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSaved = () => { setModal(null); load(); };

  const handleDelete = async (id, name) => {
    setDeleting(id);
    try { await deleteTeamMember(id); load(); }
    catch (err) { setError(err.message || "Could not remove member"); }
    finally { setDeleting(null); }
  };

  return (
    <div className="adm-section">
      <div className="row-head">
        <h2>Team Members ({members.length})</h2>
        <button className="adm-btn-sm primary" onClick={() => setModal("new")}>+ Add Member</button>
      </div>
      {error && <div className="ab-form-msg error" style={{ marginBottom: 14 }}>{error}</div>}
      {loading ? <div className="adm-loading">Loading team members…</div> : members.length === 0 ? (
        <div className="adm-empty">No team members yet. Click "Add Member" to create one.</div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Name</th><th>Role</th><th>Department</th><th>Order</th><th></th></tr></thead>
            <tbody>
              {members.map((m) => (
                <tr key={m._id}>
                  <td>{m.name}</td><td className="muted">{m.role}</td><td className="muted">{m.department}</td><td className="muted">{m.order}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button className="adm-icon-btn" title="Edit" onClick={() => setModal(m)}>✎</button>
                    <button className="adm-icon-btn danger" title="Remove" disabled={deleting === m._id}
                      onClick={() => { if (window.confirm(`Remove "${m.name}" from the team?`)) handleDelete(m._id, m.name); }}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modal && <MemberFormModal initial={modal === "new" ? null : modal} onClose={() => setModal(null)} onSaved={handleSaved} />}
    </div>
  );
}