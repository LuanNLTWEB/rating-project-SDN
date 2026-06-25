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
          backgroundImage: movie.banner ? `url(${movie.banner.startsWith('http') ? movie.banner : baseURL.replace('/api', '') + movie.banner})` : "none",
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
              <img src={movie.poster.startsWith('http') ? movie.poster : `${baseURL.replace('/api', '')}${movie.poster}`} alt={movie.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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

          {(() => {
            const allTrailersList = [];
            if (movie.trailer) allTrailersList.push(movie.trailer);
            if (movie.trailers && movie.trailers.length > 0) {
              movie.trailers.forEach(tr => {
                if (tr && !allTrailersList.includes(tr)) {
                  allTrailersList.push(tr);
                }
              });
            }

            if (allTrailersList.length === 0) return null;

            return (
              <div className="admin-card" style={{ padding: "24px", marginTop: "2rem" }}>
                <h3 style={{ marginTop: 0, borderBottom: "2px solid #ead6c3", paddingBottom: "8px", color: "var(--primary)" }}>
                  {allTrailersList.length > 1 ? "Trailers" : "Trailer"}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "1rem" }}>
                  {allTrailersList.map((trLink, index) => {
                    const yId = getYouTubeId(trLink);
                    return yId ? (
                      <div key={index}>
                        {allTrailersList.length > 1 && <h4 style={{ margin: "0 0 8px 0", color: "var(--ink)", fontSize: "0.95rem" }}>Trailer {index + 1}</h4>}
                        <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: "12px", border: "1px solid #ead6c3" }}>
                          <iframe
                            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
                            src={`https://www.youtube.com/embed/${yId}`}
                            title={`${movie.name} Trailer ${index + 1}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    ) : (
                      <div key={index} style={{ padding: "10px", borderRadius: "8px", background: "#fffaf3", border: "1px solid #ead6c3" }}>
                        Watch trailer here: <a href={trLink} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", textDecoration: "underline" }}>{trLink}</a>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Related Movies */}
          {movie.relatedMovies && movie.relatedMovies.length > 0 && (
            <div className="admin-card" style={{ padding: "24px", marginTop: "2rem" }}>
              <h3 style={{ marginTop: 0, borderBottom: "2px solid #ead6c3", paddingBottom: "8px", color: "var(--primary)" }}>Related Anime / Movies</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
                {movie.relatedMovies.map(rm => (
                  <Link key={rm._id} to={`/movies/${rm._id}`} style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ width: "100%", aspectRatio: "2/3", borderRadius: "8px", overflow: "hidden", backgroundColor: "#eee", border: "1px solid #ead6c3" }}>
                      {rm.poster ? (
                        <img src={rm.poster.startsWith('http') ? rm.poster : `${baseURL.replace('/api', '')}${rm.poster}`} alt={rm.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#888", fontSize: "0.8rem" }}>No Poster</div>
                      )}
                    </div>
                    <span style={{ fontSize: "0.9rem", fontWeight: "600", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: "1.3" }}>{rm.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
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

              {movie.type && (
                <div>
                  <span style={{ fontWeight: "600", color: "var(--muted)", display: "block", fontSize: "0.85rem", textTransform: "uppercase" }}>Type</span>
                  <span style={{ fontSize: "1rem", fontWeight: "500", textTransform: "uppercase" }}>{movie.type}</span>
                </div>
              )}

              {movie.authors && movie.authors.length > 0 && (
                <div>
                  <span style={{ fontWeight: "600", color: "var(--muted)", display: "block", fontSize: "0.85rem", textTransform: "uppercase" }}>Authors</span>
                  <span style={{ fontSize: "1rem", fontWeight: "500" }}>{movie.authors.join(", ")}</span>
                </div>
              )}

              {movie.producers && movie.producers.length > 0 && (
                <div>
                  <span style={{ fontWeight: "600", color: "var(--muted)", display: "block", fontSize: "0.85rem", textTransform: "uppercase" }}>Producers</span>
                  <span style={{ fontSize: "1rem", fontWeight: "500" }}>{movie.producers.join(", ")}</span>
                </div>
              )}

              {movie.studios && movie.studios.length > 0 && (
                <div>
                  <span style={{ fontWeight: "600", color: "var(--muted)", display: "block", fontSize: "0.85rem", textTransform: "uppercase" }}>Studios</span>
                  <span style={{ fontSize: "1rem", fontWeight: "500" }}>{movie.studios.join(", ")}</span>
                </div>
              )}

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

          {/* Related News Articles */}
          {movie.relatedNews && movie.relatedNews.length > 0 && (
            <div className="admin-card" style={{ padding: "24px", marginTop: "2rem" }}>
              <h3 style={{ marginTop: 0, borderBottom: "2px solid #ead6c3", paddingBottom: "8px", color: "var(--primary)" }}>Related News Articles</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
                {movie.relatedNews.map(rn => (
                  <Link key={rn._id} to={`/news/${rn._id || rn}`} style={{ textDecoration: "none", color: "inherit", display: "flex", gap: "16px", padding: "10px", borderRadius: "8px", border: "1px solid #ead6c3", background: "#fffaf3", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = '#f5e4d3'} onMouseLeave={e => e.currentTarget.style.background = '#fffaf3'}>
                    <div style={{ width: "80px", height: "60px", borderRadius: "6px", overflow: "hidden", flexShrink: 0, backgroundColor: "#eee" }}>
                      {rn.imageUrls && rn.imageUrls.length > 0 ? (
                        <img src={rn.imageUrls[0].startsWith('http') ? rn.imageUrls[0] : `${baseURL.replace('/api', '')}${rn.imageUrls[0]}`} alt={rn.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#888", fontSize: "0.7rem" }}>No Image</div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ margin: "0 0 4px 0", fontSize: "0.95rem", fontWeight: "600", color: "var(--ink)", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{rn.title}</h4>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: "1.4" }}>{rn.summary}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default MovieDetail;
