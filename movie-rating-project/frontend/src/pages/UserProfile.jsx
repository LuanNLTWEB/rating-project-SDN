import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api.js";
import { Star, Calendar, Globe, Clock } from "lucide-react";

const statusColors = {
  watching: { bg: "#fff3cd", color: "#856404" },
  will_watch: { bg: "#d1ecf1", color: "#0c5460" },
  completed: { bg: "#d4edda", color: "#155724" },
  on_hold: { bg: "#f8f9fa", color: "#6c757d" },
  dropped: { bg: "#fee2e2", color: "#b91c1c" },
};

const statusLabels = {
  watching: "Watching",
  will_watch: "Plan to Watch",
  completed: "Completed",
  on_hold: "On Hold",
  dropped: "Dropped",
};

const UserProfile = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/users/${id}/public-profile`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) {
    return <div className="admin-shell" style={{ textAlign: "center", padding: "3rem" }}><p className="admin-muted">Loading profile...</p></div>;
  }

  if (error) {
    return (
      <div className="admin-shell" style={{ textAlign: "center", padding: "3rem" }}>
        <p style={{ color: "var(--danger)" }}>{error}</p>
        <Link to="/" className="primary-button" style={{ marginTop: "1rem", display: "inline-block" }}>Back to Home</Link>
      </div>
    );
  }

  const { user, favorites, watchlist } = data;

  return (
    <div className="admin-shell" style={{ maxWidth: "1100px", margin: "0 auto" }}>
      <div className="admin-card" style={{ padding: "2rem", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
        <div style={{ width: "100px", height: "100px", borderRadius: "50%", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "2.5rem", flexShrink: 0, overflow: "hidden" }}>
          {user.avatar ? (
            <img src={user.avatar.startsWith("http") ? user.avatar : `http://localhost:5000${user.avatar}`} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            user.name?.[0]?.toUpperCase() || "?"
          )}
        </div>
        <div>
          <h2 style={{ margin: "0 0 4px 0", color: "var(--ink)" }}>{user.name}</h2>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", fontSize: "0.9rem", color: "var(--muted)" }}>
            <span className="role-badge" style={{ background: "#f5e4d3", color: "var(--primary)", fontWeight: "600", textTransform: "capitalize" }}>{user.role}</span>
            <span>{user.gender === "male" ? "Male" : user.gender === "female" ? "Female" : "Other"}</span>
            <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
            <Globe size={20} color="var(--primary)" />
            <h3 style={{ margin: 0, color: "var(--ink)" }}>Public Watchlist ({watchlist.length})</h3>
          </div>
          {watchlist.length === 0 ? (
            <div className="admin-card" style={{ padding: "2rem", textAlign: "center" }}>
              <p className="admin-muted">No public watchlist items.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {watchlist.map(item => {
                const movie = item.movie;
                if (!movie) return null;
                const sc = statusColors[item.status] || {};
                return (
                  <div key={item._id} className="admin-card" style={{ padding: "12px", display: "flex", gap: "12px" }}>
                    <Link to={`/movies/${movie._id}`} style={{ flexShrink: 0 }}>
                      <div style={{ width: "60px", aspectRatio: "2/3", borderRadius: "6px", overflow: "hidden", backgroundColor: "#eee" }}>
                        {movie.poster ? (
                          <img
                            src={movie.poster.startsWith("http") ? movie.poster : `${import.meta.env.VITE_API_URL.replace("/api", "")}${movie.poster}`}
                            alt={movie.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#888", fontSize: "0.7rem" }}>No Poster</div>
                        )}
                      </div>
                    </Link>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link to={`/movies/${movie._id}`} style={{ textDecoration: "none", color: "inherit" }}>
                        <h4 style={{ margin: "0 0 4px 0", fontSize: "0.95rem", fontWeight: "600", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{movie.name}</h4>
                      </Link>
                      <span style={{ background: sc.bg, color: sc.color, padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "600" }}>
                        {statusLabels[item.status]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
            <Star size={20} color="var(--primary)" fill="var(--primary)" />
            <h3 style={{ margin: 0, color: "var(--ink)" }}>Favorites ({favorites.length})</h3>
          </div>
          {favorites.length === 0 ? (
            <div className="admin-card" style={{ padding: "2rem", textAlign: "center" }}>
              <p className="admin-muted">No favorites yet.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1rem" }}>
              {favorites.map(fav => {
                const movie = fav.movie;
                if (!movie) return null;
                return (
                  <div key={fav._id} className="admin-card" style={{ overflow: "hidden", padding: 0 }}>
                    <Link to={`/movies/${movie._id}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <div style={{ position: "relative", width: "100%", aspectRatio: "2/3", backgroundColor: "#eee", overflow: "hidden" }}>
                        <div style={{ position: "absolute", top: "4px", left: "4px", background: "rgba(0,0,0,0.7)", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "3px" }}>
                          <span style={{ color: "#f59e0b", fontSize: "0.9rem" }}>★</span>
                          <span>{movie.averageRating > 0 ? movie.averageRating.toFixed(1) : "N/A"}</span>
                        </div>
                        {movie.poster ? (
                          <img src={movie.poster.startsWith("http") ? movie.poster : `${import.meta.env.VITE_API_URL.replace("/api", "")}${movie.poster}`} alt={movie.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#888" }}>No Poster</div>
                        )}
                      </div>
                      <div style={{ padding: "10px" }}>
                        <h4 style={{ margin: 0, fontSize: "0.85rem", fontWeight: "600", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{movie.name}</h4>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;