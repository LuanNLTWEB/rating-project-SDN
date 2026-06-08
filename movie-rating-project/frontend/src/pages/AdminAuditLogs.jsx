import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

const AdminAuditLogs = ({ currentUser }) => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [admin, setAdmin] = useState("");
  const [target, setTarget] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const token = useMemo(() => localStorage.getItem("token"), []);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      navigate("/");
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!token) {
        return;
      }

      setLoading(true);
      setError("");
      setMessage("");

      try {
        const params = {
          page,
          limit,
          ...(admin ? { admin } : {}),
          ...(target ? { target } : {}),
          ...(fromDate ? { from: fromDate } : {}),
        };

        const response = await api.get("/admin/audit-logs", { params });
        setLogs(response.data.logs || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } catch (err) {
        const apiMessage = err?.response?.data?.message;
        setError(apiMessage || "Failed to load audit logs");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [page, limit, admin, target, fromDate, token]);

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    setPage(1);
  };

  const formatDetails = (details) => {
    if (!details || typeof details !== "object") {
      return "-";
    }

    return JSON.stringify(details);
  };

  return (
    <section className="admin-shell">
      <div className="admin-header">
        <div>
          <h2>Audit Logs</h2>
          <p className="admin-subtitle">Track admin actions and changes.</p>
        </div>
        <form className="admin-search" onSubmit={handleFilterSubmit}>
          <input
            type="search"
            placeholder="Admin email"
            value={admin}
            onChange={(event) => setAdmin(event.target.value)}
          />
          <input
            type="search"
            placeholder="Target email"
            value={target}
            onChange={(event) => setTarget(event.target.value)}
          />
          <input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
          />
          <button type="submit" className="ghost-button">
            Filter
          </button>
        </form>
      </div>

      {message && <p className="status-success">{message}</p>}
      {error && <p className="status-error">{error}</p>}

      <div className="admin-card">
        {loading ? (
          <p className="admin-muted">Loading audit logs...</p>
        ) : logs.length === 0 ? (
          <p className="admin-muted">No audit logs found.</p>
        ) : (
          <div className="audit-table">
            <div className="audit-row audit-head">
              <span>Time</span>
              <span>Admin</span>
              <span>Action</span>
              <span>Target</span>
              <span>Details</span>
            </div>
            {logs.map((log) => (
              <div className="audit-row" key={log._id}>
                <span>{new Date(log.createdAt).toLocaleString()}</span>
                <span>{log.adminEmail}</span>
                <span>{log.action}</span>
                <span>{log.targetEmail}</span>
                <span className="audit-details">{formatDetails(log.details)}</span>
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

export default AdminAuditLogs;
