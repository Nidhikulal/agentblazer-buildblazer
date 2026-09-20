const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");
const TOKEN_KEY = "ab_admin_token";
const ADMIN_KEY = "ab_admin_profile";

export function getToken() { return localStorage.getItem(TOKEN_KEY); }
export function setSession(token, admin) {
  localStorage.setItem(TOKEN_KEY, token);
  if (admin) localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
}
export function getAdminProfile() {
  try { return JSON.parse(localStorage.getItem(ADMIN_KEY) || "null"); } catch (e) { return null; }
}
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
}
export function isLoggedIn() { return Boolean(getToken()); }

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  let data = null;
  try { data = await res.json(); } catch (e) {}

  if (res.status === 401) clearSession();
  if (!res.ok) throw new Error((data && data.message) || `Request failed (${res.status})`);
  return data;
}

export const adminLogin = (email, password) =>
  request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });

export const getAdminStats = () => request("/stats/admin");

export const getAdminEvents = () => request("/events");
export const createEvent = (payload) => request("/events", { method: "POST", body: JSON.stringify(payload) });
export const updateEvent = (id, payload) => request(`/events/${id}`, { method: "PUT", body: JSON.stringify(payload) });
export const deleteEvent = (id) => request(`/events/${id}`, { method: "DELETE" });

export const getAdminTeam = () => request("/team");
export const createTeamMember = (payload) => request("/team", { method: "POST", body: JSON.stringify(payload) });
export const updateTeamMember = (id, payload) => request(`/team/${id}`, { method: "PUT", body: JSON.stringify(payload) });
export const deleteTeamMember = (id) => request(`/team/${id}`, { method: "DELETE" });

export const getApplications = () => request("/members");
export const updateApplicationStatus = (id, status) =>
  request(`/members/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });

export const getMessages = () => request("/contact");
export const updateMessageStatus = (id, status) =>
  request(`/contact/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });

export const getAdminGallery = () => request("/gallery");
export const createGalleryItem = (payload) => request("/gallery", { method: "POST", body: JSON.stringify(payload) });
export const deleteGalleryItem = (id) => request(`/gallery/${id}`, { method: "DELETE" });

export const getAdminSettings = () => request("/settings");
export const updateAdminSettings = (payload) => request("/settings", { method: "PUT", body: JSON.stringify(payload) });