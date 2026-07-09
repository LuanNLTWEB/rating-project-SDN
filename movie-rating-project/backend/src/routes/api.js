const express = require("express");
const { register, login, refresh, logout, forgotPassword, resetPassword } = require("../controllers/authController");
const {
	listUsers,
	getUserById,
	updateUserRole,
	updateUserStatus,
	deleteUser,
	muteUser,
} = require("../controllers/adminUserController");
const { listAuditLogs } = require("../controllers/adminAuditController");
const {
	listGenres,
	getGenreById,
	createGenre,
	updateGenre,
	toggleGenreStatus,
	deleteGenre,
} = require("../controllers/genreController");
const {
	listMovies,
	getMovieById,
	createMovie,
	updateMovie,
	toggleMovieStatus,
	deleteMovie,
	getTrendingMovies,
	incrementViewCount,
	getMostPopularMovies,
	getTopRatedMovies,
} = require("../controllers/movieController");
const {
	listPublicNews,
	syncExternalNews,
	createNews,
	staffListNews,
	staffUpdateNews,
	deleteNews,
} = require("../controllers/newsController");
const {
	addFavorite,
	removeFavorite,
	listFavorites,
	checkFavorite,
} = require("../controllers/favoriteController");
const {
	addToWatchlist,
	updateWatchlistStatus,
	removeFromWatchlist,
	listWatchlist,
	toggleWatchlistPrivacy,
	setAllPrivacy,
} = require("../controllers/watchlistController");
const {
	createReview,
	updateReview,
	deleteReview,
	getReviewsForMovie,
	reactToReview,
	getAllReviews,
	forceSpoiler,
	togglePin,
} = require("../controllers/reviewController");
const {
  getUserAnalytics,
  getReviewAnalytics,
  getMovieAnalytics,
} = require("../controllers/analyticsController");
const upload = require("../middlewares/upload");
const { authenticate, requireAdmin, requireStaff } = require("../middlewares/auth");
const { getProfile, updateProfile, changePassword, uploadAvatar, getMyAuditLogs } = require("../controllers/profileController");
const { getPublicProfile } = require("../controllers/publicProfileController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.get("/admin/users", authenticate, requireAdmin, listUsers);
router.get("/admin/users/:id", authenticate, requireAdmin, getUserById);
router.get("/admin/audit-logs", authenticate, requireAdmin, listAuditLogs);
router.patch(
	"/admin/users/:id/role",
	authenticate,
	requireAdmin,
	updateUserRole
);
router.patch(
	"/admin/users/:id/status",
	authenticate,
	requireAdmin,
	updateUserStatus
);
router.delete("/admin/users/:id", authenticate, requireAdmin, deleteUser);
router.patch("/admin/users/:id/mute", authenticate, requireStaff, muteUser);

router.get("/genres", listGenres);
router.get("/staff/genres", authenticate, requireStaff, listGenres);
router.get("/staff/genres/:id", authenticate, requireStaff, getGenreById);
router.post("/staff/genres", authenticate, requireStaff, createGenre);
router.put("/staff/genres/:id", authenticate, requireStaff, updateGenre);
router.patch("/staff/genres/:id/toggle-status", authenticate, requireStaff, toggleGenreStatus);
router.delete("/staff/genres/:id", authenticate, requireStaff, deleteGenre);

router.get("/profile", authenticate, getProfile);
router.put("/profile/update", authenticate, updateProfile);
router.put("/profile/change-password", authenticate, changePassword);
router.post("/profile/upload-avatar", authenticate, uploadAvatar);
router.get("/profile/audit-logs", authenticate, getMyAuditLogs);

router.get("/users/:id/public-profile", getPublicProfile);

router.get("/movies", listMovies);
router.get("/movies/trending", getTrendingMovies);
router.get("/movies/popular", getMostPopularMovies);
router.get("/movies/top-rated", getTopRatedMovies);
router.get("/movies/:id", getMovieById);
router.patch("/movies/:id/view", incrementViewCount);

router.get("/staff/movies", authenticate, requireStaff, listMovies);
router.post(
	"/staff/movies",
	authenticate,
	requireStaff,
	upload.fields([
		{ name: "poster", maxCount: 1 },
		{ name: "banner", maxCount: 1 },
	]),
	createMovie
);
router.put(
	"/staff/movies/:id",
	authenticate,
	requireStaff,
	upload.fields([
		{ name: "poster", maxCount: 1 },
		{ name: "banner", maxCount: 1 },
	]),
	updateMovie
);
router.patch("/staff/movies/:id/toggle-status", authenticate, requireStaff, toggleMovieStatus);
router.delete("/staff/movies/:id", authenticate, requireStaff, deleteMovie);

// News routes
router.get("/news", listPublicNews);
router.post("/staff/news/sync", authenticate, requireStaff, syncExternalNews);
router.post("/staff/news", authenticate, requireStaff, upload.array("images", 10), createNews);
router.get("/staff/news", authenticate, requireStaff, staffListNews);
router.put("/staff/news/:id", authenticate, requireStaff, upload.array("images", 10), staffUpdateNews);
router.delete("/staff/news/:id", authenticate, requireStaff, deleteNews);

// Favorite routes
router.post("/favorites", authenticate, addFavorite);
router.delete("/favorites/:movieId", authenticate, removeFavorite);
router.get("/favorites", authenticate, listFavorites);
router.get("/favorites/:movieId/check", authenticate, checkFavorite);

// Watchlist routes
router.post("/watchlist", authenticate, addToWatchlist);
router.put("/watchlist/:movieId", authenticate, updateWatchlistStatus);
router.delete("/watchlist/:movieId", authenticate, removeFromWatchlist);
router.get("/watchlist", authenticate, listWatchlist);
router.patch("/watchlist/:movieId/privacy", authenticate, toggleWatchlistPrivacy);
router.patch("/watchlist/privacy", authenticate, setAllPrivacy);

// Review routes
router.get("/reviews", getAllReviews);
router.get("/movies/:movieId/reviews", getReviewsForMovie);
router.post("/movies/:movieId/reviews", authenticate, createReview);
router.put("/reviews/:id", authenticate, updateReview);
router.delete("/reviews/:id", authenticate, deleteReview);
router.post("/reviews/:id/react", authenticate, reactToReview);

router.patch("/staff/reviews/:id/force-spoiler", authenticate, requireStaff, forceSpoiler);
router.patch("/staff/reviews/:id/pin", authenticate, requireStaff, togglePin);

// Analytics routes
router.get("/analytics/users", authenticate, requireStaff, getUserAnalytics);
router.get("/analytics/reviews", authenticate, requireStaff, getReviewAnalytics);
router.get("/analytics/movies", authenticate, requireStaff, getMovieAnalytics);

module.exports = router;
