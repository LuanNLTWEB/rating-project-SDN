const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      required: true,
    },
    poster: {
      type: String, // URL/Path to the image
      default: null,
    },
    banner: {
      type: String, // URL/Path to the image
      default: null,
    },
    trailer: {
      type: String, // URL to the trailer (e.g. YouTube)
      default: null,
    },
    releaseDate: {
      type: Date,
      required: true,
    },
    totalEpisodes: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ["ongoing", "completed", "upcoming"],
      default: "ongoing",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    genres: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Genre",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Movie", movieSchema);
