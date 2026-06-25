import React, { useState, useEffect, useRef } from "react";

const CustomSelect = ({ value, onChange, options, placeholder, style, buttonStyle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={dropdownRef} style={{ position: "relative", display: "inline-block", ...style }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: "0.55rem 1.2rem",
          borderRadius: "999px",
          border: "1px solid #d8c6b3",
          background: "#fffaf3",
          fontSize: "0.95rem",
          minWidth: "130px",
          textAlign: "left",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          color: "var(--ink)",
          fontFamily: "inherit",
          width: "100%",
          ...buttonStyle
        }}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <span style={{ marginLeft: "8px", fontSize: "0.8rem", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
      </button>
      {isOpen && (
        <div
          className="custom-select-menu"
          style={{
            position: "absolute",
            top: "110%",
            left: 0,
            minWidth: "100%",
            background: "#fffaf3",
            border: "1px solid #d8c6b3",
            borderRadius: "12px",
            boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
            zIndex: 100,
            maxHeight: "220px",
            overflowY: options.length > 5 ? "auto" : "hidden",
            marginTop: "4px"
          }}
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              style={{
                padding: "0.6rem 1rem",
                cursor: "pointer",
                background: value === opt.value ? "var(--primary)" : "transparent",
                color: value === opt.value ? "#fff" : "var(--ink)",
                fontSize: "0.95rem",
                transition: "background 0.2s, color 0.2s",
                whiteSpace: "nowrap"
              }}
              onMouseEnter={(e) => {
                if (value !== opt.value) {
                  e.target.style.background = "#ead6c3";
                }
              }}
              onMouseLeave={(e) => {
                if (value !== opt.value) {
                  e.target.style.background = "transparent";
                }
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
