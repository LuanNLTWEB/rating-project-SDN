import React, { useEffect, useState } from "react";
import { Link, Route, Routes, useNavigate } from "react-router-dom";
import axios from "axios";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

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
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home status={status} />} />
          <Route path="/login" element={<Login onLogin={setUser} />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
