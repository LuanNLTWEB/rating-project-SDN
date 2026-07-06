import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { AlertTriangle, ThumbsUp, Heart, Smile, HelpCircle, MessageSquare } from "lucide-react";

const StaffDashboard = () => {
  const [usersData, setUsersData] = useState(null);
  const [reviewsData, setReviewsData] = useState(null);
  const [moviesData, setMoviesData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, reviewsRes, moviesRes] = await Promise.all([
          api.get("/analytics/users"),
          api.get("/analytics/reviews"),
          api.get("/analytics/movies")
        ]);
        setUsersData(usersRes.data);
        setReviewsData(reviewsRes.data);
        setMoviesData(moviesRes.data);
      } catch (error) {
        console.error("Failed to load staff analytics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="admin-shell" style={{ padding: "3rem", textAlign: "center" }}>Loading dashboard...</div>;
  }

  if (!reviewsData || !moviesData || !usersData) {
    return <div className="admin-shell" style={{ padding: "3rem", textAlign: "center", color: "var(--danger)" }}>Failed to load dashboard.</div>;
  }

  const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#6366f1", "#ec4899"];
  const STATUS_COLORS = ["#0ea5e9", "#f59e0b", "#ef4444"];
  const BAR_COLORS = "#e63946";

  const userPieData = [
    { name: "Active", value: usersData.statusDistribution.active },
    { name: "Muted", value: usersData.statusDistribution.muted },
    { name: "Inactive", value: usersData.statusDistribution.inactive },
  ];

  return (
    <div className="admin-shell">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h2 style={{ margin: 0, color: "var(--primary)" }}>Staff Dashboard</h2>
        <div style={{ display: "flex", gap: "1rem" }}>
          <span style={{ fontSize: "1rem", fontWeight: "600", background: "#fdf0ee", padding: "8px 16px", borderRadius: "8px", color: "var(--primary)" }}>
            Total Users: {usersData.totalUsers}
          </span>
          <span style={{ fontSize: "1rem", fontWeight: "600", background: "#e0f2fe", padding: "8px 16px", borderRadius: "8px", color: "#0284c7" }}>
            Total Movies: {moviesData.totalMovies}
          </span>
          <span style={{ fontSize: "1rem", fontWeight: "600", background: "#fef3c7", padding: "8px 16px", borderRadius: "8px", color: "#d97706" }}>
            Total Reviews: {reviewsData.totalReviews}
          </span>
        </div>
      </div>

      {/* ANOMALY ALERTS */}
      {reviewsData.anomalies.length > 0 && (
        <div className="admin-card" style={{ padding: "1.5rem", marginBottom: "2rem", border: "2px solid #ef4444", background: "#fef2f2" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem", color: "#b91c1c" }}>
            <AlertTriangle size={24} />
            <h3 style={{ margin: 0 }}>Review Bombing Alert!</h3>
          </div>
          <p style={{ margin: "0 0 1rem 0", color: "#991b1b" }}>The following movies have received an unusually high number of 1-star reviews in the last 24 hours.</p>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Movie</th>
                <th>1-Star Reviews (24h)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reviewsData.anomalies.map(anomaly => (
                <tr key={anomaly.movieId}>
                  <td><strong>{anomaly.movieName}</strong></td>
                  <td style={{ color: "#ef4444", fontWeight: "bold" }}>{anomaly.oneStarCount} reviews</td>
                  <td>
                    <Link to={`/movies/${anomaly.movieId}`} className="ghost-button" style={{ fontSize: "0.8rem", padding: "4px 8px", color: "#0369a1" }}>Check Reviews</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ROW 1: USER ANALYTICS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
        <div className="admin-card" style={{ padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1.5rem 0", color: "var(--ink)" }}>User Growth (Last 30 Days)</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={usersData.growth} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <Line type="monotone" dataKey="users" stroke="#e63946" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-card" style={{ padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1.5rem 0", color: "var(--ink)" }}>Account Status Distribution</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {userPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROW 2: REVIEW TRAFFIC & ENGAGEMENT */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
        <div className="admin-card" style={{ padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1.5rem 0", color: "var(--ink)" }}>Review Traffic (Last 30 Days)</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reviewsData.traffic} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <Line type="monotone" dataKey="reviews" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-card" style={{ padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1.5rem 0", color: "var(--ink)" }}>Community Engagement</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f3f4f6", padding: "12px", borderRadius: "8px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "600", color: "#4b5563" }}><ThumbsUp size={18} /> Helpful</span>
              <span style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{reviewsData.engagement.totalHelpful}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f3f4f6", padding: "12px", borderRadius: "8px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "600", color: "#4b5563" }}><Heart size={18} /> Nice</span>
              <span style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{reviewsData.engagement.totalNice}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f3f4f6", padding: "12px", borderRadius: "8px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "600", color: "#4b5563" }}><Smile size={18} /> Funny</span>
              <span style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{reviewsData.engagement.totalFunny}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f3f4f6", padding: "12px", borderRadius: "8px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "600", color: "#4b5563" }}><HelpCircle size={18} /> Confusing</span>
              <span style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{reviewsData.engagement.totalConfusing}</span>
            </div>
          </div>
        </div>
      </div>

      {/* DATA INTEGRITY CHECK */}
      <div className="admin-card" style={{ padding: "1.5rem" }}>
        <h3 style={{ margin: "0 0 1rem 0", color: "var(--ink)" }}>Data Integrity Alerts</h3>
        <p style={{ margin: "0 0 1.5rem 0", color: "var(--muted)", fontSize: "0.95rem" }}>
          The following movies are missing crucial information (poster, summary, or genres). Please update them.
        </p>
        
        {moviesData.missingData.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", background: "#f0fdf4", color: "#166534", borderRadius: "8px" }}>
            All movies have complete information! Great job!
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Movie Name</th>
                <th>Missing Information</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {moviesData.missingData.map(movie => {
                const missing = [];
                if (!movie.poster) missing.push("Poster");
                if (!movie.banner) missing.push("Background (Banner)");
                if (!movie.summary) missing.push("Summary");
                if (!movie.genres || movie.genres.length === 0) missing.push("Genres");
                
                return (
                  <tr key={movie._id}>
                    <td><strong>{movie.name}</strong></td>
                    <td style={{ color: "#d97706" }}>{missing.join(", ")}</td>
                    <td>
                      <Link to={`/staff/movies/edit/${movie._id}`} className="primary-button" style={{ fontSize: "0.8rem", padding: "6px 12px" }}>
                        Edit Movie
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
