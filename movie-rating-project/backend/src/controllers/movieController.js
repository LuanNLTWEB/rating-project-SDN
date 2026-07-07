const Movie = require("../models/Movie");
const AdminAuditLog = require("../models/AdminAuditLog");

// Get all movies (Staff & Admin)
const listMovies = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 1000);
    
    const filter = {};
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: "i" };
    }

    // Force isActive: true for public endpoint
    if (!req.originalUrl.includes("/staff")) {
      filter.isActive = true;
    }

    if (req.query.genre) {
      const genreIds = Array.isArray(req.query.genre) ? req.query.genre : req.query.genre.split(",").filter(Boolean);
      filter.genres = genreIds.length === 1 ? genreIds[0] : { $in: genreIds };
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.season || req.query.year) {
      if (req.query.season && !req.query.year) {
        let months;
        if (req.query.season === "Spring") { months = [3, 4, 5]; }
        else if (req.query.season === "Summer") { months = [6, 7, 8]; }
        else if (req.query.season === "Fall") { months = [9, 10, 11]; }
        else if (req.query.season === "Winter") { months = [12, 1, 2]; }
        if (months) {
          filter.$expr = { $in: [{ $month: "$releaseDate" }, months] };
        }
      } else {
        const year = parseInt(req.query.year, 10);
        if (req.query.season) {
          let startMonth, endMonth, endDay, startYear = year, endYear = year;
          if (req.query.season === "Spring") {
            startMonth = 2; endMonth = 4; endDay = 31;
          } else if (req.query.season === "Summer") {
            startMonth = 5; endMonth = 7; endDay = 31;
          } else if (req.query.season === "Fall") {
            startMonth = 8; endMonth = 10; endDay = 30;
          } else if (req.query.season === "Winter") {
            startMonth = 11; endMonth = 1; endDay = 29; endYear = year + 1;
          }
          if (startMonth !== undefined) {
            filter.releaseDate = {
              $gte: new Date(startYear, startMonth, 1),
              $lte: new Date(endYear, endMonth, endDay, 23, 59, 59)
            };
          }
        } else {
          filter.releaseDate = {
            $gte: new Date(year, 0, 1),
            $lte: new Date(year, 11, 31, 23, 59, 59)
          };
        }
      }
    }

    const [movies, total] = await Promise.all([
      Movie.find(filter)
        .populate("genres", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Movie.countDocuments(filter),
    ]);

    return res.status(200).json({
      movies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id)
      .populate("genres", "name")
      .populate("relatedMovies", "name poster")
      .populate("relatedNews", "title imageUrls summary");
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }
    return res.status(200).json({ movie });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createMovie = async (req, res) => {
  try {
    const { name, summary, trailer, releaseDate, totalEpisodes, status, isActive, genres, authors, type, producers, studios, trailers, relatedMovies, relatedNews, poster, banner } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ message: "Movie name is required" });
    if (!summary || !summary.trim()) return res.status(400).json({ message: "Summary is required" });
    if (!releaseDate) return res.status(400).json({ message: "Release date is required" });

    const parseArray = (val) => {
      if (!val) return [];
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch (e) {
          return val.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
      return Array.isArray(val) ? val : [val];
    };

    const movieData = {
      name: name.trim(),
      summary: summary.trim(),
      trailer: trailer || null,
      releaseDate: new Date(releaseDate),
      totalEpisodes: totalEpisodes || 1,
      status: status || "ongoing",
      isActive: isActive !== undefined ? isActive === "true" || isActive === true : true,
      type: type || "tv series",
      authors: parseArray(authors),
      producers: parseArray(producers),
      studios: parseArray(studios),
      trailers: parseArray(trailers),
      relatedMovies: parseArray(relatedMovies),
      relatedNews: parseArray(relatedNews),
    };

    if (genres) {
      movieData.genres = typeof genres === 'string' ? JSON.parse(genres) : genres;
    }

    if (poster) movieData.poster = poster;
    if (banner) movieData.banner = banner;

    if (req.files) {
      if (req.files.poster && req.files.poster[0]) {
        movieData.poster = `/uploads/${req.files.poster[0].filename}`;
      }
      if (req.files.banner && req.files.banner[0]) {
        movieData.banner = `/uploads/${req.files.banner[0].filename}`;
      }
    }

    const movie = new Movie(movieData);
    await movie.save();

    await AdminAuditLog.create({
      adminId: req.user._id,
      adminEmail: req.user.email,
      action: "create_movie",
      targetUserId: req.user._id,
      targetEmail: req.user.email,
      details: { movieId: movie._id, name: movie.name },
    });

    return res.status(201).json({ message: "Movie created successfully", movie });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateMovie = async (req, res) => {
  try {
    const { name, summary, trailer, releaseDate, totalEpisodes, status, isActive, genres, authors, type, producers, studios, trailers, relatedMovies, relatedNews, poster, banner } = req.body;

    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: "Movie not found" });

    if (name) movie.name = name.trim();
    if (summary) movie.summary = summary.trim();
    if (trailer !== undefined) movie.trailer = trailer;
    if (releaseDate) movie.releaseDate = new Date(releaseDate);
    if (totalEpisodes) movie.totalEpisodes = totalEpisodes;
    if (status) movie.status = status;
    if (isActive !== undefined) movie.isActive = isActive === "true" || isActive === true;
    if (type) movie.type = type;
    
    const parseArray = (val) => {
      if (!val) return [];
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch (e) {
          return val.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
      return Array.isArray(val) ? val : [val];
    };

    if (genres) {
      movie.genres = typeof genres === 'string' ? JSON.parse(genres) : genres;
    }

    if (authors !== undefined) movie.authors = parseArray(authors);
    if (producers !== undefined) movie.producers = parseArray(producers);
    if (studios !== undefined) movie.studios = parseArray(studios);
    if (trailers !== undefined) movie.trailers = parseArray(trailers);
    
    // Explicitly handle relatedMovies and relatedNews. Empty string check ensures we can clear them.
    if (relatedMovies !== undefined) {
      movie.relatedMovies = parseArray(relatedMovies);
    }
    if (relatedNews !== undefined) {
      movie.relatedNews = parseArray(relatedNews);
    }

    if (poster) movie.poster = poster;
    if (banner) movie.banner = banner;

    if (req.files) {
      if (req.files.poster && req.files.poster[0]) {
        movie.poster = `/uploads/${req.files.poster[0].filename}`;
      }
      if (req.files.banner && req.files.banner[0]) {
        movie.banner = `/uploads/${req.files.banner[0].filename}`;
      }
    }

    await movie.save();

    await AdminAuditLog.create({
      adminId: req.user._id,
      adminEmail: req.user.email,
      action: "update_movie",
      targetUserId: req.user._id,
      targetEmail: req.user.email,
      details: { movieId: movie._id, name: movie.name },
    });

    return res.status(200).json({ message: "Movie updated successfully", movie });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const toggleMovieStatus = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: "Movie not found" });

    movie.isActive = !movie.isActive;
    await movie.save();

    await AdminAuditLog.create({
      adminId: req.user._id,
      adminEmail: req.user.email,
      action: movie.isActive ? "show_movie" : "hide_movie",
      targetUserId: req.user._id,
      targetEmail: req.user.email,
      details: { movieId: movie._id, name: movie.name, isActive: movie.isActive },
    });

    return res.status(200).json({ message: movie.isActive ? "Movie is now visible" : "Movie is now hidden", movie });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) return res.status(404).json({ message: "Movie not found" });

    await AdminAuditLog.create({
      adminId: req.user._id,
      adminEmail: req.user.email,
      action: "delete_movie",
      targetUserId: req.user._id,
      targetEmail: req.user.email,
      details: { movieId: movie._id, name: movie.name },
    });

    return res.status(200).json({ message: "Movie deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getTrendingMovies = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const filter = { isActive: true };

    if (req.query.season || req.query.year) {
      if (req.query.season && !req.query.year) {
        let months;
        if (req.query.season === "Spring") { months = [3, 4, 5]; }
        else if (req.query.season === "Summer") { months = [6, 7, 8]; }
        else if (req.query.season === "Fall") { months = [9, 10, 11]; }
        else if (req.query.season === "Winter") { months = [12, 1, 2]; }
        if (months) {
          filter.$expr = { $in: [{ $month: "$releaseDate" }, months] };
        }
      } else {
        const year = parseInt(req.query.year, 10);
        if (req.query.season) {
          let startMonth, endMonth, startYear = year, endYear = year;
          if (req.query.season === "Spring") { startMonth = 2; endMonth = 4; }
          else if (req.query.season === "Summer") { startMonth = 5; endMonth = 7; }
          else if (req.query.season === "Fall") { startMonth = 8; endMonth = 10; }
          else if (req.query.season === "Winter") { startMonth = 11; endMonth = 1; endYear = year + 1; }
          if (startMonth !== undefined) {
            filter.releaseDate = {
              $gte: new Date(startYear, startMonth, 1),
              $lte: new Date(endYear, endMonth + 1, 0, 23, 59, 59)
            };
          }
        } else {
          filter.releaseDate = {
            $gte: new Date(year, 0, 1),
            $lte: new Date(year, 11, 31, 23, 59, 59)
          };
        }
      }
    }

    let sort;
    switch (req.query.sort) {
      case "newest": sort = { createdAt: -1 }; break;
      case "rating": sort = { averageRating: -1, reviewCount: -1, createdAt: -1 }; break;
      case "comments": sort = { reviewCount: -1, averageRating: -1, createdAt: -1 }; break;
      default: sort = { viewCount: -1, createdAt: -1 };
    }

    const movies = await Movie.find(filter)
      .populate("genres", "name")
      .sort(sort)
      .limit(limit)
      .lean();
    return res.status(200).json({ movies });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const incrementViewCount = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    );
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }
    return res.status(200).json({ message: "View count updated", viewCount: movie.viewCount });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMostPopularMovies = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
    const filter = { isActive: true };

    if (req.query.season || req.query.year) {
      if (req.query.season && !req.query.year) {
        let months;
        if (req.query.season === "Spring") { months = [3, 4, 5]; }
        else if (req.query.season === "Summer") { months = [6, 7, 8]; }
        else if (req.query.season === "Fall") { months = [9, 10, 11]; }
        else if (req.query.season === "Winter") { months = [12, 1, 2]; }
        if (months) {
          filter.$expr = { $in: [{ $month: "$releaseDate" }, months] };
        }
      } else {
        const year = parseInt(req.query.year, 10);
        if (req.query.season) {
          let startMonth, endMonth, startYear = year, endYear = year;
          if (req.query.season === "Spring") { startMonth = 2; endMonth = 4; }
          else if (req.query.season === "Summer") { startMonth = 5; endMonth = 7; }
          else if (req.query.season === "Fall") { startMonth = 8; endMonth = 10; }
          else if (req.query.season === "Winter") { startMonth = 11; endMonth = 1; endYear = year + 1; }
          if (startMonth !== undefined) {
            filter.releaseDate = {
              $gte: new Date(startYear, startMonth, 1),
              $lte: new Date(endYear, endMonth + 1, 0, 23, 59, 59)
            };
          }
        } else {
          filter.releaseDate = {
            $gte: new Date(year, 0, 1),
            $lte: new Date(year, 11, 31, 23, 59, 59)
          };
        }
      }
    }

    const [movies, total] = await Promise.all([
      Movie.find(filter)
        .populate("genres", "name")
        .sort({ memberCount: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Movie.countDocuments(filter),
    ]);

    return res.status(200).json({
      movies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getTopRatedMovies = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
    const filter = { isActive: true };

    const [movies, total] = await Promise.all([
      Movie.find(filter)
        .populate("genres", "name")
        .sort({ averageRating: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Movie.countDocuments(filter),
    ]);

    return res.status(200).json({
      movies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  listMovies,
  getMovieById,
  createMovie,
  updateMovie,
  toggleMovieStatus,
  deleteMovie,
  getTrendingMovies,
  incrementViewCount,
  getMostPopularMovies,
  getTopRatedMovies,
};
