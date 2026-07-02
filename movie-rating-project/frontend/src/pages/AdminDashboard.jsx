import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/analytics/users");
        setData(res.data);
      } catch (error) {
        console.error("Failed to load user analytics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="admin-shell" style={{ padding: "3rem", textAlign: "center" }}>Loading dashboard...</div>;
  }

  if (!data) {
    return <div className="admin-shell" style={{ padding: "3rem", textAlign: "center", color: "var(--danger)" }}>Failed to load dashboard.</div>;
  }

  const COLORS = ["#0ea5e9", "#f59e0b", "#ef4444"];
  const pieData = [
    { name: "Active", value: data.statusDistribution.active },
    { name: "Muted", value: data.statusDistribution.muted },
    { name: "Inactive", value: data.statusDistribution.inactive },
  ];

  return (
    <div className="admin-shell">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h2 style={{ margin: 0, color: "var(--primary)" }}>Admin Dashboard</h2>
        <span style={{ fontSize: "1.1rem", fontWeight: "600", background: "#fdf0ee", padding: "8px 16px", borderRadius: "8px", color: "var(--primary)" }}>
          Total Users: {data.totalUsers}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
        {/* Growth Chart */}
        <div className="admin-card" style={{ padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1.5rem 0", color: "var(--ink)" }}>User Growth (Last 30 Days)</h3>
          <div style={{ height: 300 }}>
            {data.growth.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.growth} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <Line type="monotone" dataKey="users" stroke="#e63946" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>No new users in the last 30 days.</div>
            )}
          </div>
        </div>

        {/* Status Chart */}
        <div className="admin-card" style={{ padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1.5rem 0", color: "var(--ink)" }}>Account Status Distribution</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
