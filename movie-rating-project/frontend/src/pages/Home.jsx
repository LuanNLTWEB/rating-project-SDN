import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import CustomSelect from "../components/CustomSelect.jsx";

const seasons = ["Spring", "Summer", "Fall", "Winter"];

const Home = ({ status, currentUser }) => {
  const [genres, setGenres] = useState([]);
  const [movieName, setMovieName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSeason, setSelectedSeason] = useState("");
  const [seasonYear, setSeasonYear] = useState("");

  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [moviesLoading, setMoviesLoading] = useState(false);

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
    setPage(1);
  }, [movieName, selectedCategory, selectedSeason, seasonYear]);

  useEffect(() => {
    const fetchMovies = async () => {
      setMoviesLoading(true);
      try {
        const params = {
          page,
          limit: 8,
          search: movieName,
          genre: selectedCategory,
          season: selectedSeason,
          year: seasonYear,
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
  }, [movieName, selectedCategory, selectedSeason, seasonYear, page]);

  const filteredGenres = useMemo(() => {
    if (!selectedCategory) return genres;
    return genres.filter((g) => g._id === selectedCategory);
  }, [genres, selectedCategory]);

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    const years = [];
    for (let y = current + 2; y >= 1990; y--) {
      years.push(y);
    }
    return years;
  }, []);

  return (
    <section>
      <div className="hero">
        <h2>Welcome to AniMê</h2>
        <p>Cuối cùng mới có một bộ anime mà nhân vật chính đúng chuẩn hình mẫu lý tưởng của tao. Một kẻ lạnh lùng và ít nói. Đám bạn không hiểu tại sao tao trở nên im lặng và luôn được 5 điểm bài kiểm tra. Chúng nó không biết năng lực thực sự của tao và không hề biết tao xuất chúng tới mức nào. Tao chẳng coi chúng là gì ngoài công cụ. Tao ước mình có thể vào trong thế giới anime và bộc lộ con người thực sự của mình. Tao tin chắc rằng tao chính là hoá thân ngoài đời thực của Ayanokoji Kyotaka.</p>
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

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span style={{ fontWeight: 600, color: "var(--muted)", whiteSpace: "nowrap" }}>Genre:</span>
            <CustomSelect
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={[{ value: "", label: "All" }, ...genres.map(g => ({ value: g._id, label: g.name }))]}
              placeholder="All"
            />
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

        {(movieName || selectedSeason) && (
          <p className="admin-subtitle" style={{ marginTop: "1rem", marginBottom: 0 }}>
            {movieName && `Title: "${movieName}"`}
            {movieName && selectedSeason && " | "}
            {selectedSeason && `Season: ${selectedSeason} ${seasonYear}`}
          </p>
        )}

        <hr
          style={{
            margin: "1.25rem 0",
            border: "none",
            borderTop: "1px solid #ead6c3",
          }}
        />

        <h4 style={{ margin: "0 0 0.75rem" }}>Movie Genres</h4>

        {filteredGenres.length === 0 ? (
          <p className="admin-muted">Loading genres...</p>
        ) : (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}
          >
            {filteredGenres.map((genre) => (
              <span
                key={genre._id}
                className="role-badge status-active"
                style={{
                  fontSize: "0.95rem",
                  padding: "0.4rem 1rem",
                  cursor: "pointer",
                }}
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === genre._id ? "" : genre._id
                  )
                }
              >
                {genre.name}
              </span>
            ))}
          </div>
        )}
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
