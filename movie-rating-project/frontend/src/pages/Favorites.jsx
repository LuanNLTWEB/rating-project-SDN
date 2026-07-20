import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import toast from "react-hot-toast";
import { Trash2, Search, ArrowUpDown, Star, TrendingUp, Calendar, Film } from "lucide-react";

const SORT_OPTIONS = [
  { value: "name-asc", label: "Name A-Z" },
  { value: "name-desc", label: "Name Z-A" },
  { value: "rating-desc", label: "Highest Rated" },
  { value: "rating-asc", label: "Lowest Rated" },
  { value: "date-desc", label: "Newest" },
  { value: "date-asc", label: "Oldest" },
];

const RATING_FILTERS = [
  { value: 0, label: "All Ratings" },
  { value: 4, label: "4+ Stars" },
  { value: 3, label: "3+ Stars" },
  { value: 2, label: "2+ Stars" },
  { value: 1, label: "1+ Stars" },
];

const Favorites = ({ currentUser }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [ratingFilter, setRatingFilter] = useState(0);

  const fetchFavorites = async () => {
    try {
      const res = await api.get("/favorites");
      setFavorites(res.data.favorites || []);
    } catch {
      toast.error("Failed to load favorites");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRemove = async (movieId) => {
    try {
      await api.delete(`/favorites/${movieId}`);
      setFavorites((prev) => prev.filter((f) => f.movie?._id !== movieId));
      toast.success("Removed from favorites");
    } catch {
      toast.error("Failed to remove");
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = favorites.filter((f) => f.movie);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((f) => f.movie.name.toLowerCase().includes(q));
    }

    if (ratingFilter > 0) {
      result = result.filter((f) => f.movie.averageRating >= ratingFilter);
    }

    const [key, dir] = sortBy.split("-");
    result.sort((a, b) => {
      let valA, valB;
      switch (key) {
        case "name":
          valA = a.movie.name.toLowerCase();
          valB = b.movie.name.toLowerCase();
          return dir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        case "rating":
          valA = a.movie.averageRating || 0;
          valB = b.movie.averageRating || 0;
          return dir === "asc" ? valA - valB : valB - valA;
        case "date":
          valA = new Date(a.createdAt || 0);
          valB = new Date(b.createdAt || 0);
          return dir === "asc" ? valA - valB : valB - valA;
        default:
          return 0;
      }
    });

    return result;
  }, [favorites, search, sortBy, ratingFilter]);

  const stats = useMemo(() => {
    const movies = favorites.filter((f) => f.movie).map((f) => f.movie);
    if (movies.length === 0) return { total: 0, avgRating: 0, highest: null, lowest: null };
    const ratings = movies.filter((m) => m.averageRating > 0).map((m) => m.averageRating);
    const avg = ratings.length > 0 ? (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1) : "0.0";
    const highest = movies.reduce((a, b) => (a.averageRating > b.averageRating ? a : b));
    const lowest = movies.reduce((a, b) => (a.averageRating < b.averageRating ? a : b));
    return { total: movies.length, avgRating: avg, highest, lowest };
  }, [favorites]);

  if (loading) {
    return (
      <div className="admin-shell" style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
        <p className="admin-muted">Loading favorites...</p>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ margin: 0, color: "var(--primary)" }}>Favorites</h2>
        <span className="role-badge" style={{ background: "#f5e4d3", color: "var(--primary)", fontWeight: "600" }}>
          {favorites.length} movies
        </span>
      </div>

      {favorites.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            <div className="admin-card" style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Film size={20} color="#d97706" />
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Total</div>
                <div style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--ink)" }}>{stats.total}</div>
              </div>
            </div>
            <div className="admin-card" style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Star size={20} color="#0369a1" />
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Avg Rating</div>
                <div style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--ink)" }}>{stats.avgRating}</div>
              </div>
            </div>
            <div className="admin-card" style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <TrendingUp size={20} color="#16a34a" />
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Highest</div>
                <div style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "140px" }}>
                  {stats.highest?.averageRating?.toFixed(1)} <span style={{ fontSize: "0.75rem", fontWeight: "400", color: "var(--muted)" }}>{stats.highest?.name?.slice(0, 15)}...</span>
                </div>
              </div>
            </div>
            <div className="admin-card" style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Calendar size={20} color="#dc2626" />
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Lowest</div>
                <div style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "140px" }}>
                  {stats.lowest?.averageRating?.toFixed(1)} <span style={{ fontSize: "0.75rem", fontWeight: "400", color: "var(--muted)" }}>{stats.lowest?.name?.slice(0, 15)}...</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: "1 1 220px", maxWidth: "360px" }}>
              <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
              <input
                type="text"
                placeholder="Search favorites..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%", padding: "0.55rem 0.75rem 0.55rem 2.2rem", border: "1px solid #ead6c3", borderRadius: "8px", fontSize: "0.9rem", background: "#fff", outline: "none" }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <ArrowUpDown size={14} color="var(--muted)" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ padding: "0.55rem 0.75rem", border: "1px solid #ead6c3", borderRadius: "8px", fontSize: "0.85rem", background: "#fff", cursor: "pointer", outline: "none" }}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Star size={14} color="var(--muted)" />
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(Number(e.target.value))}
                style={{ padding: "0.55rem 0.75rem", border: "1px solid #ead6c3", borderRadius: "8px", fontSize: "0.85rem", background: "#fff", cursor: "pointer", outline: "none" }}
              >
                {RATING_FILTERS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}

      {favorites.length === 0 ? (
        <div className="admin-card" style={{ padding: "3rem 2rem", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
            <span role="img" aria-label="heart">&#10084;&#65039;</span>
          </div>
          <h3 style={{ margin: "0 0 0.5rem", color: "var(--ink)" }}>Your favorites list is empty</h3>
          <p className="admin-muted" style={{ margin: "0 0 1.5rem", maxWidth: "360px", marginLeft: "auto", marginRight: "auto" }}>
            Start exploring and save movies you love. They will appear right here.
          </p>
          <Link to="/trending" className="primary-button" style={{ display: "inline-block", textDecoration: "none" }}>
            Browse Trending
          </Link>
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <div className="admin-card" style={{ padding: "2rem", textAlign: "center" }}>
          <p className="admin-muted">No favorites match your search or filter.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.5rem" }}>
          {filteredAndSorted.map((fav) => {
            const movie = fav.movie;
            return (
              <div key={fav._id} className="admin-card" style={{ overflow: "hidden", position: "relative" }}>
                <Link to={`/movies/${movie._id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{ position: "relative", width: "100%", aspectRatio: "2/3", backgroundColor: "#eee", overflow: "hidden" }}>
                    {movie.poster ? (
                      <img
                        src={movie.poster.startsWith("http") ? movie.poster : `${import.meta.env.VITE_API_URL.replace("/api", "")}${movie.poster}`}
                        alt={movie.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#888" }}>No Poster</div>
                    )}
                    <div
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        background: "rgba(0,0,0,0.7)",
                        color: "#fff",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "0.85rem",
                        fontWeight: "bold",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <span style={{ color: "#f59e0b", fontSize: "1.1rem", lineHeight: 1 }}>&#9733;</span>
                      <span>{movie.averageRating > 0 ? movie.averageRating.toFixed(1) : "N/A"}</span>
                    </div>
                  </div>
                  <div style={{ padding: "12px" }}>
                    <h4 style={{ margin: "0 0 4px 0", fontSize: "0.95rem", fontWeight: "600", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{movie.name}</h4>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)" }}>
                      {new Date(movie.releaseDate).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => handleRemove(movie._id)}
                  style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--danger)", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
                  title="Remove from favorites"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Favorites;
