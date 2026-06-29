import React, { useState } from "react";
import { api } from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import rateSmarter from "../assets/lupa-wuwa-wuwa.gif";

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
      const response = await api.post("/login", { email, password });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("refreshToken", response.data.refreshToken);
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
          <Link to="/forgot-password" className="helper-link">Forgot password?</Link>
        </form>
        {message && <p className="status-success">{message}</p>}
        {error && <p className="status-error">{error}</p>}
        <p className="helper-text">
          New here? <Link to="/register">Create an account</Link>
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

export default Login;
