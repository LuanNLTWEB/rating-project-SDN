const express = require("express");
const { register, login } = require("../controllers/authController");
const {
	listUsers,
	getUserById,
	updateUserRole,
	deleteUser,
} = require("../controllers/adminUserController");
<<<<<<< Updated upstream
=======
const { listAuditLogs } = require("../controllers/adminAuditController");
const {
	listGenres,
	getGenreById,
	createGenre,
	updateGenre,
	toggleGenreStatus,
	deleteGenre,
} = require("../controllers/genreController");
>>>>>>> Stashed changes
const { authenticate, requireAdmin } = require("../middlewares/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/admin/users", authenticate, requireAdmin, listUsers);
router.get("/admin/users/:id", authenticate, requireAdmin, getUserById);
router.patch(
	"/admin/users/:id/role",
	authenticate,
	requireAdmin,
	updateUserRole
);
router.delete("/admin/users/:id", authenticate, requireAdmin, deleteUser);

router.get("/admin/genres", authenticate, requireAdmin, listGenres);
router.get("/admin/genres/:id", authenticate, requireAdmin, getGenreById);
router.post("/admin/genres", authenticate, requireAdmin, createGenre);
router.put("/admin/genres/:id", authenticate, requireAdmin, updateGenre);
router.patch("/admin/genres/:id/toggle-status", authenticate, requireAdmin, toggleGenreStatus);
router.delete("/admin/genres/:id", authenticate, requireAdmin, deleteGenre);

module.exports = router;
