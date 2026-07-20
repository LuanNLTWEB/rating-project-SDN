import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import { ArrowLeft, Image as ImageIcon } from "lucide-react";
import CustomSelect from "../components/CustomSelect.jsx";
import toast from "react-hot-toast";
import JoditEditor from "jodit-react";
import "../styles/datepicker.css";

export default function StaffNewsEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id;

  const [articles, setArticles] = useState([]); // For related articles dropdown
  const [imagesFiles, setImagesFiles] = useState([]);
  const [relatedSearchQuery, setRelatedSearchQuery] = useState("");
  const [form, setForm] = useState({ 
    title: "", 
    summary: "", 
    content: "", 
    imageUrls: "", 
    videoUrls: [], 
    authorName: "", 
    tags: "", 
    status: "draft", 
    sourceUrls: "", 
    relatedArticles: [] 
  });
  
  const editor = useRef(null);

  const editorConfig = useMemo(() => ({
    readonly: false,
    height: 500,
    placeholder: "Write your article here...",
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    defaultActionOnPaste: "insert_clear_html",
    buttons: [
      "source", "|", "bold", "strikethrough", "underline", "italic", "|",
      "ul", "ol", "|", "outdent", "indent", "|",
      "font", "fontsize", "brush", "paragraph", "|",
      "table", "link", "|", "align", "undo", "redo", "|",
      "hr", "eraser", "copyformat", "|", "symbol", "fullsize", "print", "about"
    ],
    style: { background: "#fffaf3", color: "var(--ink)", fontFamily: "inherit" }
  }), []);

  useEffect(() => {
    // Fetch all articles to populate the "Related Articles" checkbox list
    const fetchArticles = async () => {
      try {
        const res = await api.get(`/staff/news`);
        setArticles(res.data);
        
        if (!isNew) {
          const article = res.data.find(a => a._id === id);
          if (article) {
            setForm({
              title: article.title,
              summary: article.summary,
              content: article.content,
              imageUrls: article.imageUrls ? article.imageUrls.join(", ") : "",
              videoUrls: article.videoUrls || [],
              authorName: article.authorName || "",
              tags: article.tags ? article.tags.join(", ") : "",
              status: article.status,
              sourceUrls: article.sourceUrls ? article.sourceUrls.join(", ") : "",
              relatedArticles: article.relatedArticles ? article.relatedArticles.map(a => a._id || a) : []
            });
          }
        }
      } catch (err) {
        console.error("Error loading articles:", err);
      }
    };
    fetchArticles();
  }, [id, isNew]);

  const handleSave = async (e) => {
    e.preventDefault();
    const toastId = toast.loading("Saving article...");
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("summary", form.summary);
      formData.append("content", form.content);
      formData.append("authorName", form.authorName);
      formData.append("status", form.status);

      const splitAndAppend = (str, key) => {
        if (typeof str === "string") {
          const arr = str.split(",").map(i => i.trim()).filter(Boolean);
          if (arr.length > 0) {
            arr.forEach(val => formData.append(key, val));
          } else {
            formData.append(key, "");
          }
        }
      };

      splitAndAppend(form.imageUrls, "imageUrls");
      
      if (Array.isArray(form.videoUrls)) {
        const filtered = form.videoUrls.filter(v => v.trim());
        if (filtered.length > 0) {
          filtered.forEach(v => formData.append("videoUrls", v.trim()));
        } else {
          formData.append("videoUrls", "");
        }
      }
      splitAndAppend(form.sourceUrls, "sourceUrls");
      splitAndAppend(form.tags, "tags");
      
      if (form.relatedArticles && form.relatedArticles.length > 0) {
        form.relatedArticles.forEach(id => formData.append("relatedArticles", id));
      } else {
        formData.append("relatedArticles", "");
      }

      Array.from(imagesFiles).forEach(file => {
        formData.append("images", file);
      });

      if (isNew) {
        await api.post("/staff/news", formData);
        toast.success("Article created successfully!", { id: toastId });
      } else {
        await api.put(`/staff/news/${id}`, formData);
        toast.success("Article updated successfully!", { id: toastId });
      }
      
      navigate("/staff/news");
      
    } catch (err) {
      console.error(err);
      toast.error("Error saving article.", { id: toastId });
    }
  };

  return (
    <section className="admin-shell">
      <div className="admin-header">
        <div>
          <h2>{isNew ? "Create New Article" : "Edit Article"}</h2>
        </div>
      </div>

      <div className="admin-card">
        <form className="form-grid" onSubmit={handleSave} style={{ gridTemplateColumns: "1fr 1fr" }}>
             <div className="field" style={{ gridColumn: "span 2" }}>
               <label>Article Title <span style={{color:"red"}}>*</span></label>
               <input 
                 type="text" 
                 value={form.title} 
                 required
                 onChange={e => setForm({...form, title: e.target.value})} 
                 placeholder="Enter news title..."
               />
             </div>
             <div className="field" style={{ gridColumn: "span 2" }}>
               <label>Summary <span style={{color:"red"}}>*</span></label>
               <textarea 
                 value={form.summary} 
                 required
                 onChange={e => setForm({...form, summary: e.target.value})}
                 rows={3}
                 style={{ padding: "0.7rem 0.9rem", borderRadius: "12px", border: "1px solid #d8c6b3", fontSize: "1rem", background: "#fffaf3", fontFamily: "inherit", resize: "vertical" }}
               />
             </div>
             <div className="field" style={{ gridColumn: "span 2" }}>
                <label>Detailed Content <span style={{color:"red"}}>*</span></label>
                <div style={{ borderRadius: "12px", border: "1px solid #d8c6b3", overflow: "hidden" }}>
                  <JoditEditor
                    ref={editor}
                    value={form.content}
                    config={editorConfig}
                    onBlur={newContent => setForm({...form, content: newContent})}
                    onChange={() => {}}
                  />
                </div>
              </div>
             <div className="field">
                <label>Upload Cover Image</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div className="file-input-wrapper">
                    <button type="button" className="ghost-button" style={{ pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ImageIcon size={16} /> Choose Cover Image...
                    </button>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => setImagesFiles(e.target.files.length > 0 ? [e.target.files[0]] : [])} 
                    />
                  </div>
                  <label style={{marginTop: "8px", fontSize: "0.85rem"}}>Or Cover Image URL (e.g. ImgBB, imgur)</label>
                  <input 
                    type="text" 
                    value={form.imageUrls} 
                    onChange={e => setForm({...form, imageUrls: e.target.value})} 
                    placeholder="https://i.ibb.co/.../cover.jpg"
                  />
                  {imagesFiles.length > 0 && (
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <span style={{ fontSize: "0.85rem", color: "var(--primary)", fontWeight: "600" }}>Cover image ready to upload.</span>
                      <button type="button" onClick={() => setImagesFiles([])} style={{ fontSize: "0.75rem", padding: "4px 8px", background: "var(--danger)", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Clear Selection</button>
                    </div>
                  )}
                </div>
              </div>
             <div className="field" style={{ gridColumn: "span 2" }}>
               <label>Video Embed URLs (Youtube)</label>
               {(form.videoUrls.length === 0 ? [""] : form.videoUrls).map((vUrl, index) => (
                 <div key={index} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                   <input
                     type="url"
                     value={vUrl}
                     onChange={(e) => {
                       const list = form.videoUrls.length === 0 ? [""] : [...form.videoUrls];
                       list[index] = e.target.value;
                       setForm({ ...form, videoUrls: list });
                     }}
                     placeholder="https://youtube.com/embed/..."
                   />
                   {form.videoUrls.length > 0 && (
                     <button
                       type="button"
                       onClick={() => {
                         const newList = form.videoUrls.filter((_, i) => i !== index);
                         setForm({ ...form, videoUrls: newList });
                       }}
                       className="ghost-button"
                       style={{ color: "red", borderColor: "red", padding: "0 1rem" }}
                     >
                       Remove
                     </button>
                   )}
                 </div>
               ))}
               <button
                 type="button"
                 onClick={() => {
                   const current = form.videoUrls.length === 0 ? [""] : form.videoUrls;
                   setForm({ ...form, videoUrls: [...current, ""] });
                 }}
                 className="ghost-button"
                 style={{ width: "fit-content", marginTop: "4px" }}
               >
                 + Add Another Video Link
               </button>
             </div>
             <div className="field">
               <label>Author Name</label>
               <input 
                 type="text" 
                 value={form.authorName} 
                 onChange={e => setForm({...form, authorName: e.target.value})} 
                 placeholder="e.g. John Doe"
               />
             </div>
             <div className="field">
               <label>Source URLs (Comma separated)</label>
               <input 
                 type="text" 
                 value={form.sourceUrls} 
                 onChange={e => setForm({...form, sourceUrls: e.target.value})} 
                 placeholder="https://example.com/article1, https://example.com/article2"
               />
             </div>
             <div className="field">
               <label>Tags (comma separated)</label>
               <input 
                 type="text" 
                 value={form.tags} 
                 onChange={e => setForm({...form, tags: e.target.value})} 
                 placeholder="Anime, Manga, News"
               />
             </div>
             <div className="field" style={{ gridColumn: "span 2" }}>
               <label>Related Articles</label>
               <input 
                 type="text" 
                 placeholder="Type to search articles..." 
                 value={relatedSearchQuery}
                 onChange={e => setRelatedSearchQuery(e.target.value)}
                 style={{
                   padding: "0.5rem 0.8rem",
                   borderRadius: "8px",
                   border: "1px solid #d8c6b3",
                   fontSize: "0.85rem",
                   background: "#fffaf3",
                   marginBottom: "8px",
                   width: "100%",
                   outline: "none"
                 }}
               />
               <div style={{ maxHeight: "150px", overflowY: "auto", border: "1px solid #d8c6b3", borderRadius: "12px", padding: "0.5rem", background: "#fffaf3" }}>
                 {articles.filter(a => (!id || a._id !== id) && a.title.toLowerCase().includes(relatedSearchQuery.toLowerCase())).length === 0 ? (
                   <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: "0.5rem" }}>No matching articles found.</p>
                 ) : (
                   articles.filter(a => (!id || a._id !== id) && a.title.toLowerCase().includes(relatedSearchQuery.toLowerCase())).map(a => (
                     <label key={a._id} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", cursor: "pointer", padding: "4px", borderRadius: "4px" }}>
                       <input 
                         type="checkbox" 
                         checked={form.relatedArticles.includes(a._id)}
                         onChange={(e) => {
                           if (e.target.checked) {
                             setForm({...form, relatedArticles: [...form.relatedArticles, a._id]});
                           } else {
                             setForm({...form, relatedArticles: form.relatedArticles.filter(relId => relId !== a._id)});
                           }
                         }}
                       />
                       <span style={{ fontSize: "0.9rem", color: "var(--ink)", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.title}</span>
                     </label>
                   ))
                 )}
               </div>
             </div>
             <div className="field">
               <label>Approval Status</label>
               <CustomSelect
                 value={form.status}
                 onChange={(val) => setForm({ ...form, status: val })}
                 options={[
                   { value: "draft", label: "Draft" },
                   { value: "published", label: "Published" }
                 ]}
                 placeholder="Select status..."
                 style={{ width: "100%" }}
                 buttonStyle={{ borderRadius: "12px", padding: "0.7rem 0.9rem" }}
               />
             </div>
             <div className="field" style={{ gridColumn: "span 2", display: "flex", gap: "10px", marginTop: "1rem" }}>
               <button type="submit" className="primary-button">
                 {isNew ? "Create & Save" : "Save Changes"}
               </button>
               <button type="button" className="ghost-button" onClick={() => navigate("/staff/news")}>
                 Cancel
               </button>
             </div>
          </form>
      </div>
    </section>
  );
}
