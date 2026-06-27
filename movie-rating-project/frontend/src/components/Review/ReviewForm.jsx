import React, { useState } from "react";
import { api } from "../../services/api.js";
import toast from "react-hot-toast";
import { Star } from "lucide-react";

const ReviewForm = ({ movieId, onReviewAdded, currentUser, watchlistStatus, episodesWatched, movieStatus, isEdit = false, initialData = null, onReviewUpdated, onCancelEdit }) => {
  const [overallRating, setOverallRating] = useState(initialData?.overallRating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [recommendation, setRecommendation] = useState(initialData?.recommendation || "");
  const [bodyText, setBodyText] = useState(initialData?.bodyText || "");
  const [containsSpoiler, setContainsSpoiler] = useState(initialData?.containsSpoiler || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [errors, setErrors] = useState({
    rating: "",
    recommendation: "",
    text: ""
  });

  const getCharCount = (text) => {
    const cleanText = text.replace(/<[^>]*>?/gm, "");
    return cleanText.trim().length;
  };

  const charCount = getCharCount(bodyText);
  const isEligible = watchlistStatus && ["watching", "completed"].includes(watchlistStatus) && movieStatus !== "upcoming";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return toast.error("Please login to review.");
    if (!isEdit && !isEligible) return toast.error("You are not eligible to write a review.");

    const newErrors = { rating: "", recommendation: "", text: "" };
    let hasError = false;

    if (overallRating === 0) {
      newErrors.rating = "Please select a star rating.";
      hasError = true;
    }
    if (!recommendation) {
      newErrors.recommendation = "Please select a recommendation tag.";
      hasError = true;
    }
    if (charCount === 0) {
      newErrors.text = "Please write a review.";
      hasError = true;
    } else if (charCount > 10000) {
      newErrors.text = `Review too long (max 10000 chars). Current: ${charCount}`;
      hasError = true;
    }

    setErrors(newErrors);
    if (hasError) return;

    setIsSubmitting(true);
    try {
      if (isEdit) {
        const res = await api.put(`/reviews/${initialData._id}`, {
          overallRating,
          bodyText,
          containsSpoiler,
          recommendation,
        });
        toast.success("Review updated successfully!");
        if (onReviewUpdated) onReviewUpdated(res.data.review);
      } else {
        const res = await api.post(`/movies/${movieId}/reviews`, {
          overallRating,
          bodyText,
          containsSpoiler,
          recommendation,
        });
        toast.success("Review posted successfully!");
        setOverallRating(0);
        setRecommendation("");
        setBodyText("");
        setContainsSpoiler(false);
        if (onReviewAdded) onReviewAdded(res.data.review);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="admin-card" style={{ padding: "20px", textAlign: "center", background: "#f8f9fa" }}>
        <p className="admin-muted">Please login to write a review.</p>
      </div>
    );
  }

  if (currentUser && currentUser.mutedUntil && new Date(currentUser.mutedUntil) > new Date()) {
    return (
      <div className="admin-card" style={{ padding: "24px", textAlign: "center", background: "#fef8f6", border: "1px solid var(--danger)", marginTop: "2rem" }}>
        <h3 style={{ margin: "0 0 8px 0", color: "var(--danger)" }}>Account Restricted</h3>
        <p className="admin-muted" style={{ margin: "0 0 8px 0" }}>
          You have been muted by a staff member. You cannot post or edit reviews until <strong>{new Date(currentUser.mutedUntil).toLocaleString()}</strong>.
        </p>
        <p style={{ margin: 0, fontWeight: "600", color: "var(--danger)" }}>
          Reason: {currentUser.muteReason || "Violation of rules"}
        </p>
      </div>
    );
  }

  return (
    <div className="admin-card" style={{ padding: "24px", marginTop: "2rem" }}>
      <h3 style={{ marginTop: 0, color: "var(--primary)", borderBottom: "2px solid #ead6c3", paddingBottom: "8px" }}>
        {isEdit ? "Edit Your Review" : "Write a Review"}
      </h3>
      
      {!isEdit && !isEligible && (
        <div style={{ background: "#fff3cd", color: "#856404", padding: "12px", borderRadius: "8px", marginBottom: "16px", fontSize: "0.9rem" }}>
          <strong>Note:</strong> You must add the movie to your Watchlist (status: Watching or Completed) to review. Upcoming movies cannot be reviewed.
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "8px", fontSize: "0.95rem" }}>Overall Rating</label>
          <div style={{ display: "flex", gap: "4px" }} onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => setOverallRating(num)}
                onMouseEnter={() => setHoverRating(num)}
                style={{
                  background: "none",
                  border: "none",
                  padding: "4px",
                  cursor: "pointer",
                  transition: "transform 0.1s"
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.9)"}
                onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                <Star
                  size={32}
                  fill={(hoverRating || overallRating) >= num ? "#f59e0b" : "none"}
                  color={(hoverRating || overallRating) >= num ? "#f59e0b" : "#ccc"}
                  style={{ transition: "all 0.2s" }}
                />
              </button>
            ))}
          </div>
          {errors.rating && <div style={{ color: "var(--danger)", fontSize: "0.85rem", marginTop: "4px" }}>{errors.rating}</div>}
        </div>

        <div>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "8px", fontSize: "0.95rem" }}>Recommendation Tag</label>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {[
              { value: "recommended", label: "Recommended", color: "#0369a1", bg: "#e0f2fe" },
              { value: "mixed", label: "Mixed Feelings", color: "#4b5563", bg: "#f3f4f6" },
              { value: "not_recommended", label: "Not Recommended", color: "#b91c1c", bg: "#fee2e2" }
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRecommendation(opt.value)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  border: `2px solid ${recommendation === opt.value ? opt.color : "transparent"}`,
                  background: opt.bg,
                  color: opt.color,
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {errors.recommendation && <div style={{ color: "var(--danger)", fontSize: "0.85rem", marginTop: "4px" }}>{errors.recommendation}</div>}
        </div>

        <div>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "8px", fontSize: "0.95rem" }}>Review Content</label>
          <textarea
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            placeholder="Enter your review..."
            style={{
              width: "100%",
              minHeight: "200px",
              padding: "12px",
              borderRadius: "8px",
              border: `1px solid ${errors.text ? "var(--danger)" : "#ced4da"}`,
              fontSize: "1rem",
              fontFamily: "inherit",
              resize: "vertical"
            }}
          />
          {errors.text && <div style={{ color: "var(--danger)", fontSize: "0.85rem", marginTop: "4px" }}>{errors.text}</div>}
          <div style={{ textAlign: "right", fontSize: "0.85rem", color: charCount > 10000 ? "var(--danger)" : "var(--success)", marginTop: "4px" }}>
            Characters: {charCount} / 10000 maximum
          </div>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.9rem" }}>
          <input
            type="checkbox"
            checked={containsSpoiler}
            onChange={(e) => setContainsSpoiler(e.target.checked)}
          />
          This review contains spoilers
        </label>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            type="submit"
            disabled={(!isEdit && !isEligible) || isSubmitting}
            className="primary-button"
            style={{ padding: "10px 24px" }}
          >
            {isSubmitting ? "Saving..." : (isEdit ? "Update Review" : "Post Review")}
          </button>
          
          {isEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="ghost-button"
              style={{ padding: "10px 24px", border: "1px solid #ced4da" }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;
