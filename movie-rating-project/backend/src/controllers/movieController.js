const Movie = require("../models/Movie");
const AdminAuditLog = require("../models/AdminAuditLog");

// Get all movies (Staff & Admin)
const listMovies = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
    
    const filter = {};
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: "i" };
    }

    // Force isActive: true for public endpoint
    if (!req.originalUrl.includes("/staff")) {
      filter.isActive = true;
    }

    if (req.query.genre) {
      filter.genres = req.query.genre;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.year) {
      const year = parseInt(req.query.year, 10);
      if (req.query.season) {
        let startMonth, endMonth, endDay, startYear = year, endYear = year;
        if (req.query.season === "Spring") {
          startMonth = 2; // March
          endMonth = 4;   // May
          endDay = 31;
        } else if (req.query.season === "Summer") {
          startMonth = 5; // June
          endMonth = 7;   // August
          endDay = 31;
        } else if (req.query.season === "Fall") {
          startMonth = 8; // September
          endMonth = 10;  // November
          endDay = 30;
        } else if (req.query.season === "Winter") {
          startMonth = 11; // December
          endMonth = 1;    // February of next year
          endDay = 29;
          endYear = year + 1;
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
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

const getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id)
      .populate("genres", "name")
      .populate("relatedMovies", "name poster")
      .populate("relatedNews", "title imageUrls summary");
    if (!movie) {
      return res.status(404).json({ message: "Không tìm thấy phim" });
    }
    return res.status(200).json({ movie });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

const createMovie = async (req, res) => {
  try {
    const { name, summary, trailer, releaseDate, totalEpisodes, status, isActive, genres, authors, type, producers, studios, trailers, relatedMovies, relatedNews, poster, banner } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ message: "Tên phim không được bỏ trống" });
    if (!summary || !summary.trim()) return res.status(400).json({ message: "Tóm tắt không được bỏ trống" });
    if (!releaseDate) return res.status(400).json({ message: "Ngày phát hành không được bỏ trống" });

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

    return res.status(201).json({ message: "Thêm phim thành công", movie });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

const updateMovie = async (req, res) => {
  try {
    const { name, summary, trailer, releaseDate, totalEpisodes, status, isActive, genres, authors, type, producers, studios, trailers, relatedMovies, relatedNews, poster, banner } = req.body;

    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: "Không tìm thấy phim" });

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

    return res.status(200).json({ message: "Cập nhật phim thành công", movie });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

const toggleMovieStatus = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: "Không tìm thấy phim" });

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

    return res.status(200).json({ message: movie.isActive ? "Phim đã được hiển thị" : "Phim đã bị ẩn", movie });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

const deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) return res.status(404).json({ message: "Không tìm thấy phim" });

    await AdminAuditLog.create({
      adminId: req.user._id,
      adminEmail: req.user.email,
      action: "delete_movie",
      targetUserId: req.user._id,
      targetEmail: req.user.email,
      details: { movieId: movie._id, name: movie.name },
    });

    return res.status(200).json({ message: "Xóa phim thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

module.exports = {
  listMovies,
  getMovieById,
  createMovie,
  updateMovie,
  toggleMovieStatus,
  deleteMovie,
};
