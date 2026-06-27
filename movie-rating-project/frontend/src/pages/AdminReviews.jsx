import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import toast from "react-hot-toast";
import { Trash2, Pin, ShieldAlert, EyeOff, Search } from "lucide-react";

const AdminReviews = ({ currentUser }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showMuteModal, setShowMuteModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [muteDays, setMuteDays] = useState(3);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reviews?limit=50&search=${search}`);
      setReviews(res.data.reviews || []);
    } catch (err) {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [search]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      await api.delete(`/reviews/${id}`);
      toast.success("Review deleted");
      setReviews(reviews.filter(r => r._id !== id));
    } catch (err) {
      toast.error("Failed to delete review");
    }
  };

  const handlePin = async (id) => {
    try {
      const res = await api.patch(`/staff/reviews/${id}/pin`);
      toast.success(res.data.isPinned ? "Review pinned" : "Review unpinned");
      setReviews(reviews.map(r => r._id === id ? { ...r, isPinned: res.data.isPinned } : r));
    } catch (err) {
      toast.error("Failed to pin review");
    }
  };

  const handleForceSpoiler = async (id) => {
    if (!window.confirm("Force this review to be hidden behind a spoiler tag?")) return;
    try {
      const res = await api.patch(`/staff/reviews/${id}/force-spoiler`, { containsSpoiler: true });
      toast.success("Spoiler tag applied");
      setReviews(reviews.map(r => r._id === id ? { ...r, containsSpoiler: true } : r));
    } catch (err) {
      toast.error("Failed to apply spoiler tag");
    }
  };

  const handleMuteUser = async () => {
    try {
      const res = await api.patch(`/admin/users/${selectedUserId}/mute`, { days: muteDays });
      toast.success(res.data.message || "User muted");
      setShowMuteModal(false);
      // Optional: refresh reviews to show muted status if populated
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to mute user");
    }
  };

  return (
    <div className="admin-shell" style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ margin: 0, color: "var(--primary)" }}>Manage Reviews</h2>
        <div style={{ position: "relative", width: "300px" }}>
          <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
          <input
            type="text"
            placeholder="Search user or movie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 12px 10px 38px", borderRadius: "8px", border: "1px solid #ced4da" }}
          />
        </div>
      </div>

      <div className="admin-card" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #ead6c3", background: "#fdf0ee" }}>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: "600", color: "var(--ink)" }}>Date</th>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: "600", color: "var(--ink)" }}>User</th>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: "600", color: "var(--ink)" }}>Movie</th>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: "600", color: "var(--ink)" }}>Review</th>
              <th style={{ padding: "16px", textAlign: "center", fontWeight: "600", color: "var(--ink)" }}>Status</th>
              <th style={{ padding: "16px", textAlign: "right", fontWeight: "600", color: "var(--ink)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: "center", padding: "24px" }}>Loading...</td></tr>
            ) : reviews.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: "center", padding: "24px" }}>No reviews found.</td></tr>
            ) : reviews.map(r => (
              <tr key={r._id} style={{ borderBottom: "1px solid #ead6c3" }}>
                <td style={{ padding: "16px", whiteSpace: "nowrap", color: "var(--muted)" }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: "16px" }}>
                  <div style={{ fontWeight: "600", color: "var(--ink)" }}>{r.user?.name || "Unknown"}</div>
                  {r.user?.mutedUntil && new Date(r.user.mutedUntil) > new Date() && (
                    <span style={{ fontSize: "0.75rem", background: "var(--danger)", color: "#fff", padding: "2px 6px", borderRadius: "4px" }}>Muted</span>
                  )}
                </td>
                <td style={{ padding: "16px" }}>
                  {r.movie ? (
                    <Link to={`/movies/${r.movie._id}`} style={{ color: "var(--primary)", fontWeight: "600", textDecoration: "none" }}>{r.movie.name}</Link>
                  ) : "Unknown"}
                </td>
                <td style={{ padding: "16px", maxWidth: "300px" }}>
                  <div style={{ display: "flex", gap: "2px", color: "#f59e0b", marginBottom: "4px" }}>
                    {"★".repeat(r.overallRating)}{"☆".repeat(5 - r.overallRating)}
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "var(--ink)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {r.bodyText}
                  </div>
                </td>
                <td style={{ padding: "16px", textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
                    {r.isPinned && <span style={{ background: "#fef3c7", color: "#d97706", padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "600" }}>Pinned</span>}
                    {r.containsSpoiler && <span style={{ background: "#fee2e2", color: "#b91c1c", padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "600" }}>Spoiler</span>}
                  </div>
                </td>
                <td style={{ padding: "16px", textAlign: "right" }}>
                  <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                    <button onClick={() => handlePin(r._id)} title="Toggle Pin" style={{ background: r.isPinned ? "#d97706" : "#fef3c7", color: r.isPinned ? "#fff" : "#d97706", border: "1px solid #fde68a", padding: "6px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Pin size={16} />
                    </button>
                    <button onClick={() => handleForceSpoiler(r._id)} disabled={r.containsSpoiler} title="Force Spoiler" style={{ background: r.containsSpoiler ? "#f3f4f6" : "#fee2e2", color: r.containsSpoiler ? "#9ca3af" : "#b91c1c", border: "1px solid #fecaca", padding: "6px", borderRadius: "6px", cursor: r.containsSpoiler ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <EyeOff size={16} />
                    </button>
                    {r.user && currentUser?.role === "admin" && (
                      <button onClick={() => { setSelectedUserId(r.user._id); setShowMuteModal(true); }} title="Mute User" style={{ background: "#f3e8ff", color: "#7e22ce", border: "1px solid #e9d5ff", padding: "6px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ShieldAlert size={16} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(r._id)} title="Delete Review" style={{ background: "var(--danger)", color: "#fff", border: "none", padding: "6px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showMuteModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="admin-card" style={{ padding: "24px", width: "400px" }}>
            <h3 style={{ marginTop: 0, color: "var(--danger)" }}>Mute User</h3>
            <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>Restrict this user from posting new reviews or editing existing ones.</p>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Duration (Days)</label>
              <select value={muteDays} onChange={(e) => setMuteDays(parseInt(e.target.value))} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ced4da" }}>
                <option value={0}>Unmute (0 days)</option>
                <option value={3}>3 Days</option>
                <option value={7}>7 Days</option>
                <option value={30}>30 Days</option>
                <option value={999}>Permanent</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowMuteModal(false)} className="ghost-button" style={{ border: "1px solid #ced4da", padding: "8px 16px" }}>Cancel</button>
              <button onClick={handleMuteUser} className="primary-button" style={{ background: "var(--danger)", padding: "8px 16px" }}>Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
