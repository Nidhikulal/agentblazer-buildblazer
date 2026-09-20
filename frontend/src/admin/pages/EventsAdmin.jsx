import React, { useEffect, useState } from "react";
import { getAdminEvents, createEvent, updateEvent, deleteEvent } from "../adminApi.js";

const EMPTY_FORM = { date: "", title: "", category: "", description: "", speaker: "", venue: "", track: "", shortlistedStudents: "", galleryCount: "", image: "" };

function EventFormModal({ initial, onClose, onSaved }) {
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
      const payload = {
        ...form,
        shortlistedStudents: form.shortlistedStudents ? Number(form.shortlistedStudents) : undefined,
        galleryCount: form.galleryCount ? Number(form.galleryCount) : undefined
      };
      if (isEdit) await updateEvent(initial._id, payload);
      else await createEvent(payload);
      onSaved();
    } catch (err) {
      setError(err.message || "Could not save event.");
      setStatus("error");
    }
  };

  return (
    <div className="ab-modal-overlay" onClick={onClose}>
      <div className="ab-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button type="button" className="ab-modal-close" onClick={onClose} aria-label="Close">×</button>
        <h3>{isEdit ? "Edit Event" : "Add Event"}</h3>
        <form className="ab-form" onSubmit={submit}>
          <div className="ab-row">
            <div className="ab-field"><label>Date *</label><input required value={form.date} onChange={update("date")} placeholder="e.g. February 14, 2026" /></div>
            <div className="ab-field"><label>Category</label><input value={form.category} onChange={update("category")} placeholder="e.g. Flagship Masterclass" /></div>
          </div>
          <div className="ab-field"><label>Title *</label><input required value={form.title} onChange={update("title")} placeholder="Event title" /></div>
          <div className="ab-field"><label>Description</label><textarea rows={3} value={form.description} onChange={update("description")} placeholder="What is this event about?" /></div>
          <div className="ab-row">
            <div className="ab-field"><label>Speaker</label><input value={form.speaker} onChange={update("speaker")} placeholder="Optional" /></div>
            <div className="ab-field"><label>Venue</label><input value={form.venue} onChange={update("venue")} placeholder="e.g. CSE Auditorium" /></div>
          </div>
          <div className="ab-row">
            <div className="ab-field"><label>Track</label><input value={form.track} onChange={update("track")} placeholder="Optional" /></div>
            <div className="ab-field"><label>Shortlisted Students</label><input type="number" min="0" value={form.shortlistedStudents} onChange={update("shortlistedStudents")} placeholder="Optional" /></div>
          </div>
          <div className="ab-field"><label>Image URL</label><input value={form.image} onChange={update("image")} placeholder="Optional" /></div>
          {status === "error" && <div className="ab-form-msg error">{error}</div>}
          <button className="btn primary" type="submit" disabled={status === "sending"}>
            {status === "sending" ? "Saving…" : isEdit ? "Save Changes" : "Add Event"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function EventsAdmin() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = () => {
    setLoading(true);
    getAdminEvents().then(setEvents).catch((err) => setError(err.message || "Could not load events")).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSaved = () => { setModal(null); load(); };

  const handleDelete = async (id) => {
    setDeleting(id);
    try { await deleteEvent(id); load(); }
    catch (err) { setError(err.message || "Could not delete event"); }
    finally { setDeleting(null); }
  };

  return (
    <div className="adm-section">
      <div className="row-head">
        <h2>All Events ({events.length})</h2>
        <button className="adm-btn-sm primary" onClick={() => setModal("new")}>+ Add Event</button>
      </div>
      {error && <div className="ab-form-msg error" style={{ marginBottom: 14 }}>{error}</div>}
      {loading ? <div className="adm-loading">Loading events…</div> : events.length === 0 ? (
        <div className="adm-empty">No events yet. Click "Add Event" to create one.</div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Title</th><th>Date</th><th>Category</th><th>Venue</th><th></th></tr></thead>
            <tbody>
              {events.map((e) => (
                <tr key={e._id}>
                  <td>{e.title}</td><td className="muted">{e.date}</td><td className="muted">{e.category}</td><td className="muted">{e.venue}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button className="adm-icon-btn" title="Edit" onClick={() => setModal(e)}>✎</button>
                    <button className="adm-icon-btn danger" title="Delete" disabled={deleting === e._id}
                      onClick={() => { if (window.confirm(`Delete "${e.title}"? This cannot be undone.`)) handleDelete(e._id); }}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modal && <EventFormModal initial={modal === "new" ? null : modal} onClose={() => setModal(null)} onSaved={handleSaved} />}
    </div>
  );
}