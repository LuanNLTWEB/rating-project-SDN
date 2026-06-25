import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Calendar, Tag, User, ExternalLink, Search } from "lucide-react";
import { Link } from "react-router-dom";

export default function NewsList() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await api.get("/news");
        setNews(res.data);
      } catch (err) {
        console.error("Error fetching news:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  if (loading) {
    return (
      <section className="admin-shell" style={{ textAlign: "center", padding: "4rem" }}>
        <p className="admin-subtitle">Loading the hottest anime news...</p>
      </section>
    );
  }

  const filteredNews = news.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      (item.summary && item.summary.toLowerCase().includes(query)) ||
      (item.content && item.content.toLowerCase().includes(query)) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query)))
    );
  });

  return (
    <section>
      <div className="hero" style={{ padding: "3rem 1.5rem", marginBottom: "2.5rem", position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>Anime News Portal</h2>
          <p style={{ margin: 0 }}>Get the latest, exclusive news about Anime, Manga, and Otaku culture.</p>
        </div>
        
        {/* Search Bar */}
        <div style={{ position: "relative", width: "100%", maxWidth: "400px" }}>
          <input 
            type="text" 
            placeholder="Search anime news..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              padding: "0.8rem 1rem 0.8rem 2.8rem",
              width: "100%",
              borderRadius: "12px",
              border: "1px solid #d8c6b3",
              background: "#fffaf3",
              fontSize: "0.95rem",
              outline: "none",
              transition: "border-color 0.2s"
            }}
            onFocus={e => e.target.style.borderColor = "var(--primary)"}
            onBlur={e => e.target.style.borderColor = "#d8c6b3"}
          />
          <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
        </div>
      </div>

      <div style={{ border: "none", boxShadow: "none", padding: 0, background: "transparent" }}>
        {filteredNews.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", background: "var(--card)", borderRadius: "var(--radius)", border: "1px solid #eed7c2" }}>
            <p className="admin-subtitle">No news articles found matching "{searchQuery}".</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "2rem" }}>
            
            {/* Top Hot News */}
            {filteredNews.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
                {filteredNews.slice(0, 3).map((item, index) => (
                  <Link 
                    key={item._id} 
                    to={`/news/${item._id}`}
                    className="admin-card" 
                    style={{ 
                      padding: "1rem", 
                      display: "flex", 
                      flexDirection: "column", 
                      gap: "1rem", 
                      border: "1px solid #eed7c2", 
                      boxShadow: "none",
                      textDecoration: "none",
                      color: "inherit"
                    }}
                  >
                    <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: "8px", overflow: "hidden", backgroundColor: "#eae0d5" }}>
                      <img 
                        src={(item.imageUrls && item.imageUrls.length > 0) ? (item.imageUrls[0].startsWith("/uploads/") ? `http://localhost:5000${item.imageUrls[0]}` : item.imageUrls[0]) : "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800"} 
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                      />
                      {index === 0 && (
                        <span style={{ position: "absolute", top: "10px", left: "10px", background: "var(--primary)", color: "#fff", padding: "4px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: "bold", textTransform: "uppercase" }}>
                          HOT NEWS
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
                      <div style={{ display: "flex", gap: "10px", marginBottom: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", color: "var(--muted)" }}>
                          <Calendar size={14} /> {new Date(item.publishedAt || item.createdAt).toLocaleDateString("en-US")}
                        </span>
                        {(item.sourceUrls && item.sourceUrls.length > 0) && (
                          <a href={item.sourceUrls[0]} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", color: "var(--primary)", fontWeight: "600", textDecoration: "none" }}>
                            <ExternalLink size={14} /> Source Link
                          </a>
                        )}
                      </div>
                      <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", color: "var(--ink)", lineHeight: "1.4" }}>{item.title}</h3>
                      <p style={{ margin: "0 0 1rem", fontSize: "0.9rem", color: "var(--muted)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.summary}</p>
                      
                      <div style={{ marginTop: "auto", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {item.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} style={{ background: "rgba(193, 91, 47, 0.1)", color: "var(--primary)", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "4px", fontWeight: "600", display: "flex", alignItems: "center", gap: "3px" }}>
                            <Tag size={10} /> {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Other Popular News */}
            {filteredNews.length > 3 && (
              <div style={{ marginTop: "2rem" }}>
                <h3 style={{ borderBottom: "2px solid var(--primary)", paddingBottom: "0.5rem", color: "var(--primary)", marginBottom: "1.5rem" }}>Other Popular News</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1.5rem" }}>
                  {filteredNews.slice(3).map((item) => (
                    <Link 
                      key={item._id} 
                      to={`/news/${item._id}`}
                      className="admin-card" 
                      style={{ 
                        padding: "0.75rem", 
                        display: "flex", 
                        flexDirection: "column", 
                        borderRadius: "12px", 
                        border: "1px solid #ead6c3", 
                        background: "#fff",
                        boxShadow: "none",
                        textDecoration: "none",
                        color: "inherit"
                      }}
                    >
                      <div style={{ position: "relative", width: "100%", height: "160px", borderRadius: "8px", overflow: "hidden", backgroundColor: "#eae0d5" }}>
                        <img 
                          src={(item.imageUrls && item.imageUrls.length > 0) ? (item.imageUrls[0].startsWith("/uploads/") ? `http://localhost:5000${item.imageUrls[0]}` : item.imageUrls[0]) : "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800"} 
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                      <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "8px" }}>
                          {item.tags.slice(0, 2).map((tag, i) => (
                            <span key={i} style={{ background: "rgba(193, 91, 47, 0.1)", color: "var(--primary)", fontSize: "0.7rem", padding: "2px 6px", borderRadius: "4px", fontWeight: "600" }}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <h4 style={{ margin: "0 0 0.5rem", fontSize: "1rem", fontWeight: "600", color: "var(--ink)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", height: "2.6rem", lineHeight: "1.3rem" }}>
                          {item.title}
                        </h4>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {item.summary}
                        </p>
                        
                        <div style={{ marginTop: "auto", paddingTop: "10px", borderTop: "1px solid #ead6c3", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "var(--muted)" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <User size={12} /> {item.authorName || item.author?.name || "Staff"}
                          </span>
                          {(item.sourceUrls && item.sourceUrls.length > 0) ? (
                            <a href={item.sourceUrls[0]} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", fontWeight: "600", display: "flex", alignItems: "center", gap: "2px", textDecoration: "none" }}>
                              Source <ExternalLink size={10} />
                            </a>
                          ) : (
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <Calendar size={12} /> {new Date(item.publishedAt || item.createdAt).toLocaleDateString("en-US")}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
