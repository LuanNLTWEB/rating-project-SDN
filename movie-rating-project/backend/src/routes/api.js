const express = require("express");
const { register, login, refresh, logout } = require("../controllers/authController");
const {
	listUsers,
	getUserById,
	updateUserRole,
	updateUserStatus,
	deleteUser,
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
} = require("../controllers/movieController");
const upload = require("../middlewares/upload");
const { authenticate, requireAdmin, requireStaff } = require("../middlewares/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);

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

router.get("/genres", listGenres);
router.get("/staff/genres", authenticate, requireStaff, listGenres);
router.get("/staff/genres/:id", authenticate, requireStaff, getGenreById);
router.post("/staff/genres", authenticate, requireStaff, createGenre);
router.put("/staff/genres/:id", authenticate, requireStaff, updateGenre);
router.patch("/staff/genres/:id/toggle-status", authenticate, requireStaff, toggleGenreStatus);
router.delete("/staff/genres/:id", authenticate, requireStaff, deleteGenre);

router.get("/admin/audit-logs", authenticate, requireAdmin, listAuditLogs);

router.get("/movies", listMovies);
router.get("/movies/:id", getMovieById);

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

module.exports = router;
