import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Plus, Edit, Trash2, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

export default function StaffNewsDashboard() {
  const [articles, setArticles] = useState([]);
  const [activeTab, setActiveTab] = useState("draft"); // 'draft' or 'published'
  const navigate = useNavigate();

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const res = await api.get(`/staff/news`);
      setArticles(res.data);
    } catch (err) {
      console.error("Error loading articles:", err);
    }
  };

  const handleCreateClick = () => {
    navigate("/staff/news/create");
  };

  const handleEditClick = (article) => {
    navigate(`/staff/news/edit/${article._id}`);
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '250px' }}>
        <p style={{ margin: 0, fontWeight: 600, color: 'var(--ink)' }}>Are you sure you want to delete this article?</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button 
            className="ghost-button" 
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            onClick={() => toast.dismiss(t.id)}
          >
            Cancel
          </button>
          <button 
            className="primary-button danger" 
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: 'var(--danger)', boxShadow: 'none' }}
            onClick={async () => {
              toast.dismiss(t.id);
              const toastId = toast.loading("Deleting article...");
              try {
                await api.delete(`/staff/news/${id}`);
                toast.success("Deleted successfully!", { id: toastId });
                fetchArticles();
              } catch (err) {
                console.error(err);
                toast.error("Error deleting article.", { id: toastId });
              }
            }}
          >
            Delete
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };



  const displayedArticles = articles.filter(a => a.status === activeTab);
  const draftCount = articles.filter(a => a.status === "draft").length;
  const publishedCount = articles.filter(a => a.status === "published").length;

  return (
    <section className="admin-shell">
      <div className="admin-header">
        <div>
          <h2>CMS - Anime News Management</h2>
          <p className="admin-subtitle">Review, create, and publish articles gathered from RSS feeds or written manually.</p>
        </div>
        <div className="admin-search">
          <button 
             className={activeTab === 'draft' ? "primary-button" : "ghost-button"}
             onClick={() => setActiveTab('draft')}
          >
             Drafts / Crawled ({draftCount})
          </button>
          <button 
             className={activeTab === 'published' ? "primary-button" : "ghost-button"}
             onClick={() => setActiveTab('published')}
          >
             Published ({publishedCount})
          </button>
          <button className="primary-button" onClick={handleCreateClick} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
             <Plus size={18} /> Add News
          </button>
        </div>
      </div>

      <div className="admin-card">
          <div className="admin-table">
            <div className="admin-row admin-head" style={{ gridTemplateColumns: "100px 2fr 1fr 150px" }}>
              <span>Cover</span>
              <span>Title & Summary</span>
              <span>Source</span>
              <span style={{ textAlign: "right" }}>Actions</span>
            </div>
            
            {displayedArticles.length === 0 ? (
              <div style={{ padding: "20px", fontStyle: "italic", textAlign: "center", color: "var(--muted)" }}>
                No articles found in this category.
              </div>
            ) : (
              displayedArticles.map((item) => (
                <div className="admin-row" key={item._id} style={{ gridTemplateColumns: "100px 2fr 1fr 150px", alignItems: "center" }}>
                  <span>
                    <img 
                      src={(item.imageUrls && item.imageUrls.length > 0) ? (item.imageUrls[0].startsWith("/uploads/") ? `http://localhost:5000${item.imageUrls[0]}` : item.imageUrls[0]) : "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=120"} 
                      alt="preview" 
                      referrerPolicy="no-referrer"
                      style={{ width: "80px", height: "50px", objectFit: "cover", borderRadius: "8px", border: "1px solid #d8c6b3" }}
                    />
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <strong style={{ display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden", color: "var(--ink)" }}>{item.title}</strong>
                    <small style={{ color: "var(--muted)", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.summary}</small>
                  </span>
                  <span style={{ fontSize: "0.85rem", display: "flex", alignItems: "center" }}>
                    {(item.sourceUrls && item.sourceUrls.length > 0) ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        {item.sourceUrls.map((s, i) => (
                          <a 
                            key={i}
                            href={s} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ color: "var(--primary)", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}
                          >
                            <ExternalLink size={14} /> Link {i + 1}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: "var(--muted)" }}>Manual Post</span>
                    )}
                  </span>
                  <span style={{ display: "flex", gap: "5px", justifyContent: "flex-end" }}>
                    <button className="ghost-button" onClick={() => handleEditClick(item)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Edit size={16} /> Edit
                    </button>
                    <button className="ghost-button danger" onClick={() => handleDelete(item._id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Trash2 size={16} /> Delete
                    </button>
                  </span>
                </div>
              ))
            )}
          </div>
      </div>
    </section>
  );
}
