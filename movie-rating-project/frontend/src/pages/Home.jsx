import React, { useEffect, useState } from "react";
import axios from "axios";

const Home = ({ status, currentUser }) => {
  const [genres, setGenres] = useState([]);

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

  return (
    <section>
      <div className="hero">
        <h2>Chào mừng đến với AniMê</h2>
        <p>{status}</p>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3>Thể loại phim</h3>
        {genres.length === 0 ? (
          <p className="admin-muted">Đang tải thể loại...</p>
        ) : (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              marginTop: "1rem",
            }}
          >
            {genres.map((genre) => (
              <span
                key={genre._id}
                className="role-badge status-active"
                style={{ fontSize: "0.95rem", padding: "0.4rem 1rem" }}
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
