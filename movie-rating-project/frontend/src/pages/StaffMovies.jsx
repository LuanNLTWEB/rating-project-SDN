import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

const StaffMovies = ({ currentUser }) => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [globalError, setGlobalError] = useState("");

  const token = useMemo(() => localStorage.getItem("token"), []);
  const baseURL = import.meta.env.VITE_API_URL;
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "staff") {
      navigate("/");
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    fetchMovies();
  }, [page, search]);

  const fetchMovies = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/staff/movies`, {
        headers,
        params: { page, limit, search },
      });
      setMovies(response.data.movies || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (err) {
      setGlobalError(err?.response?.data?.message || "Failed to load movies");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (movie) => {
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '250px' }}>
        <p style={{ margin: 0, fontWeight: 600, color: 'var(--ink)' }}>Delete movie "{movie.name}"?</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button 
            className="ghost-button" 
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            onClick={() => toast.dismiss(t.id)}
          >
            Cancel
          </button>
          <button 
            className="primary-button danger" 
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: 'var(--danger)', boxShadow: 'none' }}
            onClick={async () => {
              toast.dismiss(t.id);
              const toastId = toast.loading("Deleting movie...");
              try {
                await axios.delete(`${baseURL}/staff/movies/${movie._id}`, { headers });
                toast.success("Deleted successfully!", { id: toastId });
                fetchMovies();
              } catch (err) {
                console.error(err);
                toast.error(err?.response?.data?.message || "Error deleting movie", { id: toastId });
              }
            }}
          >
            Delete
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const handleToggleStatus = async (movie) => {
    try {
      await axios.patch(`${baseURL}/staff/movies/${movie._id}/toggle-status`, {}, { headers });
      fetchMovies();
    } catch (err) {
      setGlobalError(err?.response?.data?.message || "Lỗi khi đổi trạng thái");
    }
  };

  return (
    <section className="admin-shell">
      <div className="admin-header">
        <div>
          <h2>Movie / Anime Management</h2>
          <p className="admin-subtitle">Add, edit, delete, and update Anime.</p>
        </div>
        <div className="admin-search">
          <input
            type="search"
            placeholder="Search movie name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="button" className="primary-button" onClick={() => navigate("/staff/movies/create")}>
            + Add Movie
          </button>
        </div>
      </div>

      {message && <p className="status-success">{message}</p>}
      {globalError && <p className="status-error">{globalError}</p>}

      <div className="admin-card">
        {loading ? <p>Loading data...</p> : (
          <div className="admin-table">
            <div className="admin-row admin-head">
              <span>Movie Title</span>
              <span>Status</span>
              <span>Visibility</span>
              <span>Release Date</span>
              <span>Actions</span>
            </div>
            {movies.length === 0 ? (
              <div style={{ padding: "20px", fontStyle: "italic", textAlign: "center", color: "var(--muted)" }}>
                No movies found.
              </div>
            ) : (
              movies.map(movie => (
                <div className="admin-row" key={movie._id}>
                  <span style={{ fontWeight: "bold" }}>{movie.name}</span>
                  <span>{movie.status === 'ongoing' ? 'Ongoing' : movie.status === 'completed' ? 'Completed' : 'Upcoming'}</span>
                  <span>
                    <span className={`role-badge status-${movie.isActive ? "active" : "inactive"}`}>
                      {movie.isActive ? "Visible" : "Hidden"}
                    </span>
                  </span>
                  <span style={{ color: "var(--muted)" }}>{new Date(movie.releaseDate).toLocaleDateString()}</span>
                  <span style={{ display: "flex", gap: "5px" }}>
                    <button className="ghost-button" onClick={() => navigate(`/staff/movies/edit/${movie._id}`)}>Edit</button>
                    <button className="ghost-button" onClick={() => handleToggleStatus(movie)}>
                      {movie.isActive ? "Hide" : "Show"}
                    </button>
                    <button className="ghost-button danger" onClick={() => handleDelete(movie)}>Delete</button>
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      
      <div className="admin-pagination">
        <button className="ghost-button" onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page <= 1}>Previous</button>
        <span>Page {page} of {totalPages}</span>
        <button className="ghost-button" onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page >= totalPages}>Next</button>
      </div>
    </section>
  );
};

export default StaffMovies;
