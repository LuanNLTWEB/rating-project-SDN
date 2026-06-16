const express = require("express");
const { register, login } = require("../controllers/authController");
const {
	listUsers,
	getUserById,
	updateUserRole,
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
const { authenticate, requireAdmin, requireStaff } = require("../middlewares/auth");

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

router.get("/genres", listGenres);
router.get("/staff/genres", authenticate, requireStaff, listGenres);
router.get("/staff/genres/:id", authenticate, requireStaff, getGenreById);
router.post("/staff/genres", authenticate, requireStaff, createGenre);
router.put("/staff/genres/:id", authenticate, requireStaff, updateGenre);
router.patch("/staff/genres/:id/toggle-status", authenticate, requireStaff, toggleGenreStatus);
router.delete("/staff/genres/:id", authenticate, requireStaff, deleteGenre);

router.get("/admin/audit-logs", authenticate, requireAdmin, listAuditLogs);

module.exports = router;
