const News = require("../models/News");
const Parser = require("rss-parser");
const parser = new Parser({
  customFields: {
    item: ['media:thumbnail']
  }
});

// Get all published news for public user list
exports.listPublicNews = async (req, res) => {
  try {
    const list = await News.find({ status: "published" })
      .sort({ publishedAt: -1, createdAt: -1 })
      .populate("author", "name")
      .populate("relatedArticles", "title slug imageUrls publishedAt createdAt tags summary");
    return res.status(200).json(list);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching news", error: error.message });
  }
};

// Sync from real external APIs and RSS Feeds
const fallbackImages = [
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800",
  "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800",
  "https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?w=800",
  "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800",
  "https://images.unsplash.com/photo-1613376023733-0a73315d9b06?w=800"
];

const getFallback = () => fallbackImages[Math.floor(Math.random() * fallbackImages.length)];

exports.syncExternalNews = async (req, res) => {
  try {
    let crawledArticles = [];

    // 1. Fetch from Jikan API (REST JSON)
    try {
      const jikanRes = await fetch("https://api.jikan.moe/v4/news");
      if (jikanRes.ok) {
        const jikanData = await jikanRes.json();
        const jikanNews = jikanData.data?.slice(0, 10).map(item => ({
          title: item.title,
          summary: item.excerpt || "MyAnimeList News update.",
          content: `<p>${item.excerpt}</p><p><a href="${item.url}" target="_blank">Read more on MyAnimeList</a></p>`,
          sourceUrl: item.url,
          imageUrl: item.images?.jpg?.image_url || getFallback(),
          tags: ["Jikan", "MyAnimeList"]
        }));
        if (jikanNews) crawledArticles.push(...jikanNews);
      }
    } catch (e) {
      console.error("Jikan API error:", e);
    }

    // 2. Fetch from Anime News Network (RSS)
    try {
      const annFeed = await parser.parseURL("https://www.animenewsnetwork.com/news/rss.xml");
      const annNews = annFeed.items.slice(0, 10).map(item => {
        const contentStr = item.content || item.contentSnippet || "";
        const imgMatch = contentStr.match(/<img[^>]+src="([^">]+)"/);
        let imgUrl = imgMatch ? imgMatch[1] : getFallback();
        if (imgUrl.startsWith("/")) imgUrl = "https://www.animenewsnetwork.com" + imgUrl;
        return {
          title: item.title,
          summary: item.contentSnippet ? (item.contentSnippet.slice(0, 180) + "...") : "Anime News Network update.",
          content: item.content || `<p>${item.contentSnippet}</p>`,
          sourceUrl: item.link,
          imageUrl: imgUrl,
          tags: ["Anime News Network"]
        };
      });
      crawledArticles.push(...annNews);
    } catch (e) {
      console.error("ANN RSS error:", e);
    }

    // 3. Fetch from Crunchyroll (RSS)
    try {
      const crFeed = await parser.parseURL("https://www.crunchyroll.com/news.rss");
      const crNews = crFeed.items.slice(0, 10).map(item => {
        const contentStr = item.content || item.contentSnippet || "";
        const imgMatch = contentStr.match(/<img[^>]+src="([^">]+)"/);
        let imgUrl = item['media:thumbnail'] ? item['media:thumbnail'].$.url : (imgMatch ? imgMatch[1] : getFallback());
        if (imgUrl.startsWith("/")) imgUrl = "https://www.crunchyroll.com" + imgUrl;
        return {
          title: item.title,
          summary: item.contentSnippet ? (item.contentSnippet.slice(0, 180) + "...") : "Crunchyroll News update.",
          content: item.content || `<p>${item.contentSnippet}</p>`,
          sourceUrl: item.link,
          imageUrl: imgUrl,
          tags: ["Crunchyroll"]
        };
      });
      crawledArticles.push(...crNews);
    } catch (e) {
      console.error("Crunchyroll RSS error:", e);
    }

    let insertedCount = 0;
    for (const article of crawledArticles) {
      if (!article.sourceUrl || !article.title) continue;
      
      const exists = await News.findOne({ 
        $or: [
          { sourceUrl: article.sourceUrl },
          { title: article.title }
        ]
      });
      
      if (!exists) {
        await News.create({
          ...article,
          status: "draft",
        });
        insertedCount++;
      }
    }

    return res.status(200).json({ message: `Crawl completed. Added ${insertedCount} draft articles from multiple sources.` });
  } catch (error) {
    return res.status(500).json({ message: "Sync error", error: error.message });
  }
};

