const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    summary: { type: String, required: true },
    content: { type: String, required: true }, // Rich text / Markdown
    sourceUrls: [{ type: String }], // Array of crawled source URLs or manually added ones
    imageUrls: [{ type: String }], // Array of image URLs (can be external or uploaded local paths)
    videoUrls: [{ type: String }], // Array of video embed links
    tags: [{ type: String, trim: true }],
    relatedArticles: [{ type: mongoose.Schema.Types.ObjectId, ref: "News" }],
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    crawledAt: { type: Date, default: Date.now },
    publishedAt: { type: Date, default: null },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    authorName: { type: String, trim: true }, // Manually inputted author name
  },
  { timestamps: true }
);

newsSchema.pre("validate", function (next) {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }
  next();
});

module.exports = mongoose.model("News", newsSchema);
