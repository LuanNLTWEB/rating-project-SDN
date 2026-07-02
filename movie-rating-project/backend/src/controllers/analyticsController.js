const User = require("../models/User");
const Review = require("../models/Review");
const Movie = require("../models/Movie");
const mongoose = require("mongoose");

// [ADMIN] Get User Analytics
exports.getUserAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    
    // Status distribution
    const now = new Date();
    const activeCount = await User.countDocuments({
      isActive: true,
      $or: [{ mutedUntil: null }, { mutedUntil: { $lt: now } }]
    });
    const mutedCount = await User.countDocuments({
      mutedUntil: { $gte: now }
    });
    const inactiveCount = await User.countDocuments({ isActive: false });

    // Growth over the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const growth = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    res.status(200).json({
      totalUsers,
      statusDistribution: {
        active: activeCount,
        muted: mutedCount,
        inactive: inactiveCount
      },
      growth: growth.map(item => ({ date: item._id, users: item.count }))
    });
  } catch (error) {
    console.error("Error fetching user analytics:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// [STAFF] Get Review Analytics
exports.getReviewAnalytics = async (req, res) => {
  try {
    const totalReviews = await Review.countDocuments();
    
    // Traffic over last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const traffic = await Review.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Engagement: total reactions
    const engagement = await Review.aggregate([
      {
        $project: {
          helpfulCount: { $size: { $ifNull: ["$reactions.helpful", []] } },
          niceCount: { $size: { $ifNull: ["$reactions.nice", []] } },
          loveCount: { $size: { $ifNull: ["$reactions.love", []] } },
          funnyCount: { $size: { $ifNull: ["$reactions.funny", []] } },
          confusingCount: { $size: { $ifNull: ["$reactions.confusing", []] } }
        }
      },
      {
        $group: {
          _id: null,
          totalHelpful: { $sum: "$helpfulCount" },
          totalNice: { $sum: "$niceCount" },
          totalLove: { $sum: "$loveCount" },
          totalFunny: { $sum: "$funnyCount" },
          totalConfusing: { $sum: "$confusingCount" }
        }
      }
    ]);

    // Anomaly Detection: Movies with unusually high number of 1-star reviews in last 24h
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const anomalies = await Review.aggregate([
      { $match: { createdAt: { $gte: oneDayAgo }, overallRating: 1 } },
      {
        $group: {
          _id: "$movie",
          oneStarCount: { $sum: 1 }
        }
      },
      { $match: { oneStarCount: { $gte: 3 } } }, // Threshold: 3 or more 1-star reviews in 24h
      {
        $lookup: {
          from: "movies",
          localField: "_id",
          foreignField: "_id",
          as: "movieData"
        }
      },
      { $unwind: "$movieData" },
      {
        $project: {
          movieId: "$_id",
          movieName: "$movieData.name",
          oneStarCount: 1
        }
      }
    ]);

    res.status(200).json({
      totalReviews,
      traffic: traffic.map(item => ({ date: item._id, reviews: item.count })),
      engagement: engagement[0] || { totalHelpful: 0, totalNice: 0, totalLove: 0, totalFunny: 0, totalConfusing: 0 },
      anomalies
    });
  } catch (error) {
    console.error("Error fetching review analytics:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// [STAFF] Get Movie Analytics
exports.getMovieAnalytics = async (req, res) => {
  try {
    const totalMovies = await Movie.countDocuments();
    
    // Data Integrity Check (Missing poster, banner, or genres)
    const missingData = await Movie.find({
      $or: [
        { poster: null },
        { poster: "" },
        { banner: null },
        { banner: "" },
        { genres: { $exists: true, $size: 0 } },
        { summary: { $exists: false } },
        { summary: "" }
      ]
    }).select("name poster banner genres summary");

    res.status(200).json({
      totalMovies,
      missingData
    });
  } catch (error) {
    console.error("Error fetching movie analytics:", error);
    res.status(500).json({ message: "Server error" });
  }
};