// Create a news article manually (Staff CRUD)
exports.createNews = async (req, res) => {
  try {
    const { title, summary, content, authorName, tags, status, relatedArticles } = req.body;
    let imageUrls = req.body.imageUrls ? (Array.isArray(req.body.imageUrls) ? req.body.imageUrls : [req.body.imageUrls]) : [];
    if (req.files && req.files.length > 0) {
      const uploadedImages = req.files.map(f => "/uploads/" + f.filename);
      imageUrls = [...imageUrls, ...uploadedImages];
    }
    const videoUrls = req.body.videoUrls ? (Array.isArray(req.body.videoUrls) ? req.body.videoUrls : [req.body.videoUrls]) : [];
    const sourceUrls = req.body.sourceUrls ? (Array.isArray(req.body.sourceUrls) ? req.body.sourceUrls : [req.body.sourceUrls]) : [];
    const related = relatedArticles ? (Array.isArray(relatedArticles) ? relatedArticles : relatedArticles.split(",").map(id => id.trim()).filter(Boolean)) : [];

    const news = await News.create({
      title,
      summary,
      content,
      imageUrls,
      videoUrls,
      sourceUrls,
      relatedArticles: related,
      authorName: authorName || null,
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : []),
      status: status || "draft",
      author: req.user._id,
      publishedAt: status === "published" ? new Date() : null
    });
    return res.status(201).json({ message: "Created successfully!", news });
  } catch (error) {
    return res.status(500).json({ message: "Error creating article", error: error.message });
  }
};

// List news for staff (Draft & Published)
exports.staffListNews = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const list = await News.find(filter)
      .sort({ createdAt: -1 })
      .populate("author", "name")
      .populate("relatedArticles", "title slug imageUrls");
    return res.status(200).json(list);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching list", error: error.message });
  }
};

// Update/Publish news article by staff
exports.staffUpdateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, summary, content, authorName, tags, status, relatedArticles } = req.body;
    
    let imageUrls = req.body.imageUrls ? (Array.isArray(req.body.imageUrls) ? req.body.imageUrls : [req.body.imageUrls]) : [];
    if (req.files && req.files.length > 0) {
      const uploadedImages = req.files.map(f => "/uploads/" + f.filename);
      imageUrls = [...imageUrls, ...uploadedImages];
    }
    const videoUrls = req.body.videoUrls ? (Array.isArray(req.body.videoUrls) ? req.body.videoUrls : [req.body.videoUrls]) : [];
    const sourceUrls = req.body.sourceUrls ? (Array.isArray(req.body.sourceUrls) ? req.body.sourceUrls : [req.body.sourceUrls]) : [];
    const related = relatedArticles ? (Array.isArray(relatedArticles) ? relatedArticles : relatedArticles.split(",").map(id => id.trim()).filter(Boolean)) : [];

    const news = await News.findById(id);
    if (!news) {
      return res.status(404).json({ message: "Article not found" });
    }

    if (title) {
      news.title = title;
      news.slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
    }
    if (summary) news.summary = summary;
    if (content) news.content = content;
    if (req.body.imageUrls !== undefined || (req.files && req.files.length > 0)) news.imageUrls = imageUrls;
    if (req.body.videoUrls !== undefined) news.videoUrls = videoUrls;
    if (req.body.sourceUrls !== undefined) news.sourceUrls = sourceUrls;
    if (req.body.relatedArticles !== undefined) news.relatedArticles = related;
    if (authorName !== undefined) news.authorName = authorName || null;
    if (tags) {
      news.tags = Array.isArray(tags) ? tags : tags.split(",").map(t => t.trim()).filter(Boolean);
    }

    if (status) {
      news.status = status;
      if (status === "published" && !news.publishedAt) {
        news.publishedAt = new Date();
      }
      news.author = req.user._id;
    }

    await news.save();
    return res.status(200).json({ message: "Updated successfully!", news });
  } catch (error) {
    return res.status(500).json({ message: "Error updating article", error: error.message });
  }
};

// Delete news article
exports.deleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await News.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ message: "Article not found" });
    }
    return res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting article", error: error.message });
  }
};
