import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const seasons = ["Spring", "Summer", "Fall", "Winter"];

const Home = ({ status, currentUser }) => {
  const [genres, setGenres] = useState([]);
  const [movieName, setMovieName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSeason, setSelectedSeason] = useState("");
  const [seasonYear, setSeasonYear] = useState(new Date().getFullYear());

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

  const filteredGenres = useMemo(() => {
    if (!selectedCategory) return genres;
    return genres.filter((g) => g._id === selectedCategory);
  }, [genres, selectedCategory]);

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    const years = [];
    for (let y = current; y >= current - 10; y--) {
      years.push(y);
    }
    return years;
  }, []);

  return (
    <section>
      <div className="hero">
        <h2>Chào mừng đến với AniMê</h2>
        <p>{status}</p>
      </div>

      <div className="admin-card" style={{ marginTop: "2rem" }}>
        <h3 style={{ marginTop: 0 }}>Tìm kiếm phim</h3>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flex: 1 }}>
            <span style={{ fontWeight: 600, color: "var(--muted)", whiteSpace: "nowrap" }}>Tên phim:</span>
            <input
              type="search"
              placeholder="Nhập tên phim..."
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
            <span style={{ fontWeight: 600, color: "var(--muted)", whiteSpace: "nowrap" }}>Thể loại:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: "0.55rem 0.9rem",
                borderRadius: "999px",
                border: "1px solid #d8c6b3",
                background: "#fffaf3",
                fontSize: "0.95rem",
                minWidth: "130px",
              }}
            >
              <option value="">Tất cả</option>
              {genres.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span style={{ fontWeight: 600, color: "var(--muted)" }}>Mùa:</span>
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
            <select
              value={seasonYear}
              onChange={(e) => setSeasonYear(Number(e.target.value))}
              style={{
                padding: "0.45rem 0.6rem",
                borderRadius: "999px",
                border: "1px solid #d8c6b3",
                background: "#fffaf3",
                fontSize: "0.95rem",
              }}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(movieName || selectedSeason) && (
          <p className="admin-subtitle" style={{ marginTop: "1rem", marginBottom: 0 }}>
            {movieName && `Tên phim: "${movieName}"`}
            {movieName && selectedSeason && " | "}
            {selectedSeason && `Mùa: ${selectedSeason} ${seasonYear}`}
          </p>
        )}

        <hr
          style={{
            margin: "1.25rem 0",
            border: "none",
            borderTop: "1px solid #ead6c3",
          }}
        />

        <h4 style={{ margin: "0 0 0.75rem" }}>Thể loại phim</h4>

        {filteredGenres.length === 0 ? (
          <p className="admin-muted">Đang tải thể loại...</p>
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
    </section>
  );
};

export default Home;
