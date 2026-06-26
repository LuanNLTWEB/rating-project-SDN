import React, { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { api, clearSession } from "./services/api";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import AdminAuditLogs from "./pages/AdminAuditLogs.jsx";
import AdminGenres from "./pages/AdminGenres.jsx";
import AdminGenreForm from "./pages/AdminGenreForm.jsx";
import StaffMovies from "./pages/StaffMovies.jsx";
import StaffMovieForm from "./pages/StaffMovieForm.jsx";
import MovieDetail from "./pages/MovieDetail.jsx";
import NewsList from "./pages/NewsList.jsx";
import NewsDetail from "./pages/NewsDetail.jsx";
import StaffNewsDashboard from "./pages/StaffNewsDashboard.jsx";
import StaffNewsEditor from "./pages/StaffNewsEditor.jsx";
import Trending from "./pages/Trending.jsx";
import Favorites from "./pages/Favorites.jsx";
import WatchlistPage from "./pages/WatchlistPage.jsx";
import { Toaster } from "react-hot-toast";
import { Heart, Eye, Flame } from "lucide-react";

const App = () => {
  const [status, setStatus] = useState("Checking...");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await api.get("/status");
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
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      api.post("/logout", { refreshToken }).catch(() => null);
    }
    clearSession();
    setUser(null);
    navigate("/login");
  };

  const isLoggedIn = !!user;

  const publicRoutes = (
    <>
      <Route path="/" element={<Home status={status} />} />
      <Route path="/trending" element={<Trending />} />
      <Route path="/movies/:id" element={<MovieDetail currentUser={user} />} />
      <Route path="/news" element={<NewsList />} />
      <Route path="/news/:id" element={<NewsDetail />} />
    </>
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-top">
          <div className="brand">
            <img className="brand-logo" src="/logo.png" alt="AniMê logo" />
            <h1 className="app-title">AniMê</h1>
          </div>
          <div className="header-actions">
            {!isLoggedIn && (
              <div className="auth-links">
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </div>
            )}
            {isLoggedIn && (
              <div className="user-meta">
                <span>Hi, {user.name}</span>
                <button type="button" className="ghost-button" onClick={handleLogout}>
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>

        {user?.role === "admin" ? (
          <nav className="nav-links nav-secondary">
            <Link to="/admin/users">Users</Link>
            <Link to="/admin/audit">Audit Logs</Link>
            <Link to="/trending"><Flame size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />Trending</Link>
            <Link to="/favorites"><Heart size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />Favorites</Link>
            <Link to="/watchlist"><Eye size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />Watchlist</Link>
          </nav>
        ) : user?.role === "staff" ? (
          <nav className="nav-links nav-secondary">
            <Link to="/">Home</Link>
            <Link to="/staff/genres">Genres</Link>
            <Link to="/staff/movies">Movies</Link>
            <Link to="/staff/news">News CMS</Link>
            <Link to="/trending"><Flame size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />Trending</Link>
          </nav>
        ) : user?.role === "customer" ? (
          <nav className="nav-links nav-secondary">
            <Link to="/">Home</Link>
            <Link to="/news">News</Link>
            <Link to="/trending"><Flame size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />Trending</Link>
            <Link to="/favorites"><Heart size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />Favorites</Link>
            <Link to="/watchlist"><Eye size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />Watchlist</Link>
          </nav>
        ) : (
          <nav className="nav-links nav-secondary">
            <Link to="/">Home</Link>
            <Link to="/news">News</Link>
            <Link to="/trending"><Flame size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />Trending</Link>
          </nav>
        )}
      </header>

      <Toaster position="top-right" />
      <main className="app-main">
        <Routes>
          {user?.role === "admin" ? (
            <>
              {publicRoutes}
              <Route path="/favorites" element={<Favorites currentUser={user} />} />
              <Route path="/watchlist" element={<WatchlistPage currentUser={user} />} />
              <Route
                path="/admin/users"
                element={<AdminUsers currentUser={user} />}
              />
              <Route
                path="/admin/genres"
                element={<AdminGenres currentUser={user} />}
              />
              <Route
                path="/admin/genres/create"
                element={<AdminGenreForm currentUser={user} />}
              />
              <Route
                path="/admin/genres/edit/:id"
                element={<AdminGenreForm currentUser={user} />}
              />
              <Route
                path="/admin/audit"
                element={<AdminAuditLogs currentUser={user} />}
              />
              <Route path="*" element={<Navigate to="/admin/users" replace />} />
            </>
          ) : user?.role === "staff" ? (
            <>
              {publicRoutes}
              <Route path="/favorites" element={<Favorites currentUser={user} />} />
              <Route path="/watchlist" element={<WatchlistPage currentUser={user} />} />
              <Route
                path="/staff/genres"
                element={<AdminGenres currentUser={user} />}
              />
              <Route
                path="/staff/genres/create"
                element={<AdminGenreForm currentUser={user} />}
              />
              <Route
                path="/staff/genres/edit/:id"
                element={<AdminGenreForm currentUser={user} />}
              />
              <Route
                path="/staff/movies"
                element={<StaffMovies currentUser={user} />}
              />
              <Route
                path="/staff/movies/create"
                element={<StaffMovieForm currentUser={user} />}
              />
              <Route
                path="/staff/movies/edit/:id"
                element={<StaffMovieForm currentUser={user} />}
              />
              <Route
                path="/staff/news"
                element={<StaffNewsDashboard />}
              />
              <Route
                path="/staff/news/create"
                element={<StaffNewsEditor />}
              />
              <Route
                path="/staff/news/edit/:id"
                element={<StaffNewsEditor />}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : user?.role === "customer" ? (
            <>
              {publicRoutes}
              <Route path="/favorites" element={<Favorites currentUser={user} />} />
              <Route path="/watchlist" element={<WatchlistPage currentUser={user} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
              {publicRoutes}
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
