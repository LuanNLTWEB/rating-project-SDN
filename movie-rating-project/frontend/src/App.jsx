import React, { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import axios from "axios";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import AdminAuditLogs from "./pages/AdminAuditLogs.jsx";
import AdminGenres from "./pages/AdminGenres.jsx";

const App = () => {
  const [status, setStatus] = useState("Checking...");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/status`
        );
        setStatus(`Connected: ${response.data.message}`);
      } catch (error) {
        setStatus("Failed to connect to backend");
      }
    };

    checkStatus();
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-top">
          <div className="brand">
            <img className="brand-logo" src="/logo.png" alt="AniMê logo" />
            <h1 className="app-title">AniMê</h1>
          </div>
          <div className="header-actions">
            {!user && (
              <div className="auth-links">
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </div>
            )}
            {user && (
              <div className="user-meta">
                <span>Hi, {user.name}</span>
                <button type="button" className="ghost-button" onClick={handleLogout}>
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
        {user?.role !== "admin" ? (
          <nav className="nav-links nav-secondary">
            <Link to="/">Home</Link>
            <div className="nav-dropdown">
              <button type="button" className="nav-link nav-trigger">
                Anime
              </button>
              <div className="dropdown-menu" role="menu">
                <button type="button" className="dropdown-item" role="menuitem">
                  Tìm kiếm Anime
                </button>
                <button type="button" className="dropdown-item" role="menuitem">
                  Anime theo mùa
                </button>
                <button type="button" className="dropdown-item" role="menuitem">
                  Anime hay nhất
                </button>
                <button type="button" className="dropdown-item" role="menuitem">
                  Những bộ Anime nên coi
                </button>
              </div>
            </div>
          </nav>
        ) : (
          <nav className="nav-links nav-secondary">
            <Link to="/admin/users">Users</Link>
            <Link to="/admin/genres">Genres</Link>
            <Link to="/admin/audit">Audit Logs</Link>
          </nav>
        )}
      </header>

      <main className="app-main">
        <Routes>
          {user?.role === "admin" ? (
            <>
              <Route
                path="/admin/users"
                element={<AdminUsers currentUser={user} />}
              />
              <Route
                path="/admin/genres"
                element={<AdminGenres currentUser={user} />}
              />
              <Route
                path="/admin/audit"
                element={<AdminAuditLogs currentUser={user} />}
              />
              <Route path="*" element={<Navigate to="/admin/users" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<Home status={status} />} />
              <Route path="/login" element={<Login onLogin={setUser} />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </main>
    </div>
  );
};

export default App;
