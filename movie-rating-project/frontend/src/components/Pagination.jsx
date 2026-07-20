import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 0) return null;

  const getPages = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const pages = getPages();
  const btnBase = {
    border: "1px solid #ead6c3",
    borderRadius: "8px",
    padding: "6px 12px",
    fontSize: "0.85rem",
    cursor: "pointer",
    background: "#fff",
    color: "var(--ink)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "36px",
    height: "36px",
    transition: "all 0.15s",
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", marginTop: "2rem", flexWrap: "wrap" }}>
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        style={{ ...btnBase, opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? "default" : "pointer" }}
      >
        <ChevronLeft size={16} />
      </button>

      {pages[0] > 1 && (
        <>
          <button onClick={() => onPageChange(1)} style={btnBase}>1</button>
          {pages[0] > 2 && <span style={{ color: "var(--muted)", padding: "0 4px" }}>...</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          style={{
            ...btnBase,
            background: p === currentPage ? "var(--primary)" : "#fff",
            color: p === currentPage ? "#fff" : "var(--ink)",
            borderColor: p === currentPage ? "var(--primary)" : "#ead6c3",
            fontWeight: p === currentPage ? "600" : "400",
          }}
        >
          {p}
        </button>
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span style={{ color: "var(--muted)", padding: "0 4px" }}>...</span>}
          <button onClick={() => onPageChange(totalPages)} style={btnBase}>{totalPages}</button>
        </>
      )}

      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        style={{ ...btnBase, opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? "default" : "pointer" }}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

export default Pagination;
