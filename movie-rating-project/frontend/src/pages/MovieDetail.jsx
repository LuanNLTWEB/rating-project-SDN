import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

const MovieDetail = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const baseURL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchMovieDetail = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${baseURL}/movies/${id}`);
        setMovie(response.data.movie);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load movie details.");
      } finally {
        setLoading(false);
      }
    };
    fetchMovieDetail();
  }, [id, baseURL]);

  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  if (loading) {
    return (
      <div className="admin-shell" style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
        <p className="admin-muted">Loading movie details...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="admin-shell" style={{ padding: "3rem", textAlign: "center" }}>
        <p className="status-error">{error || "Movie not found"}</p>
        <Link to="/" className="primary-button" style={{ marginTop: "1rem", display: "inline-block" }}>Back to Home</Link>
      </div>
    );
  }

  const ytId = getYouTubeId(movie.trailer);

  return (
    <div className="admin-shell" style={{ padding: "20px 0" }}>
      {/* Banner Backdrop */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "350px",
          borderRadius: "16px",
          overflow: "hidden",
          backgroundColor: "#222",
          backgroundImage: movie.banner ? `url(${baseURL.replace('/api', '')}${movie.banner})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)"
        }}
      >
        {/* Dark overlay for text readability */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.9) 20%, rgba(0,0,0,0.3) 100%)" }} />

        <div style={{ position: "absolute", bottom: "24px", left: "24px", right: "24px", display: "flex", alignItems: "flex-end", gap: "24px", flexWrap: "wrap" }}>
          {/* Poster over banner */}
          <div style={{ width: "160px", aspectRatio: "2/3", borderRadius: "12px", overflow: "hidden", border: "4px solid #fff", boxShadow: "0 10px 20px rgba(0,0,0,0.3)", backgroundColor: "#eee", flexShrink: 0 }}>
            {movie.poster ? (
              <img src={`${baseURL.replace('/api', '')}${movie.poster}`} alt={movie.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#888" }}>No Poster</div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: "250px", color: "#fff" }}>
            <span style={{ background: "var(--primary)", padding: "4px 10px", borderRadius: "4px", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: "bold" }}>
              {movie.status}
            </span>
            <h2 style={{ fontSize: "2.2rem", margin: "10px 0 5px 0", textShadow: "0 2px 4px rgba(0,0,0,0.6)", fontWeight: "700" }}>{movie.name}</h2>
            <p style={{ margin: 0, opacity: 0.9, fontSize: "0.95rem" }}>
              Released: {new Date(movie.releaseDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem", marginTop: "2rem" }}>

        {/* Left Side: Summary & Trailer */}
        <div>
          <div className="admin-card" style={{ padding: "24px" }}>
            <h3 style={{ marginTop: 0, borderBottom: "2px solid #ead6c3", paddingBottom: "8px", color: "var(--primary)" }}>Summary</h3>
            <p style={{ lineHeight: "1.7", fontSize: "1.05rem", color: "var(--ink)", whiteSpace: "pre-line" }}>{movie.summary}</p>
          </div>

          {ytId ? (
            <div className="admin-card" style={{ padding: "24px", marginTop: "2rem" }}>
              <h3 style={{ marginTop: 0, borderBottom: "2px solid #ead6c3", paddingBottom: "8px", color: "var(--primary)" }}>Trailer</h3>
              <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: "12px", border: "1px solid #ead6c3", marginTop: "1rem" }}>
                <iframe
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
                  src={`https://www.youtube.com/embed/${ytId}`}
                  title={`${movie.name} Trailer`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          ) : movie.trailer ? (
            <div className="admin-card" style={{ padding: "24px", marginTop: "2rem" }}>
              <h3 style={{ marginTop: 0, borderBottom: "2px solid #ead6c3", paddingBottom: "8px", color: "var(--primary)" }}>Trailer</h3>
              <p style={{ marginTop: "1rem" }}>
                Watch trailer here: <a href={movie.trailer} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", textDecoration: "underline" }}>{movie.trailer}</a>
              </p>
            </div>
          ) : null}
        </div>

        {/* Right Side: Metadata / Info */}
        <div>
          <div className="admin-card" style={{ padding: "24px" }}>
            <h3 style={{ marginTop: 0, borderBottom: "2px solid #ead6c3", paddingBottom: "8px", color: "var(--primary)" }}>Information</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "1rem" }}>
              <div>
                <span style={{ fontWeight: "600", color: "var(--muted)", display: "block", fontSize: "0.85rem", textTransform: "uppercase" }}>Status</span>
                <span style={{ fontSize: "1rem", textTransform: "capitalize", fontWeight: "500" }}>{movie.status}</span>
              </div>

              <div>
                <span style={{ fontWeight: "600", color: "var(--muted)", display: "block", fontSize: "0.85rem", textTransform: "uppercase" }}>Total Episodes</span>
                <span style={{ fontSize: "1rem", fontWeight: "500" }}>{movie.totalEpisodes || "N/A"}</span>
              </div>

              <div>
                <span style={{ fontWeight: "600", color: "var(--muted)", display: "block", fontSize: "0.85rem", textTransform: "uppercase" }}>Release Date</span>
                <span style={{ fontSize: "1rem", fontWeight: "500" }}>{new Date(movie.releaseDate).toLocaleDateString()}</span>
              </div>

              <div>
                <span style={{ fontWeight: "600", color: "var(--muted)", display: "block", fontSize: "0.85rem", textTransform: "uppercase" }}>Genres</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                  {movie.genres && movie.genres.length > 0 ? (
                    movie.genres.map(g => (
                      <span key={g._id} className="role-badge status-active" style={{ fontSize: "0.8rem", padding: "3px 8px" }}>
                        {g.name}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: "var(--muted)", fontSize: "0.9rem", fontStyle: "italic" }}>None</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MovieDetail;
