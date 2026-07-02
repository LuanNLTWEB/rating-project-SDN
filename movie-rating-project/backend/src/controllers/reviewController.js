const Review = require("../models/Review");
const Movie = require("../models/Movie");
const Watchlist = require("../models/Watchlist");
const xss = require("xss");

// Helper to update movie average rating and review count
const updateMovieRating = async (movieId) => {
  const stats = await Review.aggregate([
    { $match: { movie: movieId } },
    { $group: { _id: null, avgRating: { $avg: "$overallRating" }, count: { $sum: 1 } } },
  ]);
  const avg = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;
  await Movie.findByIdAndUpdate(movieId, { averageRating: avg, reviewCount: stats.length > 0 ? stats[0].count : 0 });
};

// Helper to calculate character count
const getWordCount = (text) => {
  return text.trim().length;
};

// Create a review
exports.createReview = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { overallRating, containsSpoiler, recommendation } = req.body;
    const bodyText = xss(req.body.bodyText);
    const userId = req.user._id;

    if (req.user.mutedUntil && new Date(req.user.mutedUntil) > new Date()) {
      return res.status(403).json({
        success: false,
        message: `You are banned from posting reviews until ${new Date(req.user.mutedUntil).toLocaleString()}`,
      });
    }

    // Character count validation (maximum 10000 characters)
    const charCount = getWordCount(bodyText);
    if (charCount > 10000) {
      return res.status(400).json({
        success: false,
        message: `Review must not exceed 10000 characters. Currently you have ${charCount} characters.`,
      });
    }

    // Check movie existence and status
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found." });
    }
    if (movie.status === "upcoming") {
      return res.status(400).json({ success: false, message: "Cannot review an upcoming movie." });
    }

    // Eligibility check
    const watchlistItem = await Watchlist.findOne({ user: userId, movie: movieId });
    if (!watchlistItem) {
      return res.status(403).json({
        success: false,
        message: "You must add this movie to your Watchlist to write a review.",
      });
    }

    const validStatuses = ["watching", "completed"];
    if (!validStatuses.includes(watchlistItem.status)) {
      return res.status(403).json({
        success: false,
        message: "You must be watching or have completed this movie to review it.",
      });
    }

    // Auto-tag preliminary if movie is ongoing
    const isPreliminary = movie.status === "ongoing";

    const review = await Review.create({
      user: userId,
      movie: movieId,
      overallRating,
      bodyText,
      containsSpoiler: containsSpoiler || false,
      isPreliminary,
      recommendation,
    });

    await updateMovieRating(movieId);
    res.status(201).json({ success: true, review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "You have already reviewed this movie." });
    }
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Update a review
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { overallRating, containsSpoiler, recommendation } = req.body;
    const bodyText = req.body.bodyText ? xss(req.body.bodyText) : undefined;
    const userId = req.user._id;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    if (review.user.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "You do not have permission to edit this review." });
    }

    // Enforce maximum 3 edits
    if (review.editHistory && review.editHistory.length >= 3) {
      return res.status(403).json({ success: false, message: "Maximum edit limit (3 times) reached." });
    }

    if (bodyText && bodyText !== review.bodyText) {
      const charCount = getWordCount(bodyText);
      if (charCount > 10000) {
        return res.status(400).json({
          success: false,
          message: `Review must not exceed 10000 characters. Currently you have ${charCount} characters.`,
        });
      }
      
      // Track edit history
      review.editHistory.push({
        bodyText: review.bodyText,
        editedAt: new Date()
      });
      review.isEdited = true;
      review.bodyText = bodyText;
    }

    if (overallRating) review.overallRating = overallRating;
    if (recommendation) review.recommendation = recommendation;
    if (typeof containsSpoiler !== "undefined") review.containsSpoiler = containsSpoiler;

    await review.save();

    await updateMovieRating(review.movie);
    res.status(200).json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Delete a review
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role; // Assuming role is populated or available in req.user

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    // Check if user is the owner or is staff/admin
    if (review.user.toString() !== userId.toString() && userRole !== "admin" && userRole !== "staff") {
      return res.status(403).json({ success: false, message: "You do not have permission to delete this review." });
    }

    const movieId = review.movie;
    await review.deleteOne();

    await updateMovieRating(movieId);
    res.status(200).json({ success: true, message: "Review deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
// Get reviews for a movie
exports.getReviewsForMovie = async (req, res) => {
  try {
    const { movieId } = req.params;
    
    // Sort by isPinned first, then helpfulnessScore
    const reviews = await Review.find({ movie: movieId })
      .populate("user", "name avatar role") // Assuming User has name and avatar
      .sort({ isPinned: -1, helpfulnessScore: -1, createdAt: -1 });

    res.status(200).json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// React to a review
exports.reactToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // helpful, nice, love, funny, confusing
    const userId = req.user._id;

    const validTypes = ["helpful", "nice", "love", "funny", "confusing"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid reaction type." });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    // Prevent reacting to own review
    if (review.user.toString() === userId.toString()) {
      return res.status(403).json({ success: false, message: "You cannot react to your own review." });
    }

    // Check if user already reacted with this type
    const hasReacted = review.reactions[type].includes(userId);
    
    if (hasReacted) {
      // Remove reaction (unlike)
      review.reactions[type] = review.reactions[type].filter(
        (uid) => uid.toString() !== userId.toString()
      );
      if (type === "helpful") review.helpfulnessScore -= 1;
    } else {
      // Add reaction
      review.reactions[type].push(userId);
      if (type === "helpful") review.helpfulnessScore += 1;
    }

    await review.save();

    res.status(200).json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Toggle pin status of a review (Admin/Staff only)
exports.togglePin = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });

    review.isPinned = !review.isPinned;
    await review.save();
    res.status(200).json({ success: true, isPinned: review.isPinned });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Force spoiler status (Admin/Staff only)
exports.forceSpoiler = async (req, res) => {
  try {
    const { id } = req.params;
    const { containsSpoiler } = req.body;
    const review = await Review.findByIdAndUpdate(id, { containsSpoiler }, { new: true });
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });

    res.status(200).json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get all reviews globally (for dashboard)
exports.getAllReviews = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const search = req.query.search || "";
    const rating = req.query.rating;

    const filter = {};
    if (rating) filter.overallRating = parseInt(rating, 10);

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate("user", "name email avatar role mutedUntil")
        .populate("movie", "name poster status")
        .sort({ createdAt: -1 }),
      Review.countDocuments(filter),
    ]);

    let filteredReviews = reviews;
    if (search) {
      const lowerSearch = search.toLowerCase();
      filteredReviews = reviews.filter(r => 
        (r.user && r.user.name && r.user.name.toLowerCase().includes(lowerSearch)) || 
        (r.movie && r.movie.name && r.movie.name.toLowerCase().includes(lowerSearch)) ||
        (r.bodyText && r.bodyText.toLowerCase().includes(lowerSearch))
      );
    }

    // Apply pagination in memory since we filter in memory
    const startIndex = (page - 1) * limit;
    const paginatedReviews = filteredReviews.slice(startIndex, startIndex + limit);

    res.status(200).json({
      success: true,
      reviews: paginatedReviews,
      pagination: {
        page,
        limit,
        total: filteredReviews.length,
        totalPages: Math.ceil(filteredReviews.length / limit) || 1,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
