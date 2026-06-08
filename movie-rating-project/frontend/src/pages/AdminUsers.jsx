import React, { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";

const roles = ["customer", "staff", "admin"];

const AdminUsers = ({ currentUser }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
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
    const fetchUsers = async () => {
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
          search,
          ...(roleFilter !== "all" ? { role: roleFilter } : {}),
        };

        const response = await api.get("/admin/users", { params });
        setUsers(response.data.users || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } catch (err) {
        const apiMessage = err?.response?.data?.message;
        setError(apiMessage || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [page, limit, search, roleFilter, token]);

  const handleRoleChange = async (userId, role) => {
    setError("");
    setMessage("");

    try {
      const response = await api.patch(`/admin/users/${userId}/role`, { role });
      setUsers((prev) =>
        prev.map((user) => (user._id === userId ? response.data.user : user))
      );
      setMessage("Role updated");
    } catch (err) {
      const apiMessage = err?.response?.data?.message;
      setError(apiMessage || "Failed to update role");
    }
  };

  const handleStatusChange = async (userToUpdate, nextStatus) => {
    if (!nextStatus) {
      const shouldDeactivate = window.confirm(
        `Deactivate ${userToUpdate.name} (${userToUpdate.email})?`
      );

      if (!shouldDeactivate) {
        return;
      }
    }

    setError("");
    setMessage("");

    try {
      const response = await api.patch(
        `/admin/users/${userToUpdate._id}/status`,
        { isActive: nextStatus }
      );
      setUsers((prev) =>
        prev.map((user) =>
          user._id === userToUpdate._id ? response.data.user : user
        )
      );
      setMessage("Status updated");
    } catch (err) {
      const apiMessage = err?.response?.data?.message;
      setError(apiMessage || "Failed to update status");
    }
  };

  const handleDelete = async (userToDelete) => {
    const shouldDelete = window.confirm(
      `Delete user ${userToDelete.name} (${userToDelete.email})?`
    );

    if (!shouldDelete) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await api.delete(`/admin/users/${userToDelete._id}`);
      setUsers((prev) => prev.filter((user) => user._id !== userToDelete._id));
      setMessage("User deleted");
    } catch (err) {
      const apiMessage = err?.response?.data?.message;
      setError(apiMessage || "Failed to delete user");
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
          <h2>Admin Users</h2>
          <p className="admin-subtitle">Manage roles and access.</p>
        </div>
        <form className="admin-search" onSubmit={handleSearchSubmit}>
          <input
            type="search"
            placeholder="Search name or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">All roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <button type="submit" className="ghost-button">
            Search
          </button>
        </form>
      </div>

      {message && <p className="status-success">{message}</p>}
      {error && <p className="status-error">{error}</p>}

      <div className="admin-card">
        {loading ? (
          <p className="admin-muted">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="admin-muted">No users found.</p>
        ) : (
          <div className="admin-table">
            <div className="admin-row admin-head">
              <span>Name</span>
              <span>Email</span>
              <span>Role</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {users.map((user) => {
              const isActive = user.isActive !== false;

              return (
                <div className="admin-row" key={user._id}>
                  <span>{user.name}</span>
                  <span>{user.email}</span>
                  <span className="role-cell">
                    <span className={`role-badge role-${user.role}`}>
                      {user.role}
                    </span>
                    <select
                      value={user.role}
                      onChange={(event) =>
                        handleRoleChange(user._id, event.target.value)
                      }
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </span>
                  <span className="status-cell">
                    <span
                      className={`role-badge status-${
                        isActive ? "active" : "inactive"
                      }`}
                    >
                      {isActive ? "Active" : "Inactive"}
                    </span>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => handleStatusChange(user, !isActive)}
                    >
                      {isActive ? "Deactivate" : "Activate"}
                    </button>
                  </span>
                  <span>
                    <button
                      type="button"
                      className="ghost-button danger"
                      onClick={() => handleDelete(user)}
                    >
                      Delete
                    </button>
                  </span>
                </div>
              );
            })}
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

export default AdminUsers;
