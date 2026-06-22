import React, { useState } from "react";
import { api } from "../services/api";
import { Link } from "react-router-dom";
import rateSmarter from "../assets/anime.gif";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      await api.post("/register", {
        name,
        email,
        password,
        passwordConfirm,
        gender,
        dateOfBirth,
      });
      setMessage("Register successful");
      setName("");
      setEmail("");
      setPassword("");
      setPasswordConfirm("");
      setGender("");
      setDateOfBirth("");
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
          <div className="field">
            <label>Confirm Password</label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              required
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="field">
            <label>Date of Birth</label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
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
        <img 
          src={rateSmarter} 
          alt="Build your profile" 
          style={{ width: "80%", borderRadius: "8px", mixBlendMode: "lighten" }}
        />
      </aside>
    </section>
  );
};

export default Register;
