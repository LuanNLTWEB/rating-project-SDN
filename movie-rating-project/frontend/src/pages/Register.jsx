import React, { useState, useMemo } from "react";
import { api } from "../services/api";
import { Link } from "react-router-dom";
import rateSmarter from "../assets/anime.gif";
import CustomSelect from "../components/CustomSelect.jsx";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/datepicker.css";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const thirteenYearsAgo = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 13);
    return d;
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!gender) {
      setError("Please select gender");
      return;
    }

    if (!dateOfBirth) {
      setError("Please select date of birth");
      return;
    }

    if (dateOfBirth > thirteenYearsAgo) {
      setError("Must be at least 13 years old");
      return;
    }

    const formattedDOB = `${dateOfBirth.getFullYear()}-${String(dateOfBirth.getMonth() + 1).padStart(2, '0')}-${String(dateOfBirth.getDate()).padStart(2, '0')}`;

    try {
      await api.post("/register", {
        name,
        email,
        password,
        passwordConfirm,
        gender,
        dateOfBirth: formattedDOB,
      });
      setMessage("Register successful");
      setName("");
      setEmail("");
      setPassword("");
      setPasswordConfirm("");
      setGender("");
      setDateOfBirth(null);
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
            <CustomSelect
              value={gender}
              onChange={setGender}
              options={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "other", label: "Other" }
              ]}
              placeholder="Select gender"
              style={{ width: "100%" }}
            />
          </div>
          <div className="field">
            <label>Date of Birth</label>
            <DatePicker
              showIcon
              selected={dateOfBirth}
              onChange={(date) => setDateOfBirth(date)}
              onKeyDown={(e) => e.preventDefault()}
              maxDate={thirteenYearsAgo}
              dateFormat="dd/MM/yyyy"
              placeholderText="dd/mm/yyyy"
              className="custom-datepicker"
              wrapperClassName="custom-datepicker-wrapper"
              showYearDropdown
              scrollableYearDropdown
              yearDropdownItemNumber={100}
              popperPlacement="bottom-end"
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
        />
      </aside>
    </section>
  );
};

export default Register;
