import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import toast from "react-hot-toast";
import { Trash2, Globe, Lock } from "lucide-react";
import CustomSelect from "../components/CustomSelect.jsx";

const statusOptions = [
  { value: "watching", label: "Watching", color: "var(--primary)", bg: "#e0f2fe" },
  { value: "will_watch", label: "Plan to Watch", color: "#4b5563", bg: "#f3f4f6" },
  { value: "completed", label: "Completed", color: "#16a34a", bg: "#dcfce3" },
];

const statusColors = {
  watching: { bg: "#fff3cd", color: "#856404" },
  will_watch: { bg: "#d1ecf1", color: "#0c5460" },
  completed: { bg: "#d4edda", color: "#155724" },
};

const WatchlistPage = ({ currentUser }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");

  const fetchWatchlist = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const res = await api.get("/watchlist", { params });
      setItems(res.data.items || []);
    } catch {
      toast.error("Failed to load watchlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, [filterStatus]);

  const handleUpdateStatus = async (movieId, status) => {
    try {
      await api.put(`/watchlist/${movieId}`, { status });
      toast.success("Status updated");
      fetchWatchlist();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleRemove = async (movieId) => {
    try {
      await api.delete(`/watchlist/${movieId}`);
      setItems(prev => prev.filter(item => item.movie?._id !== movieId));
      toast.success("Removed from watchlist");
    } catch {
      toast.error("Failed to remove");
    }
  };

  const handleTogglePrivacy = async (movieId) => {
    try {
      const res = await api.patch(`/watchlist/${movieId}/privacy`);
      toast.success(res.data.isPublic ? "Set to public" : "Set to private");
      fetchWatchlist();
    } catch {
      toast.error("Failed to toggle privacy");
    }
  };

  const handleSetAllPrivacy = async (isPublic) => {
    try {
      await api.patch("/watchlist/privacy", { isPublic });
      toast.success(isPublic ? "All items set to public" : "All items set to private");
      fetchWatchlist();
    } catch {
      toast.error("Failed to update privacy");
    }
  };

  if (loading) {
    return (
      <div className="admin-shell" style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
        <p className="admin-muted">Loading watchlist...</p>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <h2 style={{ margin: 0, color: "var(--primary)" }}>Watchlist</h2>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <CustomSelect
            value={filterStatus}
            onChange={(val) => setFilterStatus(val)}
            options={[{ value: "", label: "All status" }, ...statusOptions]}
            placeholder="Filter by status"
            buttonStyle={{ padding: "6px 12px", fontSize: "0.85rem" }}
          />
          <button onClick={() => handleSetAllPrivacy(true)} className="ghost-button" style={{ fontSize: "0.8rem", padding: "6px 10px" }} title="Make all public">
            <Globe size={14} /> All Public
          </button>
          <button onClick={() => handleSetAllPrivacy(false)} className="ghost-button" style={{ fontSize: "0.8rem", padding: "6px 10px" }} title="Make all private">
            <Lock size={14} /> All Private
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="admin-card" style={{ padding: "2rem", textAlign: "center" }}>
          <p className="admin-muted">Your watchlist is empty. Browse movies to add some!</p>
          <Link to="/trending" className="primary-button" style={{ marginTop: "1rem", display: "inline-block" }}>
            Trending
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
          {items.map(item => {
            const movie = item.movie;
            if (!movie) return null;
            const sc = statusColors[item.status] || {};
            return (
              <div key={item._id} className="admin-card" style={{ padding: 0 }}>
                <div style={{ display: "flex", gap: "12px", padding: "12px" }}>
                  <Link to={`/movies/${movie._id}`} style={{ flexShrink: 0, textDecoration: "none" }}>
                    <div style={{ position: "relative", width: "80px", aspectRatio: "2/3", borderRadius: "8px", overflow: "hidden", backgroundColor: "#eee" }}>
                      {movie.poster ? (
                        <img
                          src={movie.poster.startsWith("http") ? movie.poster : `${import.meta.env.VITE_API_URL.replace("/api", "")}${movie.poster}`}
                          alt={movie.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#888", fontSize: "0.7rem" }}>No Poster</div>
                      )}
                      <div
                        style={{
                          position: "absolute",
                          top: "4px",
                          right: "4px",
                          background: "rgba(0,0,0,0.7)",
                          color: "#fff",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "0.7rem",
                          fontWeight: "bold",
                          display: "flex",
                          alignItems: "center",
                          gap: "3px"
                        }}
                      >
                        <span style={{ color: "#f59e0b", fontSize: "0.85rem", lineHeight: 1 }}>★</span>
                        <span>{movie.averageRating > 0 ? movie.averageRating.toFixed(1) : "N/A"}</span>
                      </div>
                    </div>
                  </Link>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link to={`/movies/${movie._id}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <h4 style={{ margin: "0 0 6px 0", fontSize: "0.95rem", fontWeight: "600", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{movie.name}</h4>
                    </Link>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <span style={{ background: sc.bg, color: sc.color, padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px" }}>
{statusOptions.find(o => o.value === item.status)?.label}
                      </span>
                      <button
                        onClick={() => handleTogglePrivacy(item.movie?._id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "2px" }}
                        title={item.isPublic ? "Public" : "Private"}
                      >
                        {item.isPublic ? <Globe size={14} /> : <Lock size={14} />}
                      </button>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center" }}>
                      <CustomSelect
                        value={item.status}
                        onChange={(val) => handleUpdateStatus(item.movie?._id, val)}
                        options={statusOptions}
                        buttonStyle={{ padding: "4px 8px", fontSize: "0.75rem" }}
                      />
                      <button
                        onClick={() => handleRemove(item.movie?._id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", padding: "4px" }}
                        title="Remove from watchlist"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WatchlistPage;
