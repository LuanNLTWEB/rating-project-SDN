const User = require("../models/User");
const Favorite = require("../models/Favorite");
const Watchlist = require("../models/Watchlist");

const getPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const favorites = await Favorite.find({ user: id })
      .populate("movie", "name poster releaseDate status genres averageRating")
      .sort({ createdAt: -1 });

    const watchlist = await Watchlist.find({ user: id, isPublic: true })
      .populate("movie", "name poster releaseDate status genres averageRating")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        avatar: user.avatar,
        gender: user.gender,
        role: user.role,
        createdAt: user.createdAt,
      },
      favorites,
      watchlist,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getPublicProfile };