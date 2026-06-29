import React, { useState } from "react";
import { api } from "../services/api";
import { Link, useParams, useNavigate } from "react-router-dom";
import rateSmarter from "../assets/lupa-wuwa-wuwa.gif";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    if (password !== passwordConfirm) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post(`/reset-password/${token}`, { password, passwordConfirm });
      setMessage(response.data.message);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      const apiMessage = err?.response?.data?.message;
      setError(apiMessage || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-layout">
      <div className="auth-card">
        <h2>Reset Password</h2>
        <p className="auth-subtitle">Enter your new password.</p>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="field">
            <label>New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <div className="field">
            <label>Confirm Password</label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
        {message && <p className="status-success">{message}</p>}
        {error && <p className="status-error">{error}</p>}
        <p className="helper-text">
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
      <aside className="auth-aside">
        <img
          src={rateSmarter}
          alt="Rate smarter dashboard"
        />
      </aside>
    </section>
  );
};

export default ResetPassword;
