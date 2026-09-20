import React, { useEffect, useState } from "react";
import { getAdminStats, getAdminEvents, getApplications, getMessages } from "../adminApi.js";

export default function DashboardHome() {
  const [stats, setStats] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    Promise.all([getAdminStats(), getAdminEvents(), getApplications(), getMessages()])
      .then(([statsData, events, applications, messages]) => {
        if (!alive) return;
        setStats(statsData);
        setRecentEvents([...events].slice(-5).reverse());
        setRecentApplications(applications.slice(0, 5));
        setRecentMessages(messages.slice(0, 5));
      })
      .catch((err) => { if (alive) setError(err.message || "Could not load dashboard data"); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (loading) return <div className="adm-loading">Loading dashboard…</div>;
  if (error) return <div className="ab-form-msg error">{error}</div>;

  const cards = [
    { label: "Total Events", value: stats.events },
    { label: "Total Team Members", value: stats.teamMembers },
    { label: "Membership Applications", value: stats.membershipApplications, hint: `${stats.pendingApplications} pending` },
    { label: "Contact Messages", value: stats.contactMessages, hint: `${stats.newMessages} new` },
    { label: "Gallery Items", value: stats.galleryItems }
  ];

  return (
    <>
      <div className="adm-cards">
        {cards.map((c) => (
          <div className="adm-card" key={c.label}>
            <div className="num">{c.value}</div>
            <div className="label">{c.label}</div>
            {c.hint && <div className="label" style={{ marginTop: 2, opacity: 0.8 }}>{c.hint}</div>}
          </div>
        ))}
      </div>

      <div className="adm-section">
        <h2>Recent Events</h2>
        {recentEvents.length === 0 ? <div className="adm-empty">No events yet.</div> : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Title</th><th>Date</th><th>Category</th></tr></thead>
              <tbody>
                {recentEvents.map((e) => (
                  <tr key={e._id}><td>{e.title}</td><td className="muted">{e.date}</td><td className="muted">{e.category}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="adm-section">
        <h2>Recent Membership Applications</h2>
        {recentApplications.length === 0 ? <div className="adm-empty">No applications yet.</div> : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Name</th><th>Email</th><th>Status</th></tr></thead>
              <tbody>
                {recentApplications.map((a) => (
                  <tr key={a._id}><td>{a.name}</td><td className="muted">{a.email}</td><td><span className={`adm-badge ${a.status}`}>{a.status}</span></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="adm-section">
        <h2>Recent Contact Messages</h2>
        {recentMessages.length === 0 ? <div className="adm-empty">No messages yet.</div> : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Name</th><th>Email</th><th>Status</th></tr></thead>
              <tbody>
                {recentMessages.map((m) => (
                  <tr key={m._id}><td>{m.name}</td><td className="muted">{m.email}</td><td><span className={`adm-badge ${m.status}`}>{m.status}</span></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}