import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

const AdminGenres = ({ currentUser }) => {
  const navigate = useNavigate();
  const [genres, setGenres] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingGenre, setEditingGenre] = useState(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const token = useMemo(() => localStorage.getItem("token"), []);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      navigate("/");
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    const fetchGenres = async () => {
      if (!token) return;

      setLoading(true);
      setError("");

      try {
        const params = {
          page,
          limit,
          search,
          ...(statusFilter !== "all" ? { status: statusFilter } : {}),
        };

        const response = await api.get("/admin/genres", { params });
        setGenres(response.data.genres || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } catch (err) {
        const apiMessage = err?.response?.data?.message;
        setError(apiMessage || "Failed to load genres");
      } finally {
        setLoading(false);
      }
    };

    fetchGenres();
  }, [page, limit, search, statusFilter, token]);

  const resetForm = () => {
    setShowForm(false);
    setEditingGenre(null);
    setFormName("");
    setFormDescription("");
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (genre) => {
    setEditingGenre(genre);
    setFormName(genre.name);
    setFormDescription(genre.description || "");
    setShowForm(true);
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!formName.trim()) {
      setError("Genre name is required");
      return;
    }

    try {
      if (editingGenre) {
        const response = await api.put(`/admin/genres/${editingGenre._id}`, {
          name: formName.trim(),
          description: formDescription.trim(),
        });
        setGenres((prev) =>
          prev.map((g) => (g._id === editingGenre._id ? response.data.genre : g))
        );
        setMessage("Genre updated");
      } else {
        const response = await api.post("/admin/genres", {
          name: formName.trim(),
          description: formDescription.trim(),
        });
        setGenres((prev) => [response.data.genre, ...prev]);
        setMessage("Genre created");
      }
      resetForm();
    } catch (err) {
      const apiMessage = err?.response?.data?.message;
      setError(apiMessage || "Failed to save genre");
    }
  };

  const handleToggleStatus = async (genre) => {
    setError("");
    setMessage("");

    try {
      const response = await api.patch(`/admin/genres/${genre._id}/toggle-status`);
      setGenres((prev) =>
        prev.map((g) => (g._id === genre._id ? response.data.genre : g))
      );
      setMessage(response.data.message);
    } catch (err) {
      const apiMessage = err?.response?.data?.message;
      setError(apiMessage || "Failed to toggle genre status");
    }
  };

  const handleDelete = async (genre) => {
    const shouldDelete = window.confirm(
      `Delete genre "${genre.name}"? This action cannot be undone.`
    );

    if (!shouldDelete) return;

    setError("");
    setMessage("");

    try {
      await api.delete(`/admin/genres/${genre._id}`);
      setGenres((prev) => prev.filter((g) => g._id !== genre._id));
      setMessage("Genre deleted");
    } catch (err) {
      const apiMessage = err?.response?.data?.message;
      setError(apiMessage || "Failed to delete genre");
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(1);
  };

  return (
    <section className="admin-shell">
      <div className="admin-header">
        <div>
          <h2>Genre Management</h2>
          <p className="admin-subtitle">Add, edit, hide/show, and delete movie genres.</p>
        </div>
        <div className="admin-search">
          <form onSubmit={handleSearchSubmit} style={{ display: "contents" }}>
            <input
              type="search"
              placeholder="Search genre name"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button type="submit" className="ghost-button">Search</button>
          </form>
          <button type="button" className="primary-button" onClick={openCreateForm}>
            + New Genre
          </button>
        </div>
      </div>

      {message && <p className="status-success">{message}</p>}
      {error && <p className="status-error">{error}</p>}

      {showForm && (
        <div className="admin-card">
          <h3>{editingGenre ? "Edit Genre" : "New Genre"}</h3>
          <form className="form-grid" onSubmit={handleFormSubmit}>
            <div className="field">
              <label>Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Action, Comedy, Drama"
                required
              />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Brief description of this genre"
                rows={3}
                style={{
                  padding: "0.7rem 0.9rem",
                  borderRadius: "12px",
                  border: "1px solid #d8c6b3",
                  fontSize: "1rem",
                  background: "#fffaf3",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="submit" className="primary-button">
                {editingGenre ? "Update" : "Create"}
              </button>
              <button type="button" className="ghost-button" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-card">
        {loading ? (
          <p className="admin-muted">Loading genres...</p>
        ) : genres.length === 0 ? (
          <p className="admin-muted">No genres found.</p>
        ) : (
          <div className="admin-table">
            <div className="admin-row admin-head">
              <span>Name</span>
              <span>Slug</span>
              <span>Status</span>
              <span>Created</span>
              <span>Actions</span>
            </div>
            {genres.map((genre) => (
              <div className="admin-row" key={genre._id}>
                <span>{genre.name}</span>
                <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                  {genre.slug}
                </span>
                <span>
                  <span
                    className={`role-badge status-${genre.isActive ? "active" : "inactive"}`}
                  >
                    {genre.isActive ? "Active" : "Inactive"}
                  </span>
                </span>
                <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                  {new Date(genre.createdAt).toLocaleDateString()}
                </span>
                <span style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => openEditForm(genre)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => handleToggleStatus(genre)}
                  >
                    {genre.isActive ? "Hide" : "Show"}
                  </button>
                  <button
                    type="button"
                    className="ghost-button danger"
                    onClick={() => handleDelete(genre)}
                  >
                    Delete
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="admin-pagination">
        <button
          type="button"
          className="ghost-button"
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page <= 1}
        >
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className="ghost-button"
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </section>
  );
};

export default AdminGenres;
