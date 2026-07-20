const User = require("../models/User");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const path = require("path");
const UserActivityLog = require("../models/UserActivityLog");
const bcrypt = require("bcryptjs");
const xss = require("xss");
const logActivity = require("../utils/logActivity");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "avatars",
    allowed_formats: ["jpg", "jpeg", "png"],
    public_id: (req, file) => req.user.id + "-" + Date.now(),
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: fileFilter
}).single("avatar");

// US06: View Profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({
      message: "Get profile successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while fetching profile" });
  }
};

// US07: Update Profile (Gom cụm trọn gói cả Text + Avatar chạy đồng bộ thông qua Multer)
const updateProfile = async (req, res) => {

  // Gọi middleware upload trực tiếp ở đây để bóc tách Multipart FormData (bao gồm cả chữ và ảnh)
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      // Sau khi upload chạy xong, req.body và req.file chắc chắn sẽ có dữ liệu đầy đủ
      const { name, gender, dateOfBirth } = req.body;
      const user = await User.findById(req.user.id).select("+password");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Validate name
      if (name !== undefined && !name.trim()) {
        return res.status(400).json({ message: "Full Name is required" });
      }

      // Validate dateOfBirth
      if (dateOfBirth) {
        const dob = new Date(dateOfBirth);
        if (isNaN(dob.getTime())) {
          return res.status(400).json({ message: "Invalid date of birth" });
        }
        const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        if (age < 13) {
          return res.status(400).json({ message: "Must be at least 13 years old" });
        }
      }

      // Cập nhật các trường chữ nếu có thay đổi gửi lên
      if (name) user.name = xss(name.trim());
      if (gender) user.gender = gender;
      if (dateOfBirth) user.dateOfBirth = dateOfBirth;

      // Cập nhật đường dẫn ảnh đại diện nếu người dùng có chọn file ảnh mới
      if (req.file) {
        // Cloudinary trả về đường link ảnh đầy đủ trong req.file.path
        user.avatar = req.file.path;
      }

      await user.save();

      logActivity({
        userId: user._id,
        action: "profile_update",
        description: "Updated personal information",
        details: { name, gender, dateOfBirth, avatarChanged: !!req.file },
        req,
      });

      return res.status(200).json({
        message: "Update profile successful!",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          gender: user.gender,
          dateOfBirth: user.dateOfBirth,
          avatar: user.avatar,
          role: user.role,
          isActive: user.isActive
        }
      });
    } catch (error) {
      return res.status(500).json({ message: error.message || "Update profile failed" });
    }
  });
};

// US08: Change Password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, passwordConfirm } = req.body;
    if (!currentPassword || !newPassword || !passwordConfirm) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (newPassword !== passwordConfirm) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    //const salt = await bcrypt.genSalt(10);
    //user.password = await bcrypt.hash(newPassword, salt); 

    user.password = newPassword;

    await user.save();

    logActivity({
      userId: user._id,
      action: "password_change",
      description: "Changed account password",
      req,
    });

    return res.status(200).json({ message: "Change password successful" });
  } catch (error) {
    return res.status(500).json({ message: "Server error while changing password" });
  }
};


// US09: Upload Avatar
const uploadAvatar = async (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Please select an image to upload" });
    }

    try {
      // Cloudinary trả về đường link ảnh đầy đủ trong req.file.path
      const avatarUrl = req.file.path;
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.avatar = avatarUrl;
      await user.save();

      logActivity({
        userId: user._id,
        action: "avatar_upload",
        description: "Uploaded a new avatar",
        req,
      });

      return res.status(200).json({
        message: "Upload avatar successful",
        avatar: avatarUrl
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error while uploading avatar" });
    }
  });
};


// US10: Xem lịch sử hoạt động cá nhân
const getMyAuditLogs = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

    const filter = { userId: req.user.id };

    const [logs, total] = await Promise.all([
      UserActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      UserActivityLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      message: "Get my audit logs successful",
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while getting audit logs" });
  }
};

module.exports = { getProfile, updateProfile, changePassword, uploadAvatar, getMyAuditLogs, upload };
