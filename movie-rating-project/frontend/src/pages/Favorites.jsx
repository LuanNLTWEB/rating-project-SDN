import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import toast from "react-hot-toast";
import { Heart, Trash2 } from "lucide-react";

const Favorites = ({ currentUser }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

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
      setFavorites(prev => prev.filter(f => f.movie?._id !== movieId));
      toast.success("Removed from favorites");
    } catch {
      toast.error("Failed to remove");
    }
  };

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
        <h2 style={{ margin: 0, color: "var(--primary)" }}>
          <Heart size={20} style={{ marginRight: "8px", verticalAlign: "middle" }} />
          Favorites
        </h2>
        <span className="role-badge" style={{ background: "#f5e4d3", color: "var(--primary)", fontWeight: "600" }}>
          {favorites.length} movies
        </span>
      </div>

      {favorites.length === 0 ? (
        <div className="admin-card" style={{ padding: "2rem", textAlign: "center" }}>
          <p className="admin-muted">No favorites yet. Browse movies and add some!</p>
          <Link to="/trending" className="primary-button" style={{ marginTop: "1rem", display: "inline-block" }}>
            Trending
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.5rem" }}>
          {favorites.map(fav => {
            const movie = fav.movie;
            if (!movie) return null;
            return (
              <div key={fav._id} className="admin-card" style={{ overflow: "hidden", position: "relative" }}>
                <Link to={`/movies/${movie._id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{ width: "100%", aspectRatio: "2/3", backgroundColor: "#eee", overflow: "hidden" }}>
                    {movie.poster ? (
                      <img
                        src={movie.poster.startsWith("http") ? movie.poster : `${import.meta.env.VITE_API_URL.replace("/api", "")}${movie.poster}`}
                        alt={movie.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#888" }}>No Poster</div>
                    )}
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
