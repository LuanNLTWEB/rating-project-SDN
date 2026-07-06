import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import ReviewList from "../components/Review/ReviewList";
import { Search } from "lucide-react";

const filterOptions = [
  { id: "recommended", label: "Recommended", color: "#0369a1", bg: "#e0f2fe", border: "#bae6fd" },
  { id: "mixed", label: "Mixed Feelings", color: "#4b5563", bg: "#f3f4f6", border: "#e5e7eb" },
  { id: "not_recommended", label: "Not Recommended", color: "#b91c1c", bg: "#fee2e2", border: "#fecaca" },
  { id: "spoiler", label: "Spoiler", color: "#b91c1c", bg: "#fee2e2", border: "transparent" },
  { id: "preliminary", label: "Preliminary", color: "#d97706", bg: "#fef3c7", border: "transparent" }
];

const Reviews = ({ currentUser }) => {
  const [reviews, setReviews] = useState([]);
  const [allMovies, setAllMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovieId, setSelectedMovieId] = useState("");
  const [activeFilters, setActiveFilters] = useState([]);
  const [moviePage, setMoviePage] = useState(1);
  const [movieSearch, setMovieSearch] = useState("");

  const filteredAllMovies = movieSearch 
    ? allMovies.filter(m => m.name.toLowerCase().includes(movieSearch.toLowerCase())) 
    : allMovies;

  const moviesPerPage = 16;
  const totalMoviePages = Math.ceil(filteredAllMovies.length / moviesPerPage) || 1;
  const displayedMovies = filteredAllMovies.slice((moviePage - 1) * moviesPerPage, moviePage * moviesPerPage);

  useEffect(() => {
    if (selectedMovieId) {
      setTimeout(() => {
        const el = document.getElementById("reviews-container");
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  }, [selectedMovieId]);

  useEffect(() => {
    setMoviePage(1); // Reset page on search
  }, [movieSearch]);

  const baseURL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reviewsRes, moviesRes] = await Promise.all([
          api.get("/reviews?limit=1000"),
          api.get("/movies?limit=1000")
        ]);
        setReviews(reviewsRes.data.reviews || []);
        setAllMovies(moviesRes.data.movies || []);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleReviewDeleted = (deletedId) => {
    setReviews(reviews.filter(r => r._id !== deletedId));
  };

  const toggleFilter = (filterId) => {
    setActiveFilters(prev => 
      prev.includes(filterId) ? prev.filter(f => f !== filterId) : [...prev, filterId]
    );
  };

  let filteredReviews = selectedMovieId ? reviews.filter(r => r.movie?._id === selectedMovieId) : [];

  if (activeFilters.length > 0) {
    const recFilters = activeFilters.filter(f => ["recommended", "not_recommended", "mixed"].includes(f));
    const otherFilters = activeFilters.filter(f => !["recommended", "not_recommended", "mixed"].includes(f));
    
    filteredReviews = filteredReviews.filter(r => {
      let matchRec = true;
      if (recFilters.length > 0) {
        matchRec = recFilters.includes(r.recommendation);
      }
      let matchOther = true;
      if (otherFilters.includes("spoiler") && !r.containsSpoiler) matchOther = false;
      if (otherFilters.includes("preliminary") && !r.isPreliminary) matchOther = false;
      return matchRec && matchOther;
    });
  }

  const hasReviewed = currentUser && reviews.some(r => r.movie?._id === selectedMovieId && (r.user?._id || r.user) === (currentUser._id || currentUser.id));

  return (
    <div className="container" style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "20px", color: "var(--primary)" }}>Community Reviews</h2>
      
      {loading ? (
        <p>Loading reviews...</p>
      ) : (
        <>
          <div className="admin-card" style={{ padding: "24px", marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #ead6c3", paddingBottom: "12px", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, color: "var(--ink)" }}>
                Select an Anime
              </h3>
              <div style={{ position: "relative", width: "300px" }}>
                <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                <input
                  type="text"
                  placeholder="Search anime..."
                  value={movieSearch}
                  onChange={(e) => setMovieSearch(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px 8px 34px", borderRadius: "8px", border: "1px solid #ced4da", fontSize: "0.9rem" }}
                />
              </div>
            </div>
            {filteredAllMovies.length === 0 ? (
              <p className="admin-muted">{movieSearch ? "No anime matches your search." : "No movies available yet."}</p>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "16px" }}>
                  {displayedMovies.map(movie => {
                    const isSelected = selectedMovieId === movie._id;
                    const posterUrl = movie.poster 
                      ? (movie.poster.startsWith('http') ? movie.poster : `${baseURL.replace('/api', '')}${movie.poster}`)
                      : null;

                    return (
                      <div 
                        key={movie._id} 
                        onClick={() => setSelectedMovieId(isSelected ? "" : movie._id)}
                        style={{ 
                          cursor: "pointer", 
                          border: isSelected ? "3px solid var(--primary)" : "3px solid transparent", 
                          borderRadius: "12px", 
                          padding: "4px", 
                          transition: "all 0.2s",
                          background: isSelected ? "#fdf0ee" : "transparent"
                        }}
                      >
                        <div style={{ position: "relative", width: "100%", aspectRatio: "2/3", borderRadius: "8px", overflow: "hidden", backgroundColor: "#eee", border: "1px solid #ead6c3" }}>
                          <div
                            style={{
                              position: "absolute",
                              top: "6px",
                              left: "6px",
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
                          {posterUrl ? (
                            <img src={posterUrl} alt={movie.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#888", fontSize: "0.8rem" }}>No Poster</div>
                          )}
                        </div>
                        <p style={{ textAlign: "center", margin: "8px 0 0", fontSize: "0.9rem", fontWeight: "600", color: "var(--ink)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {movie.name}
                        </p>
                      </div>
                    );
                  })}
                </div>
                
                {totalMoviePages > 1 && (
                  <div className="admin-pagination" style={{ marginTop: "2rem" }}>
                    <button
                      className="ghost-button"
                      onClick={() => setMoviePage(p => Math.max(p - 1, 1))}
                      disabled={moviePage <= 1}
                    >
                      Previous
                    </button>
                    <span>Page {moviePage} of {totalMoviePages}</span>
                    <button
                      className="ghost-button"
                      onClick={() => setMoviePage(p => Math.min(p + 1, totalMoviePages))}
                      disabled={moviePage >= totalMoviePages}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {selectedMovieId && (
            <div id="reviews-container" className="admin-card" style={{ padding: "24px", marginBottom: "2rem", display: "flex", flexDirection: "column", gap: "16px" }}>
              {currentUser && !hasReviewed && !["staff", "admin"].includes(currentUser.role) && (
                <div style={{ textAlign: "left", margin: "0 0 8px 0" }}>
                  <a href={`/movies/${selectedMovieId}#review-section`} style={{ fontSize: "0.9rem", color: "var(--primary)", textDecoration: "none", fontWeight: "500", transition: "opacity 0.2s" }} onMouseOver={e => e.currentTarget.style.opacity = 0.7} onMouseOut={e => e.currentTarget.style.opacity = 1}>
                    You haven't reviewed this anime yet. Click here to write a review.
                  </a>
                </div>
              )}
              
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px" }}>
                <span style={{ fontWeight: "600", color: "var(--ink)", marginRight: "8px" }}>Filters:</span>
                {filterOptions.map(opt => {
                  const isActive = activeFilters.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleFilter(opt.id)}
                      style={{
                        background: isActive ? opt.bg : "#fff",
                        color: isActive ? opt.color : "var(--muted)",
                        border: `1px solid ${isActive ? (opt.border !== "transparent" ? opt.border : opt.color) : "#ced4da"}`,
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        opacity: isActive ? 1 : 0.7
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {filteredReviews.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", background: "#f8f9fa", borderRadius: "8px", border: "1px dashed #ced4da" }}>
                  <p style={{ margin: 0, color: "var(--muted)" }}>
                    {activeFilters.length > 0 ? "No reviews match the selected filters." : "No reviews for this anime yet."}
                  </p>
                </div>
              ) : (
                <ReviewList
                  reviews={filteredReviews}
                  currentUser={currentUser}
                  onReviewDeleted={handleReviewDeleted}
                  showMovie={true}
                />
              )}
            </div>
          )}
          
          {!selectedMovieId && allMovies.length > 0 && (
            <div style={{ textAlign: "center", padding: "3rem", background: "#fdf0ee", borderRadius: "12px", border: "1px solid #ead6c3" }}>
              <p style={{ margin: 0, color: "var(--primary)", fontSize: "1.1rem", fontWeight: "600" }}>Please select an anime from the list above to view its reviews.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reviews;
