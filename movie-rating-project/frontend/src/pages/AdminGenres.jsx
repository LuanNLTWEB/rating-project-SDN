import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CustomSelect from "../components/CustomSelect.jsx";

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

  const token = useMemo(() => localStorage.getItem("token"), []);
  const baseURL = import.meta.env.VITE_API_URL;
  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  const listPath = currentUser?.role === "admin" ? "/admin/genres" : "/staff/genres";
  const apiPrefix = currentUser?.role === "admin" ? "admin" : "staff";

  useEffect(() => {
    if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "staff")) {
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

        const response = await axios.get(`${baseURL}/${apiPrefix}/genres`, {
          headers,
          params,
        });
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
  }, [page, limit, search, statusFilter, token, baseURL, headers, apiPrefix]);

  const handleToggleStatus = async (genre) => {
    setError("");
    setMessage("");

    try {
      const response = await axios.patch(
        `${baseURL}/${apiPrefix}/genres/${genre._id}/toggle-status`,
        {},
        { headers }
      );
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
      await axios.delete(`${baseURL}/${apiPrefix}/genres/${genre._id}`, { headers });
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
            <CustomSelect
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
              options={[
                { value: "all", label: "All" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" }
              ]}
              placeholder="All"
            />
            <button type="submit" className="ghost-button">Search</button>
          </form>
          <button
            type="button"
            className="primary-button"
            onClick={() => navigate(`${listPath}/create`)}
          >
            + New Genre
          </button>
        </div>
      </div>

      {message && <p className="status-success">{message}</p>}
      {error && <p className="status-error">{error}</p>}

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
                    onClick={() => navigate(`${listPath}/edit/${genre._id}`)}
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
