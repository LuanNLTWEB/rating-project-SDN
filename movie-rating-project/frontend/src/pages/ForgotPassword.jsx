import React, { useState } from "react";
import { api } from "../services/api";
import { Link } from "react-router-dom";
import rateSmarter from "../assets/lupa-wuwa-wuwa.gif";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/forgot-password", { email });
      setMessage(response.data.message);
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
        <h2>Forgot Password</h2>
        <p className="auth-subtitle">Enter your email and we'll send you a reset link.</p>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        {message && <p className="status-success">{message}</p>}
        {error && <p className="status-error">{error}</p>}
        <p className="helper-text">
          Remember your password? <Link to="/login">Back to Login</Link>
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

export default ForgotPassword;
