import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const Trending = ({ currentUser }) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/movies/trending`, {
          params: { limit: 20 },
        });
        setMovies(res.data.movies || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  if (loading) {
    return (
      <div className="admin-shell" style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
        <p className="admin-muted">Loading trending movies...</p>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ margin: 0, color: "var(--primary)" }}>Anime đang thịnh hành</h2>
      </div>

      {movies.length === 0 ? (
        <div className="admin-card" style={{ padding: "2rem", textAlign: "center" }}>
          <p className="admin-muted">No trending movies available.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.5rem" }}>
          {movies.map((movie, index) => (
            <Link
              key={movie._id}
              to={`/movies/${movie._id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="admin-card" style={{ overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s", cursor: "pointer" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.12)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ position: "relative", width: "100%", aspectRatio: "2/3", backgroundColor: "#eee", overflow: "hidden" }}>
                  {movie.poster ? (
                    <img
                      src={movie.poster.startsWith("http") ? movie.poster : `${import.meta.env.VITE_API_URL.replace("/api", "")}${movie.poster}`}
                      alt={movie.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#888", fontSize: "0.9rem" }}>
                      No Poster
                    </div>
                  )}
                  {/* Ranking badge */}
                  <div style={{ position: "absolute", top: "8px", left: "8px", background: "var(--primary)", color: "#fff", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "0.8rem", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                    {index + 1}
                  </div>
                  <span style={{ position: "absolute", bottom: "8px", left: "8px", background: "rgba(0,0,0,0.7)", color: "#fff", padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", textTransform: "uppercase" }}>
                    {movie.status}
                  </span>
                </div>
                <div style={{ padding: "12px" }}>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "0.95rem", fontWeight: "600", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: "1.3" }}>{movie.name}</h4>
                  {movie.genres && movie.genres.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
                      {movie.genres.slice(0, 2).map(g => (
                        <span key={g._id} className="role-badge status-active" style={{ fontSize: "0.7rem", padding: "2px 6px" }}>{g.name}</span>
                      ))}
                    </div>
                  )}
                  <p style={{ margin: "6px 0 0 0", fontSize: "0.8rem", color: "var(--muted)" }}>
                    {new Date(movie.releaseDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Trending;
