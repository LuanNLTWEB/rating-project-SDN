const Genre = require("../models/Genre");
const AdminAuditLog = require("../models/AdminAuditLog");

const listGenres = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
    const search = (req.query.search || "").trim();
    const status = (req.query.status || "").trim();

    const filter = {};

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    if (!req.user) {
      filter.isActive = true;
    } else if (status === "active") {
      filter.isActive = true;
    } else if (status === "inactive") {
      filter.isActive = false;
    }

    const [genres, total] = await Promise.all([
      Genre.find(filter)
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Genre.countDocuments(filter),
    ]);

    return res.status(200).json({
      genres,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

const getGenreById = async (req, res) => {
  try {
    const genre = await Genre.findById(req.params.id);

    if (!genre) {
      return res.status(404).json({ message: "Genre not found" });
    }

    return res.status(200).json({ genre });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

const createGenre = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Genre name is required" });
    }

    const existing = await Genre.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: "Genre already exists" });
    }

    const genre = new Genre({ name: name.trim(), description });
    await genre.save();

    await AdminAuditLog.create({
      adminId: req.user._id,
      adminEmail: req.user.email,
      action: "create_genre",
      targetUserId: req.user._id,
      targetEmail: req.user.email,
      details: { genreId: genre._id, name: genre.name },
    });

    return res.status(201).json({
      message: "Genre created",
      genre: {
        _id: genre._id,
        name: genre.name,
        description: genre.description,
        slug: genre.slug,
        isActive: genre.isActive,
        createdAt: genre.createdAt,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Genre already exists" });
    }
    return res.status(500).json({ message: "Server error" });
  }
};

const updateGenre = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Genre name is required" });
    }

    const genre = await Genre.findById(req.params.id);
    if (!genre) {
      return res.status(404).json({ message: "Genre not found" });
    }

    const existing = await Genre.findOne({ name: name.trim(), _id: { $ne: req.params.id } });
    if (existing) {
      return res.status(400).json({ message: "Genre name already in use" });
    }

    const previousName = genre.name;
    genre.name = name.trim();
    if (description !== undefined) {
      genre.description = description;
    }
    await genre.save();

    await AdminAuditLog.create({
      adminId: req.user._id,
      adminEmail: req.user.email,
      action: "update_genre",
      targetUserId: req.user._id,
      targetEmail: req.user.email,
      details: { genreId: genre._id, previousName, newName: genre.name },
    });

    return res.status(200).json({
      message: "Genre updated",
      genre: {
        _id: genre._id,
        name: genre.name,
        description: genre.description,
        slug: genre.slug,
        isActive: genre.isActive,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Genre name already in use" });
    }
    return res.status(500).json({ message: "Server error" });
  }
};

const toggleGenreStatus = async (req, res) => {
  try {
    const genre = await Genre.findById(req.params.id);
    if (!genre) {
      return res.status(404).json({ message: "Genre not found" });
    }

    genre.isActive = !genre.isActive;
    await genre.save();

    await AdminAuditLog.create({
      adminId: req.user._id,
      adminEmail: req.user.email,
      action: genre.isActive ? "show_genre" : "hide_genre",
      targetUserId: req.user._id,
      targetEmail: req.user.email,
      details: { genreId: genre._id, name: genre.name, isActive: genre.isActive },
    });

    return res.status(200).json({
      message: genre.isActive ? "Genre is now visible" : "Genre is now hidden",
      genre: {
        _id: genre._id,
        name: genre.name,
        description: genre.description,
        slug: genre.slug,
        isActive: genre.isActive,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteGenre = async (req, res) => {
  try {
    const genre = await Genre.findByIdAndDelete(req.params.id);
    if (!genre) {
      return res.status(404).json({ message: "Genre not found" });
    }

    await AdminAuditLog.create({
      adminId: req.user._id,
      adminEmail: req.user.email,
      action: "delete_genre",
      targetUserId: req.user._id,
      targetEmail: req.user.email,
      details: { genreId: genre._id, name: genre.name, wasActive: genre.isActive },
    });

    return res.status(200).json({ message: "Genre deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  listGenres,
  getGenreById,
  createGenre,
  updateGenre,
  toggleGenreStatus,
  deleteGenre,
};
