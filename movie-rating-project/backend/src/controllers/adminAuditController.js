const AdminAuditLog = require("../models/AdminAuditLog");

const listAuditLogs = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const admin = (req.query.admin || "").trim();
    const target = (req.query.target || "").trim();
    const action = (req.query.action || "").trim();
    const from = (req.query.from || "").trim();
    const to = (req.query.to || "").trim();

    const filter = {};

    if (admin) {
      filter.adminEmail = { $regex: admin, $options: "i" };
    }

    if (target) {
      filter.targetEmail = { $regex: target, $options: "i" };
    }

    if (action) {
      filter.action = action;
    }

    if (from || to) {
      filter.createdAt = {};
      if (from) {
        const fromDate = new Date(from);
        if (!Number.isNaN(fromDate.getTime())) {
          filter.createdAt.$gte = fromDate;
        }
      }
      if (to) {
        const toDate = new Date(to);
        if (!Number.isNaN(toDate.getTime())) {
          filter.createdAt.$lte = toDate;
        }
      }

      if (Object.keys(filter.createdAt).length === 0) {
        delete filter.createdAt;
      }
    }

    const [logs, total] = await Promise.all([
      AdminAuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AdminAuditLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      logs,
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

module.exports = { listAuditLogs };
