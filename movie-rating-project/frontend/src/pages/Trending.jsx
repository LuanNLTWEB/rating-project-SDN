import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import CustomSelect from "../components/CustomSelect.jsx";

const seasons = ["Spring", "Summer", "Fall", "Winter"];
const currentYear = new Date().getFullYear();

const rankColors = [
  { bg: "#FFD700", color: "#1d1a17", label: "#1" },
  { bg: "#C0C0C0", color: "#1d1a17", label: "#2" },
  { bg: "#CD7F32", color: "#fff", label: "#3" },
];

const sortOptions = [
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Top Rated" },
  { value: "comments", label: "Most Comments" },
];

const Trending = ({ currentUser }) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState("");
  const [seasonYear, setSeasonYear] = useState("");
  const [sortBy, setSortBy] = useState("trending");

  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = currentYear + 1; y >= 1990; y--) {
      years.push({ value: y.toString(), label: y.toString() });
    }
    return years;
  }, []);

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      try {
        const params = { limit: 20, sort: sortBy };
        if (selectedSeason) params.season = selectedSeason;
        if (seasonYear) params.year = seasonYear;
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/movies/trending`, { params });
        setMovies(res.data.movies || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, [selectedSeason, seasonYear, sortBy]);

  const handleSeasonClick = (season) => {
    if (selectedSeason === season) {
      setSelectedSeason("");
    } else {
      setSelectedSeason(season);
      if (!seasonYear) setSeasonYear(currentYear.toString());
    }
  };

  const handleAllClick = () => {
    setSelectedSeason("");
    setSeasonYear("");
  };

  if (loading) {
    return (
      <div className="admin-shell" style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
        <p className="admin-muted">Loading trending...</p>
      </div>
    );
  }

  const top3 = movies.slice(0, 3);
  const rest = movies.slice(3);

  return (
    <div className="admin-shell">
      {/* Filters */}
      <div className="admin-card" style={{ padding: "1.25rem 1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              type="button"
              className="ghost-button"
              style={{
                background: !selectedSeason && !seasonYear ? "var(--primary)" : "transparent",
                color: !selectedSeason && !seasonYear ? "#fff" : "var(--ink)",
                border: !selectedSeason && !seasonYear ? "1px solid var(--primary)" : "1px solid #c9b39d",
              }}
              onClick={handleAllClick}
            >
              All
            </button>
            {seasons.map(s => (
              <button
                key={s}
                type="button"
                className="ghost-button"
                style={{
                  background: selectedSeason === s ? "var(--primary)" : "transparent",
                  color: selectedSeason === s ? "#fff" : "var(--ink)",
                  border: selectedSeason === s ? "1px solid var(--primary)" : "1px solid #c9b39d",
                }}
                onClick={() => handleSeasonClick(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <CustomSelect
            value={seasonYear}
            onChange={setSeasonYear}
            options={[{ value: "", label: "All Years" }, ...yearOptions]}
            placeholder="Year"
            buttonStyle={{ padding: "0.5rem 1rem", fontSize: "0.85rem", minWidth: "100px" }}
          />
          <CustomSelect
            value={sortBy}
            onChange={setSortBy}
            options={sortOptions}
            placeholder="Sort"
            buttonStyle={{ padding: "0.5rem 1rem", fontSize: "0.85rem", minWidth: "130px" }}
          />
        </div>
      </div>

      {movies.length === 0 ? (
        <div className="admin-card" style={{ padding: "3rem", textAlign: "center", borderRadius: "16px" }}>
          <p className="admin-muted" style={{ fontSize: "1.1rem" }}>No movies found.</p>
        </div>
      ) : (
        <>
          {/* Season header */}
          {selectedSeason && seasonYear && (
            <h3 style={{ margin: "0 0 1.25rem 0", color: "var(--primary)" }}>
              {selectedSeason} {seasonYear}
            </h3>
          )}

          {/* Top 3 */}
          {top3.length > 0 && !selectedSeason && !seasonYear && (
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
                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                              {movie.averageRating > 0 && (
                                <span style={{ fontWeight: "600", color: "#f59e0b" }}>★ {movie.averageRating.toFixed(1)}</span>
                              )}
                              {movie.viewCount > 0 && (
                                <span style={{ fontWeight: "600" }}>{movie.viewCount.toLocaleString()} views</span>
                              )}
                            </div>
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
                {!selectedSeason && !seasonYear ? "Most Viewed" : "Results"}
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1.25rem" }}>
                {rest.map((movie, index) => (
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
                        {!selectedSeason && !seasonYear && (
                          <span style={{ position: "absolute", top: "6px", left: "6px", background: "rgba(0,0,0,0.6)", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "0.75rem" }}>
                            {index + 4}
                          </span>
                        )}
                        <span style={{ position: "absolute", bottom: "6px", left: "6px", background: "rgba(0,0,0,0.75)", color: "#fff", padding: "2px 8px", borderRadius: "4px", fontSize: "0.7rem", textTransform: "uppercase" }}>
                          {movie.status}
                        </span>
                      </div>
                      <div style={{ padding: "10px" }}>
                        <h4 style={{ margin: "0 0 4px 0", fontSize: "0.9rem", fontWeight: "600", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: "1.3" }}>{movie.name}</h4>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "0.75rem", color: "var(--muted)" }}>
                          {movie.averageRating > 0 && (
                            <span style={{ fontWeight: "600", color: "#f59e0b" }}>★ {movie.averageRating.toFixed(1)}</span>
                          )}
                          {movie.viewCount > 0 && (
                            <span>{movie.viewCount.toLocaleString()} views</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Trending;
