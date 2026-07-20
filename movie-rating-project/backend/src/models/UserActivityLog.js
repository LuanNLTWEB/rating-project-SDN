const mongoose = require("mongoose");

// Danh sách các loại hành động được ghi nhận vào nhật ký hoạt động cá nhân.
// Khác với AdminAuditLog (ghi hành động ADMIN làm lên user khác),
// model này ghi hành động mà CHÍNH user đó tự thực hiện trên tài khoản của mình.
const ACTIVITY_ACTIONS = [
  "register",
  "login",
  "logout",
  "login_failed",
  "password_change",
  "password_reset",
  "profile_update",
  "avatar_upload",
  "review_create",
  "review_update",
  "review_delete",
  "favorite_add",
  "favorite_remove",
  "watchlist_add",
  "watchlist_update",
  "watchlist_remove",
];

const userActivityLogSchema = new mongoose.Schema(
  {
    // Chủ tài khoản - người thực hiện hành động (chính họ, không phải admin)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: ACTIVITY_ACTIONS,
    },
    // Mô tả ngắn, dễ đọc để hiển thị trực tiếp lên UI (vd: "Đã đổi mật khẩu")
    description: {
      type: String,
      default: "",
    },
    // Dữ liệu chi tiết đi kèm, tùy action (vd: movieId, reviewId, trường đã đổi...)
    details: {
      type: Object,
      default: {},
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Index phục vụ query "lấy log mới nhất của 1 user" nhanh
userActivityLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("UserActivityLog", userActivityLogSchema);
module.exports.ACTIVITY_ACTIONS = ACTIVITY_ACTIONS;
