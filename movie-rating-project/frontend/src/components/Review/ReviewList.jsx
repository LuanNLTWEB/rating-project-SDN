import React, { useState } from "react";
import { api } from "../../services/api.js";
import toast from "react-hot-toast";
import { Star, Trash2, ChevronDown, ChevronUp, Edit2, Clock } from "lucide-react";
import ReviewForm from "./ReviewForm";

const ReactionButton = ({ emoji, count, onClick, active, label, showLabel }) => (
  <button
    onClick={onClick}
    style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      padding: "6px 12px", borderRadius: "20px", border: `1px solid ${active ? "var(--primary)" : "#ead6c3"}`,
      background: active ? "#fdf0ee" : "#fff", color: active ? "var(--primary)" : "var(--muted)",
      cursor: "pointer", fontSize: "0.85rem", transition: "all 0.2s"
    }}
    title={label}
  >
    <span style={{ fontSize: "1rem" }}>{emoji}</span>
    {showLabel && <span style={{ fontWeight: "500", color: "var(--ink)" }}>{label}</span>}
    <span style={{ fontWeight: "600" }}>{count}</span>
  </button>
);

const ReviewItem = ({ review: initialReview, currentUser, onReviewDeleted, showMovie }) => {
  const [review, setReview] = useState(initialReview);
  
  const reviewUserId = review.user?._id || review.user;
  const currentUserId = currentUser?._id || currentUser?.id;
  const isAuthor = currentUser && currentUserId === reviewUserId;
  
  const [showSpoiler, setShowSpoiler] = useState(isAuthor || !review.containsSpoiler);
  const [reactions, setReactions] = useState(review.reactions);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const canDelete = currentUser && (currentUserId === reviewUserId || ["admin", "staff"].includes(currentUser.role));
  const canEdit = currentUser && currentUserId === reviewUserId && (!review.editHistory || review.editHistory.length < 3);

  const handleReact = async (type) => {
    if (!currentUser) return toast.error("Please login to react.");
    if ((currentUser._id || currentUser.id) === review.user._id) {
      return toast.error("You cannot react to your own review.");
    }
    try {
      const res = await api.post(`/reviews/${review._id}/react`, { type });
      setReactions(res.data.review.reactions);
    } catch (err) {
      toast.error("Failed to submit reaction.");
    }
  };

  const handleDelete = () => {
    toast((t) => (
      <div>
        <p style={{ margin: "0 0 10px 0", fontWeight: "600" }}>Are you sure you want to delete this review?</p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={() => toast.dismiss(t.id)} className="ghost-button" style={{ padding: "4px 12px", fontSize: "0.85rem", border: "1px solid #ced4da" }}>Cancel</button>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              setIsDeleting(true);
              try {
                await api.delete(`/reviews/${review._id}`);
                toast.success("Review deleted successfully.");
                if (onReviewDeleted) onReviewDeleted(review._id);
              } catch (err) {
                toast.error("Failed to delete review.");
              } finally {
                setIsDeleting(false);
              }
            }} 
            className="primary-button" 
            style={{ background: "var(--danger)", padding: "4px 12px", fontSize: "0.85rem" }}>
            Delete
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const hasReacted = (type) => currentUser && reactions[type]?.includes(currentUser._id || currentUser.id);

  const reactionList = [
    { type: "helpful", emoji: "👍", label: "Helpful", count: reactions.helpful.length },
    { type: "nice", emoji: "❤️", label: "Nice", count: reactions.nice.length },
    { type: "love", emoji: "😍", label: "Love", count: reactions.love.length },
    { type: "funny", emoji: "😂", label: "Funny", count: reactions.funny.length },
    { type: "confusing", emoji: "🤨", label: "Confusing", count: reactions.confusing.length }
  ];

  const totalReactions = reactionList.reduce((sum, r) => sum + r.count, 0);
  const topReactions = [...reactionList].sort((a, b) => b.count - a.count).slice(0, 3);
  
  const maxLength = 150;
  const shouldTruncateText = review.bodyText.length > maxLength;

  return (
    <div style={{ padding: "20px", borderBottom: "1px solid #ead6c3" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", flexShrink: 0 }}>
            {review.user?.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <div style={{ fontWeight: "600", color: "var(--ink)" }}>{review.user?.name || "Unknown User"}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
              {new Date(review.createdAt).toLocaleDateString()}
              {showMovie && review.movie && (
                <> • <a href={`/movies/${review.movie._id}`} style={{ color: "var(--primary)", textDecoration: "none", fontWeight: "600" }}>{review.movie.name}</a></>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "2px", color: "#f59e0b" }} title={`${review.overallRating} out of 5`}>
            {[1, 2, 3, 4, 5].map(num => (
              <Star key={num} size={16} fill={review.overallRating >= num ? "#f59e0b" : "none"} color={review.overallRating >= num ? "#f59e0b" : "#ccc"} />
            ))}
          </div>
          
          {review.isEdited && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowHistory(!showHistory)}
                style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "none", border: "none", color: "var(--muted)", fontSize: "0.85rem", cursor: "pointer", padding: "4px" }}
                title="View edit history"
              >
                <Clock size={14} />
                (Edited)
              </button>
              {showHistory && (
                <div style={{ position: "absolute", top: "100%", right: 0, marginTop: "8px", width: "300px", background: "#fff", border: "1px solid #ced4da", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 10, padding: "12px", maxHeight: "300px", overflowY: "auto", textAlign: "left" }}>
                  <div style={{ fontWeight: "600", marginBottom: "8px", borderBottom: "1px solid #ead6c3", paddingBottom: "4px", color: "var(--ink)" }}>Edit History</div>
                  {review.editHistory?.map((hist, idx) => (
                    <div key={idx} style={{ marginBottom: "12px", borderBottom: "1px dashed #ead6c3", paddingBottom: "8px" }}>
                      <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "4px" }}>{new Date(hist.editedAt).toLocaleString()}</div>
                      <div style={{ fontSize: "0.85rem", whiteSpace: "pre-wrap", color: "var(--ink)" }}>{hist.bodyText}</div>
                    </div>
                  ))}
                  {(!review.editHistory || review.editHistory.length === 0) && (
                    <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>No history recorded.</div>
                  )}
                </div>
              )}
            </div>
          )}

          {canEdit && (
            <button onClick={() => setIsEditing(!isEditing)} style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "none", border: "none", color: "var(--primary)", cursor: "pointer", padding: "4px", fontWeight: "600", fontSize: "0.85rem" }} title="Edit review">
              <Edit2 size={16} />
              Edit
            </button>
          )}
          {canDelete && (
            <button onClick={handleDelete} disabled={isDeleting} style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "none", border: "none", color: "var(--danger)", cursor: "pointer", padding: "4px", fontWeight: "600", fontSize: "0.85rem" }} title="Delete review">
              <Trash2 size={16} />
              Delete
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div style={{ marginBottom: "16px" }}>
          <ReviewForm
            movieId={review.movie._id || review.movie}
            currentUser={currentUser}
            isEligible={true}
            isEdit={true}
            initialData={review}
            onReviewUpdated={(updated) => {
              setReview(updated);
              setIsEditing(false);
            }}
            onCancelEdit={() => setIsEditing(false)}
          />
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap", alignItems: "center" }}>
        {review.isPinned && (
          <span style={{ background: "#fef3c7", color: "#d97706", padding: "4px 10px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "700", border: "1px solid #fde68a", display: "flex", alignItems: "center", gap: "4px", textTransform: "uppercase" }}>
            📌 Staff Pick
          </span>
        )}
        {review.recommendation === "recommended" && (
          <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "4px 10px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "700", border: "1px solid #bae6fd", textTransform: "uppercase" }}>
            Recommended
          </span>
        )}
        {review.recommendation === "mixed" && (
          <span style={{ background: "#f3f4f6", color: "#4b5563", padding: "4px 10px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "700", border: "1px solid #e5e7eb", textTransform: "uppercase" }}>
            Mixed Feelings
          </span>
        )}
        {review.recommendation === "not_recommended" && (
          <span style={{ background: "#fee2e2", color: "#b91c1c", padding: "4px 10px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "700", border: "1px solid #fecaca", textTransform: "uppercase" }}>
            Not Recommended
          </span>
        )}
        {review.isPreliminary && (
          <span style={{ background: "#fef3c7", color: "#d97706", padding: "4px 10px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "600" }}>
            Preliminary
          </span>
        )}
        {topReactions[0] && topReactions[0].count > 0 && (
          <span style={{ background: "#f3e8ff", color: "#7e22ce", padding: "4px 10px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "600", border: "1px solid #e9d5ff", display: "flex", alignItems: "center", gap: "4px", lineHeight: 1 }}>
            {topReactions[0].emoji} {topReactions[0].label}
          </span>
        )}
        {review.containsSpoiler && (
          <span style={{ background: "#fee2e2", color: "#b91c1c", padding: "4px 10px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "600" }}>
            Spoiler
          </span>
        )}
      </div>

      <div style={{ marginBottom: "16px", fontSize: "0.95rem", lineHeight: "1.6", color: "var(--ink)", position: "relative" }}>
        {review.containsSpoiler && !showSpoiler ? (
          <div style={{ background: "#f8f9fa", padding: "20px", textAlign: "center", borderRadius: "8px", border: "1px dashed #ced4da" }}>
            <p style={{ margin: "0 0 10px 0", color: "var(--muted)" }}>This review contains spoilers.</p>
            <button onClick={() => setShowSpoiler(true)} className="ghost-button" style={{ border: "1px solid var(--primary)", color: "var(--primary)" }}>Show Content</button>
          </div>
        ) : (
          <div style={{ whiteSpace: "pre-wrap" }}>
            {!isExpanded && shouldTruncateText ? review.bodyText.slice(0, maxLength) + "..." : review.bodyText}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        {!isExpanded ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "2px", cursor: "pointer" }} onClick={() => setIsExpanded(true)}>
              {topReactions.map(r => (
                <span key={r.type} style={{ fontSize: "1.1rem", filter: r.count === 0 ? "grayscale(100%) opacity(0.6)" : "none" }}>{r.emoji}</span>
              ))}
              <span style={{ fontSize: "0.9rem", color: "var(--muted)", fontWeight: "600", marginLeft: "6px" }}>{totalReactions > 0 ? totalReactions : ""}</span>
            </div>
            
            <button 
              onClick={() => setIsExpanded(true)} 
              style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "none", border: "none", color: "var(--muted)", fontWeight: "600", cursor: "pointer", fontSize: "0.85rem", padding: "0" }}
            >
              <ChevronDown size={16} />
              Read more
            </button>
          </>
        ) : (
          <>
            {reactionList.map(r => (
              <ReactionButton 
                key={r.type}
                emoji={r.emoji} 
                count={r.count} 
                active={hasReacted(r.type)} 
                onClick={() => handleReact(r.type)} 
                label={r.label}
                showLabel={true}
              />
            ))}
            <button 
              onClick={() => setIsExpanded(false)} 
              style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "none", border: "none", color: "var(--muted)", fontWeight: "600", cursor: "pointer", fontSize: "0.85rem", padding: "0", marginLeft: "auto" }}
            >
              <ChevronUp size={16} />
              Show less
            </button>
          </>
        )}
      </div>
      </>
      )}
    </div>
  );
};

const ReviewList = ({ reviews, currentUser, onReviewDeleted, showMovie }) => {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="admin-card" style={{ padding: "3rem", textAlign: "center", marginTop: "2rem" }}>
        <p className="admin-muted">No reviews found.</p>
      </div>
    );
  }

  const myReviews = currentUser ? reviews.filter(r => (currentUser._id || currentUser.id) === r.user?._id) : [];
  const otherReviews = currentUser ? reviews.filter(r => (currentUser._id || currentUser.id) !== r.user?._id) : reviews;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", marginTop: "2rem" }}>
      {myReviews.length > 0 && (
        <div className="admin-card" style={{ padding: "0" }}>
          <div style={{ padding: "20px", borderBottom: "2px solid #ead6c3", background: "#fdf0ee", borderTopLeftRadius: "8px", borderTopRightRadius: "8px" }}>
            <h3 style={{ margin: 0, color: "var(--primary)" }}>Your Review</h3>
          </div>
          <div>
            {myReviews.map(review => (
              <ReviewItem key={review._id} review={review} currentUser={currentUser} onReviewDeleted={onReviewDeleted} showMovie={showMovie} />
            ))}
          </div>
        </div>
      )}

      {otherReviews.length > 0 && (
        <div className="admin-card" style={{ padding: "0" }}>
          <div style={{ padding: "20px", borderBottom: "2px solid #ead6c3", background: "#fdf0ee", borderTopLeftRadius: "8px", borderTopRightRadius: "8px" }}>
            <h3 style={{ margin: 0, color: "var(--primary)" }}>Community Reviews ({otherReviews.length})</h3>
          </div>
          <div>
            {otherReviews.map(review => (
              <ReviewItem key={review._id} review={review} currentUser={currentUser} onReviewDeleted={onReviewDeleted} showMovie={showMovie} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewList;
