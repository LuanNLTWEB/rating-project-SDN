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
    authors: [
      {
        type: String,
        trim: true,
      },
    ],
    type: {
      type: String,
      enum: ["ova", "movie", "tv series", "specials"],
      default: "tv series",
    },
    producers: [
      {
        type: String,
        trim: true,
      },
    ],
    studios: [
      {
        type: String,
        trim: true,
      },
    ],
    trailers: [
      {
        type: String,
        trim: true,
      },
    ],
    relatedMovies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Movie",
      },
    ],
    relatedNews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "News",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Movie", movieSchema);
