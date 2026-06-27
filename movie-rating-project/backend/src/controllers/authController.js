const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");

const createAccessToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

const createRefreshToken = (user) =>
  jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const register = async (req, res) => {
  try {
    const { name, email, password, passwordConfirm, gender, dateOfBirth } = req.body;

    // Validate required fields
    if (!name || !email || !password || !passwordConfirm || !gender || !dateOfBirth) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check password confirmation
    if (password !== passwordConfirm) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Validate password length
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate gender
    if (!["male", "female", "other"].includes(gender)) {
      return res.status(400).json({ message: "Invalid gender" });
    }

    // Validate date of birth
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      return res.status(400).json({ message: "Invalid date of birth" });
    }

    const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 13) {
      return res.status(400).json({ message: "Must be at least 13 years old" });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const newUser = new User({ name, email, password, gender, dateOfBirth });
    await newUser.save();

    res.status(201).json({
      message: "Register successful",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        gender: newUser.gender,
        role: newUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Missing email or password" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is inactive" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = createAccessToken(user);
    const refreshToken = createRefreshToken(user);
    user.refreshTokenHash = hashToken(refreshToken);
    user.refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await user.save();

    res.status(200).json({
      message: "Login successful",
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        mutedUntil: user.mutedUntil,
        muteReason: user.muteReason,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Missing refresh token" });
    }

    const payload = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    const user = await User.findById(payload.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!user.refreshTokenHash || !user.refreshTokenExpiresAt) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (user.refreshTokenExpiresAt.getTime() < Date.now()) {
      return res.status(401).json({ message: "Refresh token expired" });
    }

    if (user.refreshTokenHash !== hashToken(refreshToken)) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = createAccessToken(user);
    const newRefreshToken = createRefreshToken(user);
    user.refreshTokenHash = hashToken(newRefreshToken);
    user.refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await user.save();

    return res.status(200).json({
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        mutedUntil: user.mutedUntil,
        muteReason: user.muteReason,
      },
    });
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(200).json({ message: "Logged out" });
    }

    const payload = jwt.decode(refreshToken);
    if (payload?.id) {
      await User.findByIdAndUpdate(payload.id, {
        refreshTokenHash: null,
        refreshTokenExpiresAt: null,
      });
    }

    return res.status(200).json({ message: "Logged out" });
  } catch (error) {
    return res.status(200).json({ message: "Logged out" });
  }
};

module.exports = { register, login, refresh, logout };
