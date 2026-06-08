const User = require("../models/User");
const AdminAuditLog = require("../models/AdminAuditLog");

const allowedRoles = ["customer", "staff", "admin"];

const listUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const search = (req.query.search || "").trim();
    const role = (req.query.role || "").trim();

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role && allowedRoles.includes(role)) {
      filter.role = role;
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("name email role isActive createdAt updatedAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "name email role isActive createdAt updatedAt"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (req.user.id === req.params.id && role !== "admin") {
      return res.status(400).json({ message: "Cannot remove your own admin" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const previousRole = user.role;

    user.role = role;
    await user.save();

    await AdminAuditLog.create({
      adminId: req.user._id,
      adminEmail: req.user.email,
      action: "role_update",
      targetUserId: user._id,
      targetEmail: user.email,
      details: { previousRole, newRole: role },
    });

    return res.status(200).json({
      message: "Role updated",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "Invalid status" });
    }

    if (req.user.id === req.params.id && !isActive) {
      return res.status(400).json({ message: "Cannot deactivate your account" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const previousStatus = user.isActive;
    user.isActive = isActive;
    await user.save();

    await AdminAuditLog.create({
      adminId: req.user._id,
      adminEmail: req.user.email,
      action: "status_update",
      targetUserId: user._id,
      targetEmail: user.email,
      details: { previousStatus, newStatus: isActive },
    });

    return res.status(200).json({
      message: "Status updated",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await AdminAuditLog.create({
      adminId: req.user._id,
      adminEmail: req.user.email,
      action: "delete_user",
      targetUserId: user._id,
      targetEmail: user.email,
      details: { role: user.role, wasActive: user.isActive },
    });

    return res.status(200).json({ message: "User deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  listUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  deleteUser,
};
