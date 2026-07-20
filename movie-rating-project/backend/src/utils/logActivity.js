const UserActivityLog = require("../models/UserActivityLog");

/**
 * Ghi 1 dòng nhật ký hoạt động cá nhân cho user.
 * Được gọi "âm thầm" (fire-and-forget an toàn): nếu ghi log lỗi,
 * sẽ chỉ log ra console chứ KHÔNG làm fail request chính của user.
 *
 * @param {Object} params
 * @param {String|ObjectId} params.userId - id của chính chủ tài khoản
 * @param {String} params.action - 1 trong ACTIVITY_ACTIONS (vd: "login", "review_create"...)
 * @param {String} [params.description] - mô tả ngắn để hiển thị trực tiếp lên UI
 * @param {Object} [params.details] - dữ liệu chi tiết đi kèm
 * @param {Object} [params.req] - request object (để lấy IP / User-Agent), optional
 */
const logActivity = async ({ userId, action, description = "", details = {}, req = null }) => {
  try {
    if (!userId || !action) return;

    await UserActivityLog.create({
      userId,
      action,
      description,
      details,
      ipAddress: req?.ip || req?.headers?.["x-forwarded-for"] || null,
      userAgent: req?.headers?.["user-agent"] || null,
    });
  } catch (error) {
    // Không throw ra ngoài - ghi log thất bại không được phép làm hỏng chức năng chính
    console.error("Failed to write user activity log:", error.message);
  }
};

module.exports = logActivity;
