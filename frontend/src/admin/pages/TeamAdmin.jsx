import React, { useEffect, useRef, useState } from "react";
import { getAdminTeam, createTeamMember, updateTeamMember, deleteTeamMember } from "../adminApi.js";

const EMPTY_FORM = { name: "", role: "", category: "", department: "", description: "", image: "", order: "" };
// Photos are resized + compressed in the browser before saving, so each one is
// roughly 60-150 KB and the public team API stays light.
const MAX_INPUT_MB = 10;
const MAX_DIMENSION = 800;
const JPEG_QUALITY = 0.8;

function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read image")); };
    img.onload = () => {
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff"; // transparent PNGs would otherwise turn black as JPEG
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    };
    img.src = url;
  });
}

function PhotoUploader({ value, onChange, onBusyChange }) {
  const inputRef = useRef(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  const setBusy = (b) => { setWorking(b); if (onBusyChange) onBusyChange(b); };

  const handleFile = async (file) => {
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (JPG, PNG or WebP).");
      return;
    }
    if (file.size > MAX_INPUT_MB * 1024 * 1024) {
      setError(`That image is too large. Please choose one under ${MAX_INPUT_MB} MB.`);
      return;
    }
    setBusy(true);
    try {
      onChange(await compressImageFile(file));
    } catch (err) {
      setError("Could not process that image. Try a JPG, PNG or WebP file.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ab-field">
      <label>Photo</label>
      <div className="ph-uploader">
        {value && (
          <div className="ph-thumb">
            <img src={value} alt="Team member preview" />
            <button type="button" className="ph-thumb-remove" title="Remove photo" onClick={() => onChange("")}>×</button>
          </div>
        )}
        <button type="button" className="ph-add-btn" onClick={() => inputRef.current && inputRef.current.click()} disabled={working}>
          {working ? "Adding…" : value ? "Replace" : "+ Upload"}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => { handleFile(e.target.files && e.target.files[0]); e.target.value = ""; }}
      />
      <span style={{ fontSize: 12.5, color: "var(--muted)" }}>
        Optional. Upload one photo from your device. A placeholder is shown on the site if there is none.
      </span>
      {error && <div className="ab-form-msg error">{error}</div>}
    </div>
  );
}
function MemberFormModal({ initial, onClose, onSaved }) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState(initial ? { ...EMPTY_FORM, ...initial } : EMPTY_FORM);
    const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);

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
            <div className="ab-field"><label>Role *</label><input required value={form.role} onChange={update("role")}  /></div>
            <div className="ab-field"><label>Category</label><input value={form.category} onChange={update("category")}  /></div>
          </div>
          <div className="ab-field"><label>Department / Focus Area</label><input value={form.department} onChange={update("department")}  /></div>
          <div className="ab-field"><label>Description</label><textarea rows={3} value={form.description} onChange={update("description")} placeholder="What do they do for the club?" /></div>
          <div className="ab-row">
            <PhotoUploader value={form.image} onChange={(img) => setForm((f) => ({ ...f, image: img }))} onBusyChange={setPhotoBusy} />
            <div className="ab-field"><label>Display Order</label><input type="number" min="0" value={form.order} onChange={update("order")}  /></div>
          </div>
          {status === "error" && <div className="ab-form-msg error">{error}</div>}
          <button className="btn primary" type="submit" disabled={status === "sending" || photoBusy}>
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