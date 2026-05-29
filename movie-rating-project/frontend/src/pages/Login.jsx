import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/login`,
        { email, password }
      );
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      if (onLogin) {
        onLogin(response.data.user);
      }
      setMessage("Login successful");
      navigate("/");
    } catch (err) {
      const apiMessage = err?.response?.data?.message;
      setError(apiMessage || "Login failed");
    }
  };

  return (
    <section className="auth-layout">
      <div className="auth-card">
        <h2>Login</h2>
        <p className="auth-subtitle">Welcome back. Please enter your details.</p>
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
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="primary-button">
            Login
          </button>
        </form>
        {message && <p className="status-success">{message}</p>}
        {error && <p className="status-error">{error}</p>}
        <p className="helper-text">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
      <aside className="auth-aside">
        <div>
          <h3>Rate smarter.</h3>
          <p>
            Track your watchlist, share reviews, and explore the community's
            top picks.
          </p>
        </div>
        <p>Access your dashboard the moment you log in.</p>
      </aside>
    </section>
  );
};

export default Login;
