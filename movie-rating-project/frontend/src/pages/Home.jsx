import React, { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import CustomSelect from "../components/CustomSelect.jsx";

const seasons = ["Spring", "Summer", "Fall", "Winter"];

const Home = ({ status, currentUser }) => {
  const [genres, setGenres] = useState([]);
  const [movieName, setMovieName] = useState("");
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState("");
  const [seasonYear, setSeasonYear] = useState("");

  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [moviesLoading, setMoviesLoading] = useState(false);

  const [genreDropdownOpen, setGenreDropdownOpen] = useState(false);
  const genreRef = useRef(null);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/genres`
        );
        setGenres(response.data.genres || []);
      } catch {
        // silently fail
      }
    };

    fetchGenres();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (genreRef.current && !genreRef.current.contains(e.target)) {
        setGenreDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [movieName, selectedGenres, selectedSeason, seasonYear]);

  useEffect(() => {
    const fetchMovies = async () => {
      setMoviesLoading(true);
      try {
        const params = {
          page,
          limit: 8,
          search: movieName,
          ...(selectedGenres.length > 0 ? { genre: selectedGenres.join(",") } : {}),
          season: selectedSeason,
          ...(seasonYear ? { year: seasonYear } : {}),
        };
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/movies`,
          { params }
        );
        setMovies(response.data.movies || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } catch (error) {
        console.error("Failed to fetch movies:", error);
      } finally {
        setMoviesLoading(false);
      }
    };
    fetchMovies();
  }, [movieName, selectedGenres, selectedSeason, seasonYear, page]);

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    const years = [];
    for (let y = current + 2; y >= 1990; y--) {
      years.push(y);
    }
    return years;
  }, []);

  const toggleGenre = (id) => {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const resetGenres = () => {
    setSelectedGenres([]);
  };

  const resetFilters = () => {
    setMovieName("");
    setSelectedGenres([]);
    setSelectedSeason("");
    setSeasonYear("");
    setPage(1);
  };

  const genreLabel = useMemo(() => {
    if (selectedGenres.length === 0) return "All";
    if (selectedGenres.length === 1) {
      const g = genres.find((g) => g._id === selectedGenres[0]);
      return g ? g.name : "All";
    }
    return `${selectedGenres.length} genres`;
  }, [selectedGenres, genres]);

  return (
    <section>
      <div className="hero">
        <h2>Chào mừng đến với AniMê</h2>
        <p>Cuối cùng cũng có một bộ anime mà nhân vật chính là hình mẫu lý tưởng của tôi. Một kẻ lạnh lùng và ít nói. Bạn bè không hiểu tại sao tôi lại trở nên trầm mặc và luôn đạt điểm 5 trong các bài kiểm tra. Họ không biết năng lực thực sự của tôi và tôi thực sự xuất chúng như thế nào. Tôi coi họ không khác gì những công cụ. Tôi ước mình có thể bước vào thế giới anime và bộc lộ con người thật của mình. Tôi vững tin mình là hiện thân đời thực của Ayanokoji Kiyotaka.</p>
      </div>

      <div className="admin-card" style={{ marginTop: "2rem" }}>
        <h3 style={{ marginTop: 0 }}>Search Movies</h3>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flex: 1 }}>
            <span style={{ fontWeight: 600, color: "var(--muted)", whiteSpace: "nowrap" }}>Title:</span>
            <input
              type="search"
              placeholder="Enter movie name..."
              value={movieName}
              onChange={(e) => setMovieName(e.target.value)}
              style={{
                padding: "0.6rem 0.9rem",
                borderRadius: "999px",
                border: "1px solid #d8c6b3",
                background: "#fffaf3",
                minWidth: "180px",
                fontSize: "1rem",
                flex: 1,
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }} ref={genreRef}>
            <span style={{ fontWeight: 600, color: "var(--muted)", whiteSpace: "nowrap" }}>Movie Genres:</span>
            <div style={{ position: "relative" }}>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setGenreDropdownOpen(!genreDropdownOpen)}
                style={{ minWidth: "120px", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}
              >
                <span>{genreLabel}</span>
                <span style={{ fontSize: "0.7rem" }}>{genreDropdownOpen ? "▲" : "▼"}</span>
              </button>
              {genreDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    minWidth: "220px",
                    maxHeight: "260px",
                    overflowY: "auto",
                    background: "#fffaf3",
                    border: "1px solid #d8c6b3",
                    borderRadius: "12px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    zIndex: 20,
                    padding: "0.5rem",
                    marginTop: "4px",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.4rem 0.5rem",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: selectedGenres.length === 0 ? 700 : 400,
                      background: selectedGenres.length === 0 ? "#f0e6dc" : "transparent",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedGenres.length === 0}
                      onChange={resetGenres}
                      style={{ accentColor: "var(--primary)" }}
                    />
                    All
                  </label>
                  {genres.map((g) => (
                    <label
                      key={g._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.4rem 0.5rem",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: selectedGenres.includes(g._id) ? 600 : 400,
                        background: selectedGenres.includes(g._id) ? "#f0e6dc" : "transparent",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedGenres.includes(g._id)}
                        onChange={() => toggleGenre(g._id)}
                        style={{ accentColor: "var(--primary)" }}
                      />
                      {g.name}
                    </label>
                  ))}
                  {selectedGenres.length > 0 && (
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={resetGenres}
                      style={{ width: "100%", marginTop: "0.25rem", fontSize: "0.85rem" }}
                    >
                      Reset
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span style={{ fontWeight: 600, color: "var(--muted)" }}>Season:</span>
            {seasons.map((s) => (
              <button
                key={s}
                type="button"
                className="ghost-button"
                style={{
                  background:
                    selectedSeason === s ? "var(--primary)" : "transparent",
                  color: selectedSeason === s ? "#fff" : "var(--ink)",
                  border:
                    selectedSeason === s
                      ? "1px solid var(--primary)"
                      : "1px solid #c9b39d",
                }}
                onClick={() =>
                  setSelectedSeason(selectedSeason === s ? "" : s)
                }
              >
                {s}
              </button>
            ))}
            <CustomSelect
              value={seasonYear}
              onChange={setSeasonYear}
              options={[{ value: "", label: "All Years" }, ...yearOptions.map(y => ({ value: y, label: y.toString() }))]}
              placeholder="All Years"
            />
          </div>
        </div>

        {(movieName || selectedSeason || selectedGenres.length > 0) && (
          <p className="admin-subtitle" style={{ marginTop: "1rem", marginBottom: 0 }}>
            {movieName && `Title: "${movieName}"`}
            {movieName && (selectedSeason || selectedGenres.length > 0) && " | "}
            {selectedGenres.length > 0 && `Genres: ${selectedGenres.length}`}
            {selectedGenres.length > 0 && selectedSeason && " | "}
            {selectedSeason && `Season: ${selectedSeason}${seasonYear ? ` ${seasonYear}` : ""}`}
          </p>
        )}

        <hr
          style={{
            margin: "1.25rem 0",
            border: "none",
            borderTop: "1px solid #ead6c3",
          }}
        />

        {/* Filter Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="button" className="ghost-button" onClick={resetFilters}>
            Reset Filters
          </button>
        </div>
      </div>

      {/* Movies Grid */}
      <div style={{ marginTop: "2.5rem" }}>
        <h3 style={{ borderBottom: "2px solid var(--primary)", paddingBottom: "0.5rem", color: "var(--primary)" }}>Anime List</h3>
        {moviesLoading ? (
          <p className="admin-muted">Loading movies...</p>
        ) : movies.length === 0 ? (
          <p className="admin-muted" style={{ fontStyle: "italic", marginTop: "1.5rem" }}>No movies found matching the criteria.</p>
        ) : (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.5rem", marginTop: "1.5rem" }}>
              {movies.map((movie) => (
                <Link
                  to={`/movies/${movie._id}`}
                  key={movie._id}
                  className="admin-card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "0.75rem",
                    borderRadius: "12px",
                    border: "1px solid #ead6c3",
                    background: "#fff",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
                    textDecoration: "none",
                    color: "inherit",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ position: "relative", width: "100%", aspectRatio: "2/3", borderRadius: "8px", overflow: "hidden", backgroundColor: "#eae0d5" }}>
                    {movie.poster ? (
                      <img
                        src={movie.poster.startsWith('http') ? movie.poster : `${import.meta.env.VITE_API_URL.replace('/api', '')}${movie.poster}`}
                        alt={movie.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#9c8c7d", fontSize: "0.9rem" }}>No Image</div>
                    )}
                    <span
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        background: "rgba(0,0,0,0.6)",
                        color: "#fff",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        textTransform: "capitalize",
                        fontWeight: "500"
                      }}
                    >
                      {movie.status}
                    </span>
                  </div>
                  <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                    <h4
                      style={{
                        margin: "0 0 0.5rem",
                        fontSize: "1rem",
                        fontWeight: "600",
                        color: "var(--ink)",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        height: "2.6rem",
                        lineHeight: "1.3rem"
                      }}
                    >
                      {movie.name}
                    </h4>
                    <div style={{ marginTop: "auto" }}>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)" }}>
                        Released: {new Date(movie.releaseDate).toLocaleDateString()}
                      </p>
                      <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "var(--muted)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        Genres: {movie.genres?.map(g => g.name).join(", ") || "None"}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            <div className="admin-pagination" style={{ marginTop: "2rem" }}>
              <button
                className="ghost-button"
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page <= 1}
              >
                Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                className="ghost-button"
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Home;
