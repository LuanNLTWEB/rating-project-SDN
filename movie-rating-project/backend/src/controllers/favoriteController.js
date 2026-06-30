const Favorite = require("../models/Favorite");

const addFavorite = async (req, res) => {
  try {
    const { movieId } = req.body;
    if (!movieId) {
      return res.status(400).json({ message: "movieId is required" });
    }

    const existing = await Favorite.findOne({ user: req.user._id, movie: movieId });
    if (existing) {
      return res.status(400).json({ message: "Movie already in favorites" });
    }

    const favorite = await Favorite.create({ user: req.user._id, movie: movieId });
    await favorite.populate("movie", "name poster");

    return res.status(201).json({ message: "Added to favorites", favorite });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const removeFavorite = async (req, res) => {
  try {
    const { movieId } = req.params;
    const favorite = await Favorite.findOneAndDelete({ user: req.user._id, movie: movieId });
    if (!favorite) {
      return res.status(404).json({ message: "Favorite not found" });
    }
    return res.status(200).json({ message: "Removed from favorites" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const listFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id })
      .populate("movie", "name poster releaseDate status genres")
      .sort({ createdAt: -1 });

    return res.status(200).json({ favorites });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const checkFavorite = async (req, res) => {
  try {
    const { movieId } = req.params;
    const favorite = await Favorite.findOne({ user: req.user._id, movie: movieId });
    return res.status(200).json({ isFavorite: !!favorite });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { addFavorite, removeFavorite, listFavorites, checkFavorite };
