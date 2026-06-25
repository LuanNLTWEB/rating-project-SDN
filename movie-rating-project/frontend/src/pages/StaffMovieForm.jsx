import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import CustomSelect from "../components/CustomSelect.jsx";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/datepicker.css";
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const StaffMovieForm = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [genres, setGenres] = useState([]);
  const [genreSearch, setGenreSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [globalError, setGlobalError] = useState("");

  // Form State
  const [form, setForm] = useState({
    name: "",
    summary: "",
    trailer: "",
    releaseDate: new Date(),
    totalEpisodes: 1,
    status: "ongoing",
    isActive: true,
    genres: [],
  });
  
  // Validation State
  const [errors, setErrors] = useState({});

  // Image Upload & Crop State
  const [cropModal, setCropModal] = useState({ show: false, type: null, src: null });
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);
  const [posterFile, setPosterFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [previewPoster, setPreviewPoster] = useState(null);
  const [previewBanner, setPreviewBanner] = useState(null);

  const token = useMemo(() => localStorage.getItem("token"), []);
  const baseURL = import.meta.env.VITE_API_URL;
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "staff") {
      navigate("/");
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    fetchGenres();
    if (isEditMode) {
      fetchMovieDetails();
    }
  }, [id]);

  const fetchMovieDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/movies/${id}`);
      const movie = response.data.movie;
      setForm({
        name: movie.name,
        summary: movie.summary,
        trailer: movie.trailer || "",
        releaseDate: new Date(movie.releaseDate),
        totalEpisodes: movie.totalEpisodes,
        status: movie.status,
        isActive: movie.isActive,
        genres: movie.genres.map(g => g._id),
      });
      setPreviewPoster(movie.poster ? `${baseURL.replace('/api', '')}${movie.poster}` : null);
      setPreviewBanner(movie.banner ? `${baseURL.replace('/api', '')}${movie.banner}` : null);
    } catch (err) {
      setGlobalError("Failed to load movie details for editing.");
    } finally {
      setLoading(false);
    }
  };

  const fetchGenres = async () => {
    try {
      const response = await axios.get(`${baseURL}/staff/genres`, { headers, params: { limit: 100 } });
      setGenres(response.data.genres || []);
    } catch (err) {
      console.error(err);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Movie title is required";
    if (!form.summary.trim()) newErrors.summary = "Summary is required";
    if (!form.releaseDate) newErrors.releaseDate = "Invalid release date";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const formData = new FormData();
    Object.keys(form).forEach(key => {
      if (key === 'genres') {
        formData.append(key, JSON.stringify(form[key]));
      } else {
        formData.append(key, form[key]);
      }
    });

    if (posterFile) formData.append("poster", posterFile);
    if (bannerFile) formData.append("banner", bannerFile);

    try {
      if (isEditMode) {
        await axios.put(`${baseURL}/staff/movies/${id}`, formData, {
          headers: { ...headers, "Content-Type": "multipart/form-data" }
        });
      } else {
        await axios.post(`${baseURL}/staff/movies`, formData, {
          headers: { ...headers, "Content-Type": "multipart/form-data" }
        });
      }
      navigate("/staff/movies");
    } catch (err) {
      setGlobalError(err?.response?.data?.message || "Error saving movie");
    }
  };

  // --- Image Cropping Logic ---
  const onSelectFile = (e, type) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        alert("Invalid file type. Only JPG, PNG, and WEBP are accepted.");
        return;
      }
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setCropModal({ show: true, type, src: reader.result });
      });
      reader.readAsDataURL(file);
    }
  };

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    const aspect = cropModal.type === 'poster' ? 2 / 3 : 16 / 9;
    const crop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height),
      width, height
    );
    setCrop(crop);
  };

  const getCroppedImg = async (image, crop, fileName) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    // Calculate actual pixel dimensions to prevent black bars
    canvas.width = Math.floor(crop.width * scaleX);
    canvas.height = Math.floor(crop.height * scaleY);
    
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      image,
      crop.x * scaleX, 
      crop.y * scaleY, 
      crop.width * scaleX, 
      crop.height * scaleY,
      0, 
      0, 
      canvas.width, 
      canvas.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return;
        blob.name = fileName;
        resolve(new File([blob], fileName, { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.95);
    });
  };

  const saveCrop = async () => {
    if (imgRef.current && completedCrop?.width && completedCrop?.height) {
      const fileName = `${cropModal.type}-${Date.now()}.jpg`;
      const croppedFile = await getCroppedImg(imgRef.current, completedCrop, fileName);
      const previewUrl = URL.createObjectURL(croppedFile);

      if (cropModal.type === 'poster') {
        setPosterFile(croppedFile);
        setPreviewPoster(previewUrl);
      } else {
        setBannerFile(croppedFile);
        setPreviewBanner(previewUrl);
      }
    }
    setCropModal({ show: false, type: null, src: null });
  };

  if (loading && isEditMode) {
    return <div className="admin-shell"><p>Loading movie details...</p></div>;
  }

  return (
    <section className="admin-shell">
      <div className="admin-header">
        <div>
          <h2>{isEditMode ? "Edit Movie" : "Add New Movie"}</h2>
          <p className="admin-subtitle">{isEditMode ? "Update movie details." : "Fill in the details below to create a new movie."}</p>
        </div>
        <div>
          <Link to="/staff/movies" className="ghost-button">← Back to List</Link>
        </div>
      </div>

      {globalError && <p className="status-error">{globalError}</p>}

      <div className="admin-card">
        <form className="form-grid" onSubmit={handleFormSubmit} style={{ gridTemplateColumns: "1fr 1fr" }}>
          
          <div className="field" style={{ gridColumn: "span 2" }}>
            <label>Movie Title <span style={{color:"red"}}>*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter anime title..."
            />
            {errors.name && <small style={{ color: "red", marginTop: "4px" }}>{errors.name}</small>}
          </div>

          <div className="field" style={{ gridColumn: "span 2" }}>
            <label>Summary <span style={{color:"red"}}>*</span></label>
            <textarea
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              rows={6}
              style={{ padding: "0.7rem", borderRadius: "8px", border: "1px solid #d8c6b3" }}
            />
            {errors.summary && <small style={{ color: "red", marginTop: "4px" }}>{errors.summary}</small>}
          </div>

          <div className="field">
            <label>Release Date <span style={{color:"red"}}>*</span></label>
            <DatePicker
              showIcon
              selected={form.releaseDate}
              onChange={(date) => setForm({ ...form, releaseDate: date })}
              onKeyDown={(e) => {
                if (
                  !/[0-9/]/.test(e.key) &&
                  e.key !== "Backspace" &&
                  e.key !== "Delete" &&
                  e.key !== "ArrowLeft" &&
                  e.key !== "ArrowRight" &&
                  e.key !== "Tab" &&
                  !e.ctrlKey &&
                  !e.metaKey
                ) {
                  e.preventDefault();
                }
              }}
              dateFormat="dd/MM/yyyy"
              placeholderText="--/--/----"
              className="custom-datepicker"
              wrapperClassName="custom-datepicker-wrapper"
              showYearDropdown
              scrollableYearDropdown
              yearDropdownItemNumber={100}
              popperPlacement="bottom-end"
            />
            {errors.releaseDate && <small style={{ color: "red" }}>{errors.releaseDate}</small>}
          </div>

          <div className="field">
            <label>Episodes</label>
            <input
              type="number"
              min="1"
              value={form.totalEpisodes}
              onChange={(e) => setForm({ ...form, totalEpisodes: e.target.value })}
            />
          </div>

          <div className="field">
            <label>Release Status</label>
            <CustomSelect
              value={form.status}
              onChange={(val) => setForm({ ...form, status: val })}
              options={[
                { value: "ongoing", label: "Ongoing" },
                { value: "completed", label: "Completed" },
                { value: "upcoming", label: "Upcoming" }
              ]}
              placeholder="Select status..."
              style={{ width: "100%" }}
            />
          </div>

          <div className="field">
            <label>Trailer Link (Youtube)</label>
            <input
              type="url"
              value={form.trailer}
              onChange={(e) => setForm({ ...form, trailer: e.target.value })}
              placeholder="https://youtube.com/..."
            />
          </div>

          <div className="field">
            <label>Poster Image (Vertical)</label>
            <div className="file-input-wrapper">
              <button type="button" className="ghost-button" style={{ pointerEvents: 'none' }}>
                📸 Choose Poster...
              </button>
              <input type="file" accept="image/*" onChange={(e) => onSelectFile(e, 'poster')} />
            </div>
            {previewPoster && <img src={previewPoster} alt="Poster" style={{ height: "220px", aspectRatio: "2/3", marginTop: "10px", borderRadius: "8px", objectFit: "cover" }} />}
          </div>

          <div className="field">
            <label>Banner Image (Horizontal)</label>
            <div className="file-input-wrapper">
              <button type="button" className="ghost-button" style={{ pointerEvents: 'none' }}>
                🖼️ Choose Banner...
              </button>
              <input type="file" accept="image/*" onChange={(e) => onSelectFile(e, 'banner')} />
            </div>
            {previewBanner && <img src={previewBanner} alt="Banner" style={{ height: "220px", aspectRatio: "16/9", marginTop: "10px", borderRadius: "8px", objectFit: "cover", maxWidth: "100%" }} />}
          </div>

          <div className="field" style={{ gridColumn: "span 2" }}>
            <label>Genres</label>
            <div style={{ marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="text"
                placeholder="Search genres..."
                value={genreSearch}
                onChange={(e) => setGenreSearch(e.target.value)}
                style={{
                  padding: "0.45rem 0.8rem",
                  borderRadius: "999px",
                  border: "1px solid #d8c6b3",
                  background: "#fffaf3",
                  fontSize: "0.9rem",
                  width: "250px"
                }}
              />
              {genreSearch && (
                <button
                  type="button"
                  onClick={() => setGenreSearch("")}
                  className="ghost-button"
                  style={{ padding: "0.3rem 0.8rem", fontSize: "0.85rem" }}
                >
                  Clear
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", border: "1px solid #d8c6b3", padding: "10px", borderRadius: "8px", minHeight: "50px", background: "#fffaf3" }}>
              {genres.length === 0 ? (
                <span style={{ color: "var(--muted)", fontSize: "0.9rem", fontStyle: "italic" }}>No genres available. Add them in the Genres menu.</span>
              ) : genres.filter(g => g.name.toLowerCase().includes(genreSearch.toLowerCase())).length === 0 ? (
                <span style={{ color: "var(--muted)", fontSize: "0.9rem", fontStyle: "italic" }}>No genres match your search.</span>
              ) : (
                genres
                  .filter(g => g.name.toLowerCase().includes(genreSearch.toLowerCase()))
                  .map(g => (
                    <label key={g._id} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.9rem", background: "white", padding: "4px 8px", borderRadius: "6px", border: "1px solid #ead6c3" }}>
                      <input
                        type="checkbox"
                        checked={form.genres.includes(g._id)}
                        onChange={(e) => {
                          const newGenres = e.target.checked 
                            ? [...form.genres, g._id] 
                            : form.genres.filter(id => id !== g._id);
                          setForm({ ...form, genres: newGenres });
                        }}
                      />
                      {g.name}
                    </label>
                  ))
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", gridColumn: "span 2", marginTop: "1rem" }}>
            <button type="submit" className="primary-button">{isEditMode ? "Update" : "Create"}</button>
            <Link to="/staff/movies" className="ghost-button">Cancel</Link>
          </div>
        </form>
      </div>

      {/* CROP MODAL */}
      {cropModal.show && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.8)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ background: "var(--bg)", padding: "24px", borderRadius: "16px", maxWidth: "90vw", maxHeight: "90vh", overflow: "auto", border: "1px solid var(--primary)" }}>
            <h3 style={{ marginTop: 0, color: "var(--primary)" }}>Crop {cropModal.type === 'poster' ? 'Poster (2:3 Aspect Ratio)' : 'Banner (16:9 Aspect Ratio)'}</h3>
            <p style={{ color: "var(--muted)", marginBottom: "16px", fontSize: "0.9rem" }}>Drag the crop handles to select your desired region. Then click "Save Crop".</p>
            <div style={{ background: "#000", borderRadius: "8px", overflow: "hidden", display: "flex", justifyContent: "center" }}>
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={cropModal.type === 'poster' ? 2 / 3 : 16 / 9}
              >
                <img ref={imgRef} alt="Crop me" src={cropModal.src} onLoad={onImageLoad} style={{ maxHeight: "55vh" }} />
              </ReactCrop>
            </div>
            <div style={{ marginTop: "24px", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button type="button" className="ghost-button" onClick={() => setCropModal({ show: false, src: null, type: null })}>Cancel</button>
              <button type="button" className="primary-button" onClick={saveCrop}>Save Crop</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default StaffMovieForm;
