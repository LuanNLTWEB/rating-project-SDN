import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Pagination from "../components/Pagination";

const rankColors = [
  { bg: "#FFD700", color: "#1d1a17", label: "#1" },
  { bg: "#C0C0C0", color: "#1d1a17", label: "#2" },
  { bg: "#CD7F32", color: "#fff", label: "#3" },
];

const sortOptions = [
  { value: "trending", label: "Trending" },
  { value: "popular", label: "Most Popular" },
  { value: "rating", label: "Top Rated" },
];

const ITEMS_PER_PAGE = 20;

const Trending = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("trending");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      try {
        const params = { limit: 200 };
        let url = `${import.meta.env.VITE_API_URL}/movies/trending`;
        if (sortBy === "popular") {
          url = `${import.meta.env.VITE_API_URL}/movies/popular`;
        } else if (sortBy === "rating") {
          url = `${import.meta.env.VITE_API_URL}/movies/top-rated`;
        } else {
          params.sort = sortBy;
        }
        const res = await axios.get(url, { params });
        setMovies(res.data.movies || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, [sortBy]);

  const totalPages = Math.ceil(movies.length / ITEMS_PER_PAGE);
  const paginatedMovies = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return movies.slice(start, start + ITEMS_PER_PAGE);
  }, [movies, page]);

  useEffect(() => { setPage(1); }, [sortBy]);

  const renderMeta = (movie) => {
    switch (sortBy) {
      case "rating":
        return movie.averageRating > 0
          ? <span style={{ fontWeight: "600", color: "#f59e0b" }}>★ {movie.averageRating.toFixed(1)}</span>
          : <span style={{ color: "var(--muted)", fontStyle: "italic" }}>No rating</span>;
      case "popular":
        return movie.memberCount > 0
          ? <span style={{ fontWeight: "600" }}>{movie.memberCount.toLocaleString()} in Watchlists</span>
          : <span style={{ color: "var(--muted)", fontStyle: "italic" }}>0 in Watchlists</span>;
      default:
        return movie.viewCount > 0
          ? <span style={{ fontWeight: "600" }}>{movie.viewCount.toLocaleString()} views</span>
          : null;
    }
  };

  if (loading) {
    return (
      <div className="admin-shell" style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
        <p className="admin-muted">Loading trending...</p>
      </div>
    );
  }

  const top3 = page === 1 ? paginatedMovies.slice(0, 3) : [];
  const rest = page === 1 ? paginatedMovies.slice(3) : paginatedMovies;

  return (
    <div className="admin-shell">
      {/* Sort tabs */}
      <div className="admin-card" style={{ padding: "0.75rem 1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
          {sortOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSortBy(opt.value)}
              style={{
                padding: "0.5rem 1.25rem",
                fontSize: "0.85rem",
                fontWeight: sortBy === opt.value ? "600" : "400",
                background: sortBy === opt.value ? "var(--primary)" : "transparent",
                color: sortBy === opt.value ? "#fff" : "var(--ink)",
                border: sortBy === opt.value ? "1px solid var(--primary)" : "1px solid #c9b39d",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {movies.length === 0 ? (
        <div className="admin-card" style={{ padding: "3rem", textAlign: "center", borderRadius: "16px" }}>
          <p className="admin-muted" style={{ fontSize: "1.1rem" }}>No movies found.</p>
        </div>
      ) : (
        <>
          {/* Top 3 */}
          {top3.length > 0 && (
            <div style={{ marginBottom: "2.5rem" }}>
              <h3 style={{ margin: "0 0 1rem 0", color: "var(--primary)", borderBottom: "2px solid var(--primary)", paddingBottom: "0.5rem" }}>
                Top 3
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
                {top3.map((movie, index) => {
                  const rank = rankColors[index];
                  return (
                    <Link
                      key={movie._id}
                      to={`/movies/${movie._id}`}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <div
                        className="admin-card"
                        style={{
                          overflow: "hidden", borderRadius: "16px",
                          border: index === 0 ? "2px solid #FFD700" : "1px solid #ead6c3",
                          transition: "transform 0.25s, box-shadow 0.25s",
                          cursor: "pointer", height: "100%",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.12)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                      >
                        <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", backgroundColor: "#eee", overflow: "hidden" }}>
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
                          <div
                            style={{
                              position: "absolute", top: "8px", left: "8px",
                              background: rank.bg, color: rank.color,
                              width: "34px", height: "34px", borderRadius: "50%",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontWeight: "bold", fontSize: "1rem", boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                            }}
                          >
                            {rank.label}
                          </div>
                          <span style={{ position: "absolute", bottom: "8px", left: "8px", background: "rgba(0,0,0,0.75)", color: "#fff", padding: "3px 10px", borderRadius: "4px", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: "600" }}>
                            {movie.status}
                          </span>
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
                            <span style={{ color: "#f59e0b", fontSize: "1.1rem", lineHeight: 1 }}>★</span>
                            <span>{movie.averageRating > 0 ? movie.averageRating.toFixed(1) : "N/A"}</span>
                          </div>
                        </div>
                        <div style={{ padding: "14px" }}>
                          <h4 style={{ margin: "0 0 6px 0", fontSize: "1rem", fontWeight: "700", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{movie.name}</h4>
                          {movie.genres && movie.genres.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "6px" }}>
                              {movie.genres.slice(0, 3).map(g => (
                                <span key={g._id} className="role-badge status-active" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>{g.name}</span>
                              ))}
                            </div>
                          )}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", color: "var(--muted)" }}>
                            <span>{new Date(movie.releaseDate).toLocaleDateString()}</span>
                            {renderMeta(movie)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Rest */}
          {rest.length > 0 && (
            <div>
              <h3 style={{ margin: "0 0 1rem 0", color: "var(--primary)", borderBottom: "2px solid var(--primary)", paddingBottom: "0.5rem" }}>
                All Movies
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1.25rem" }}>
                {rest.map((movie, index) => {
                  const rankNum = page === 1 ? index + 4 : (page - 1) * ITEMS_PER_PAGE + index + 1;
                  return (
                  <Link
                    key={movie._id}
                    to={`/movies/${movie._id}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div
                      className="admin-card"
                      style={{
                        overflow: "hidden", borderRadius: "12px", border: "1px solid #ead6c3",
                        transition: "transform 0.2s, box-shadow 0.2s", cursor: "pointer", height: "100%",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.1)"; }}
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
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#888", fontSize: "0.8rem" }}>
                            No Poster
                          </div>
                        )}
                        <span style={{ position: "absolute", top: "6px", left: "6px", background: "rgba(0,0,0,0.6)", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "0.75rem" }}>
                          {rankNum}
                        </span>
                        <div
                          style={{
                            position: "absolute",
                            top: "6px",
                            right: "6px",
                            background: "rgba(0,0,0,0.7)",
                            color: "#fff",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "0.8rem",
                            fontWeight: "bold",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          <span style={{ color: "#f59e0b", fontSize: "1rem", lineHeight: 1 }}>★</span>
                          <span>{movie.averageRating > 0 ? movie.averageRating.toFixed(1) : "N/A"}</span>
                        </div>
                        <span style={{ position: "absolute", bottom: "6px", left: "6px", background: "rgba(0,0,0,0.75)", color: "#fff", padding: "2px 8px", borderRadius: "4px", fontSize: "0.7rem", textTransform: "uppercase" }}>
                          {movie.status}
                        </span>
                      </div>
                      <div style={{ padding: "10px" }}>
                        <h4 style={{ margin: "0 0 4px 0", fontSize: "0.9rem", fontWeight: "600", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: "1.3" }}>{movie.name}</h4>
                        <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "4px" }}>
                          {renderMeta(movie)}
                        </div>
                      </div>
                    </div>
                  </Link>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default Trending;
