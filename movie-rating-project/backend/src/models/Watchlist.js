const mongoose = require("mongoose");

const watchlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },
    status: {
      type: String,
      enum: ["watching", "will_watch", "completed"],
      default: "will_watch",
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

watchlistSchema.index({ user: 1, movie: 1 }, { unique: true });

module.exports = mongoose.model("Watchlist", watchlistSchema);
