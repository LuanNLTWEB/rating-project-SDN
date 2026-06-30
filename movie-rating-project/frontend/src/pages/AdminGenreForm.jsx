import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";

const AdminGenreForm = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [error, setError] = useState("");

  const token = useMemo(() => localStorage.getItem("token"), []);
  const baseURL = import.meta.env.VITE_API_URL;
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const listPath = currentUser?.role === "admin" ? "/admin/genres" : "/staff/genres";
  const apiPrefix = currentUser?.role === "admin" ? "admin" : "staff";

  useEffect(() => {
    if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "staff")) {
      navigate("/");
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (isEditMode) {
      fetchGenreDetails();
    }
  }, [id]);

  const fetchGenreDetails = async () => {
    setLoading(true);
    try {
      // Endpoint is public or role-based, let's use the role-based one
      const response = await axios.get(`${baseURL}/${apiPrefix}/genres`, {
        headers,
      });
      const allGenres = response.data.genres || [];
      const genre = allGenres.find(g => g._id === id);
      if (genre) {
        setFormName(genre.name);
        setFormDescription(genre.description || "");
      } else {
        setError("Genre not found.");
      }
    } catch (err) {
      setError("Failed to load genre details.");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formName.trim()) {
      setError("Genre name is required");
      return;
    }

    try {
      if (isEditMode) {
        await axios.put(
          `${baseURL}/${apiPrefix}/genres/${id}`,
          { name: formName.trim(), description: formDescription.trim() },
          { headers }
        );
      } else {
        await axios.post(
          `${baseURL}/${apiPrefix}/genres`,
          { name: formName.trim(), description: formDescription.trim() },
          { headers }
        );
      }
      navigate(listPath);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save genre");
    }
  };

  if (loading && isEditMode) {
    return <div className="admin-shell"><p>Loading genre details...</p></div>;
  }

  return (
    <section className="admin-shell">
      <div className="admin-header">
        <div>
          <h2>{isEditMode ? "Edit Genre" : "Create New Genre"}</h2>
          <p className="admin-subtitle">{isEditMode ? "Update details for this genre." : "Add a new movie genre category."}</p>
        </div>
        <div>
          <Link to={listPath} className="ghost-button">← Back to List</Link>
        </div>
      </div>

      {error && <p className="status-error">{error}</p>}

      <div className="admin-card">
        <form className="form-grid" onSubmit={handleFormSubmit}>
          <div className="field">
            <label>Name <span style={{ color: "red" }}>*</span></label>
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
              rows={5}
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
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <button type="submit" className="primary-button">
              {isEditMode ? "Update" : "Create"}
            </button>
            <Link to={listPath} className="ghost-button">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
};

export default AdminGenreForm;
