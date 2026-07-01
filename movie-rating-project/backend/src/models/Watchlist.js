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
      enum: ["watching", "will_watch", "completed", "on_hold", "dropped"],
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

// Data Syncing Trigger: Sync memberCount in Movie
watchlistSchema.post("save", async function (doc, next) {
  try {
    // Only increment when a new watchlist item is created
    // this.isNew is a pre-save flag. We can check if createdAt equals updatedAt for a newly created doc
    // However, Watchlist.create() is the only place saving a new doc in watchlistController.js.
    const isNewDoc = doc.createdAt && doc.updatedAt && doc.createdAt.getTime() === doc.updatedAt.getTime();
    if (isNewDoc) {
      await mongoose.model("Movie").findByIdAndUpdate(doc.movie, { $inc: { memberCount: 1 } });
    }
  } catch (err) {
    console.error("Error in Watchlist save hook:", err);
  }
  next();
});

watchlistSchema.post("findOneAndDelete", async function (doc, next) {
  try {
    if (doc) {
      await mongoose.model("Movie").findByIdAndUpdate(doc.movie, { $inc: { memberCount: -1 } });
    }
  } catch (err) {
    console.error("Error in Watchlist delete hook:", err);
  }
  next();
});

module.exports = mongoose.model("Watchlist", watchlistSchema);
