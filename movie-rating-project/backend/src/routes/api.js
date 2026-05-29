const express = require("express");
const { register, login } = require("../controllers/authController");
const {
	listUsers,
	getUserById,
	updateUserRole,
	deleteUser,
} = require("../controllers/adminUserController");
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

module.exports = router;
