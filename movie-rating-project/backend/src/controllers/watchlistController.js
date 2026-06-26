const Watchlist = require("../models/Watchlist");

const addToWatchlist = async (req, res) => {
  try {
    const { movieId, status } = req.body;
    if (!movieId) {
      return res.status(400).json({ message: "movieId is required" });
    }

    const existing = await Watchlist.findOne({ user: req.user._id, movie: movieId });
    if (existing) {
      return res.status(400).json({ message: "Movie already in watchlist" });
    }

    const item = await Watchlist.create({
      user: req.user._id,
      movie: movieId,
      status: status || "will_watch",
    });
    await item.populate("movie", "name poster");

    return res.status(201).json({ message: "Added to watchlist", item });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateWatchlistStatus = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { status } = req.body;

    if (!["watching", "will_watch", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const item = await Watchlist.findOneAndUpdate(
      { user: req.user._id, movie: movieId },
      { status },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ message: "Watchlist item not found" });
    }

    return res.status(200).json({ message: "Watchlist updated", item });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const removeFromWatchlist = async (req, res) => {
  try {
    const { movieId } = req.params;
    const item = await Watchlist.findOneAndDelete({ user: req.user._id, movie: movieId });
    if (!item) {
      return res.status(404).json({ message: "Watchlist item not found" });
    }
    return res.status(200).json({ message: "Removed from watchlist" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const listWatchlist = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { user: req.user._id };
    if (status && ["watching", "will_watch", "completed"].includes(status)) {
      filter.status = status;
    }

    const items = await Watchlist.find(filter)
      .populate("movie", "name poster releaseDate status genres")
      .sort({ updatedAt: -1 });

    return res.status(200).json({ items });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const toggleWatchlistPrivacy = async (req, res) => {
  try {
    const { movieId } = req.params;
    const item = await Watchlist.findOne({ user: req.user._id, movie: movieId });
    if (!item) {
      return res.status(404).json({ message: "Watchlist item not found" });
    }

    item.isPublic = !item.isPublic;
    await item.save();

    return res.status(200).json({ message: "Privacy updated", isPublic: item.isPublic });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const setAllPrivacy = async (req, res) => {
  try {
    const { isPublic } = req.body;
    if (typeof isPublic !== "boolean") {
      return res.status(400).json({ message: "isPublic must be boolean" });
    }

    await Watchlist.updateMany(
      { user: req.user._id },
      { isPublic }
    );

    return res.status(200).json({ message: "Privacy updated for all items" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  addToWatchlist,
  updateWatchlistStatus,
  removeFromWatchlist,
  listWatchlist,
  toggleWatchlistPrivacy,
  setAllPrivacy,
};
