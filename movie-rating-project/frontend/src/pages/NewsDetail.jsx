import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import { Calendar, User, ExternalLink, ArrowLeft } from "lucide-react";

export default function NewsDetail() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await api.get("/news");
        const found = res.data.find(n => n._id === id);
        setArticle(found);
      } catch (err) {
        console.error("Error fetching article:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  if (loading) {
    return <div className="admin-shell"><p className="admin-subtitle">Loading article...</p></div>;
  }

  if (!article) {
    return <div className="admin-shell"><p className="admin-subtitle text-center">Article not found.</p></div>;
  }

  return (
    <section>
      <div style={{ maxWidth: "100%", margin: "2rem auto", padding: 0 }}>
        
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "flex-start" }}>
          
          <div className="left-column" style={{ flex: "1 1 0%", minWidth: "0" }}>
            <div className="admin-card" style={{ padding: "2.5rem", margin: 0, border: "1px solid #eed7c2", boxShadow: "none" }}>
              <h2 style={{ fontSize: "2.5rem", margin: "0 0 1rem 0", color: "var(--ink)", lineHeight: "1.2" }}>{article.title}</h2>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem", fontSize: "0.9rem", color: "var(--muted)", borderBottom: "1px solid #ead6c3", paddingBottom: "1rem" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Calendar size={14} /> {new Date(article.publishedAt || article.createdAt).toLocaleDateString("en-US")}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <User size={14} /> {article.authorName || article.author?.name || "Staff Editor"}
                </span>
              </div>

              <div 
                className="news-content-body" 
                style={{ lineHeight: "1.8", fontSize: "1.1rem", color: "var(--ink)" }}
                dangerouslySetInnerHTML={{ __html: article.content || `<p>${article.summary}</p>` }} 
              />



              {article.videoUrls && article.videoUrls.length > 0 && (
                <div style={{ marginTop: "3rem", borderTop: "1px solid #ead6c3", paddingTop: "2rem" }}>
                  <h3 style={{ marginBottom: "1.5rem", color: "var(--ink)" }}>Related Videos</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                    {article.videoUrls.map((vidUrl, i) => {
                      let finalUrl = vidUrl;
                      try {
                        if (vidUrl.includes("youtube.com/watch")) {
                          const urlObj = new URL(vidUrl);
                          const videoId = urlObj.searchParams.get("v");
                          if (videoId) finalUrl = `https://www.youtube.com/embed/${videoId}`;
                        } else if (vidUrl.includes("youtu.be/")) {
                          const videoId = vidUrl.split("youtu.be/")[1]?.split("?")[0];
                          if (videoId) finalUrl = `https://www.youtube.com/embed/${videoId}`;
                        }
                      } catch(e) {}
                      
                      return (
                        <div key={i} style={{ position: "relative", width: "100%", paddingBottom: "56.25%", background: "#000", borderRadius: "12px", overflow: "hidden", border: "1px solid #eed7c2" }}>
                          <iframe 
                            src={finalUrl} 
                            title={article.title}
                            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #ead6c3", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {article.tags.map((tag, i) => (
                  <span key={i} style={{ background: "var(--primary)", color: "#fff", padding: "4px 12px", borderRadius: "999px", fontSize: "0.8rem", fontWeight: "bold" }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="right-column" style={{ flex: "0 0 350px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {article.sourceUrls && article.sourceUrls.length > 0 && (
              <div className="admin-card" style={{ padding: "1.5rem", margin: 0, border: "1px solid #eed7c2", boxShadow: "none" }}>
                <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "var(--ink)", borderBottom: "2px solid #ead6c3", paddingBottom: "0.5rem" }}>Sources</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                  {article.sourceUrls.map((s, i) => (
                    <a key={i} href={s} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--primary)", fontWeight: "600", textDecoration: "none", padding: "10px", background: "#fffaf3", borderRadius: "8px", border: "1px solid #ead6c3", transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#ffedd5"} onMouseLeave={e => e.currentTarget.style.background = "#fffaf3"}>
                      <ExternalLink size={16} /> Source Link {i + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {article.relatedArticles && article.relatedArticles.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {article.relatedArticles.map((rel, i) => (
                    <Link key={i} to={`/news/${rel._id}`} style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", gap: "8px", transition: "transform 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform = "translateX(4px)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}>
                      
                      {/* Image container with badge */}
                      <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%", backgroundColor: "#f0e6d2" }}>
                        <img 
                          src={(rel.imageUrls && rel.imageUrls.length > 0) ? (rel.imageUrls[0].startsWith("/uploads/") ? `http://localhost:5000${rel.imageUrls[0]}` : rel.imageUrls[0]) : "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400"} 
                          alt={rel.title} 
                          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} 
                        />
                        <div style={{ position: "absolute", top: 0, left: 0, background: "var(--primary)", color: "white", padding: "2px 8px", fontSize: "0.75rem", fontWeight: "bold", textTransform: "uppercase" }}>
                          News
                        </div>
                      </div>

                      {/* Title */}
                      <h4 style={{ fontSize: "1.05rem", margin: 0, color: "var(--primary)", fontWeight: "600", lineHeight: "1.3" }}>
                        {rel.title}
                      </h4>

                      {/* Metadata */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", fontSize: "0.75rem", color: "var(--muted)" }}>
                        <span>{new Date(rel.publishedAt || rel.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        {rel.tags && rel.tags.length > 0 && rel.tags.slice(0, 2).map((tag, tIdx) => (
                          <span key={tIdx} style={{ border: "1px solid #93c5fd", color: "#2563eb", padding: "0px 4px", borderRadius: "2px", fontSize: "0.65rem", background: "#eff6ff" }}>
                            {tag.toLowerCase()}
                          </span>
                        ))}
                      </div>

                      {/* Summary */}
                      {rel.summary && (
                        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: "1.4" }}>
                          {rel.summary}
                        </p>
                      )}

                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
}
