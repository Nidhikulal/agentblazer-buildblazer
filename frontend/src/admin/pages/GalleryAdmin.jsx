import React, { useEffect, useState } from "react";
import { getAdminGallery, createGalleryItem, deleteGalleryItem, getAdminEvents } from "../adminApi.js";

const EMPTY_FORM = { eventId: "", title: "", imageUrl: "", caption: "" };

function GalleryFormModal({ events, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const payload = { ...form };
      if (!payload.eventId) delete payload.eventId;
      await createGalleryItem(payload);
      onSaved();
    } catch (err) {
      setError(err.message || "Could not add gallery item.");
      setStatus("error");
    }
  };

  return (
    <div className="ab-modal-overlay" onClick={onClose}>
      <div className="ab-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button type="button" className="ab-modal-close" onClick={onClose} aria-label="Close">×</button>
        <h3>Add Gallery Image</h3>
        <form className="ab-form" onSubmit={submit}>
          <div className="ab-field">
            <label>Linked Event</label>
            <select className="adm-select" style={{ width: "100%", height: 44 }} value={form.eventId} onChange={update("eventId")}>
              <option value="">— None —</option>
              {events.map((ev) => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
            </select>
          </div>
          <div className="ab-field"><label>Image URL *</label><input required value={form.imageUrl} onChange={update("imageUrl")} placeholder="https://..." /></div>
          <div className="ab-field"><label>Title</label><input value={form.title} onChange={update("title")} placeholder="Optional" /></div>
          <div className="ab-field"><label>Caption</label><input value={form.caption} onChange={update("caption")} placeholder="Optional" /></div>
          {status === "error" && <div className="ab-form-msg error">{error}</div>}
          <button className="btn primary" type="submit" disabled={status === "sending"}>
            {status === "sending" ? "Adding…" : "Add Image"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function GalleryAdmin() {
  const [items, setItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([getAdminGallery(), getAdminEvents()])
      .then(([galleryData, eventsData]) => { setItems(galleryData); setEvents(eventsData); })
      .catch((err) => setError(err.message || "Could not load gallery"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSaved = () => { setShowForm(false); load(); };

  const handleDelete = async (id) => {
    setDeleting(id);
    try { await deleteGalleryItem(id); load(); }
    catch (err) { setError(err.message || "Could not delete image"); }
    finally { setDeleting(null); }
  };

  const eventTitle = (id) => events.find((ev) => ev._id === id)?.title || "—";

  return (
    <div className="adm-section">
      <div className="row-head">
        <h2>Gallery ({items.length})</h2>
        <button className="adm-btn-sm primary" onClick={() => setShowForm(true)}>+ Add Image</button>
      </div>
      {error && <div className="ab-form-msg error" style={{ marginBottom: 14 }}>{error}</div>}
      {loading ? <div className="adm-loading">Loading gallery…</div> : items.length === 0 ? (
        <div className="adm-empty">No gallery images yet. Click "Add Image" to add one.</div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Preview</th><th>Title</th><th>Linked Event</th><th>Caption</th><th></th></tr></thead>
            <tbody>
              {items.map((it) => (
                <tr key={it._id}>
                  <td><img src={it.imageUrl} alt={it.title || "gallery"} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }} /></td>
                  <td>{it.title || "—"}</td>
                  <td className="muted">{it.eventId ? eventTitle(it.eventId) : "—"}</td>
                  <td className="muted">{it.caption || "—"}</td>
                  <td>
                    <button className="adm-icon-btn danger" title="Delete" disabled={deleting === it._id}
                      onClick={() => { if (window.confirm("Delete this gallery image?")) handleDelete(it._id); }}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showForm && <GalleryFormModal events={events} onClose={() => setShowForm(false)} onSaved={handleSaved} />}
    </div>
  );
}