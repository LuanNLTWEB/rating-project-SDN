import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/register`, {
        name,
        email,
        password,
      });
      setMessage("Register successful");
      setName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      const apiMessage = err?.response?.data?.message;
      setError(apiMessage || "Register failed");
    }
  };

  return (
    <section className="auth-layout">
      <div className="auth-card">
        <h2>Create account</h2>
        <p className="auth-subtitle">Join the rating community in minutes.</p>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="field">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
            Register
          </button>
        </form>
        {message && <p className="status-success">{message}</p>}
        {error && <p className="status-error">{error}</p>}
        <p className="helper-text">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
      <aside className="auth-aside">
        <div>
          <h3>Build your profile.</h3>
          <p>
            Save your favorites, keep track of ratings, and unlock curated
            recommendations.
          </p>
        </div>
        <p>Your reviews shape the community.</p>
      </aside>
    </section>
  );
};

export default Register;
