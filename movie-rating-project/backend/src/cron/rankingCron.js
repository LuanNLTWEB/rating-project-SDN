const cron = require("node-cron");
const Movie = require("../models/Movie");

// Calculate Bayesian Average for movies
// Formula: W = (v / (v + m)) * R + (m / (v + m)) * C
// v = number of votes for the movie (reviewCount)
// m = minimum votes required (e.g. 5)
// R = average rating of the movie
// C = mean vote across the whole server
const calculateBayesianRatings = async () => {
  try {
    const MINIMUM_VOTES = 5; // Reduced from 50 to 5 for easier testing in small projects

    // 1. Calculate C (mean vote across all movies that have at least 1 review)
    const stats = await Movie.aggregate([
      { $match: { reviewCount: { $gt: 0 } } },
      { $group: { _id: null, avgRatingServer: { $avg: "$averageRating" } } }
    ]);

    const C = stats.length > 0 ? stats[0].avgRatingServer : 0;

    // 2. Fetch movies to update
    const movies = await Movie.find({});

    for (const movie of movies) {
      const v = movie.reviewCount || 0;
      const R = movie.averageRating || 0;
      const m = MINIMUM_VOTES;

      let bayesianRating = 0;
      if (v === 0) {
        bayesianRating = 0; // If no reviews, we can just leave it at 0
      } else {
        bayesianRating = ((v / (v + m)) * R) + ((m / (v + m)) * C);
      }

      bayesianRating = Math.round(bayesianRating * 100) / 100;
      
      if (movie.bayesianRating !== bayesianRating) {
        movie.bayesianRating = bayesianRating;
        await movie.save();
      }
    }
    console.log(`[Cron] Bayesian ratings updated successfully using C=${C.toFixed(2)}`);
  } catch (error) {
    console.error("[Cron] Error updating Bayesian ratings:", error);
  }
};

const startRankingCron = () => {
  cron.schedule("*/30 * * * *", () => {
    console.log("[Cron] Running Bayesian Rating calculation...");
    calculateBayesianRatings();
  });
  console.log("[Cron] Ranking cronjob scheduled (runs every 30 mins).");
};

module.exports = startRankingCron;
