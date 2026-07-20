import React, { useEffect, useState } from "react";
import { getProfile, updateProfile, changePassword, getMyAuditLogs } from "../services/api";

export default function Profile({ onUpdateUser }) {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Thông tin cá nhân cơ bản
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  // Quản lý ảnh đại diện (Avatar)
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // Đổi mật khẩu
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  // Quản lý lịch sử hoạt động (Audit Logs)
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

  // Quản lý thông báo trạng thái
  const [profileMessage, setProfileMessage] = useState({ type: "", text: "" });
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });

  const fetchUserProfile = async () => {
    try {
      const data = await getProfile();
      setUser(data.user);
      setName(data.user.name);
      setGender(data.user.gender || "male");

      if (data.user.avatar) {
        setPreviewUrl(data.user.avatar.startsWith("http") ? data.user.avatar : `http://localhost:5000${data.user.avatar}`);
      } else {
        setPreviewUrl("");
      }

      if (data.user.dateOfBirth) {
        setDateOfBirth(new Date(data.user.dateOfBirth).toISOString().split("T")[0]);
      }
    } catch (err) {
      setProfileMessage({ type: "error", text: "Failed to load user profile" });
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const data = await getMyAuditLogs();
      setLogs(data.logs || []);
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
    }
  };

  // Xử lý lưu tổng hợp
  const handleUpdateAll = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("gender", gender);
      if (dateOfBirth) {
        formData.append("dateOfBirth", new Date(dateOfBirth).toISOString());
      }

      if (selectedFile) {
        formData.append("avatar", selectedFile);
      }


      const data = await updateProfile(formData);

      localStorage.setItem("user", JSON.stringify(data.user));

      if (onUpdateUser) {
        onUpdateUser(data.user);
      }

      setUser(data.user);
      setIsEditing(false);
      setSelectedFile(null);
      setProfileMessage({ type: "success", text: "Update profile successful!" });
      fetchUserProfile();
      setTimeout(() => setProfileMessage({ type: "", text: "" }), 4000);
    } catch (err) {
      const errorText = err.response?.data?.message || "Update profile failed";
      setProfileMessage({ type: "error", text: errorText });
      setTimeout(() => setProfileMessage({ type: "", text: "" }), 4000);

    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await changePassword({ currentPassword, newPassword, passwordConfirm });
      setCurrentPassword("");
      setNewPassword("");
      setPasswordConfirm("");
      setPasswordMessage({ type: "success", text: "Change password successful!" });
      setTimeout(() => setPasswordMessage({ type: "", text: "" }), 4000);
    } catch (err) {
      const errorText = err.response?.data?.message || "Change password failed";
      setPasswordMessage({ type: "error", text: errorText });
      setTimeout(() => setPasswordMessage({ type: "", text: "" }), 4000);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedFile(null);
    fetchUserProfile();
  };

  if (!user) return <div style={{ padding: "20px", textAlign: "center" }}>Loading profile...</div>;

  return (
    <div className="auth-layout" style={{ maxWidth: "1100px", margin: "2rem auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", padding: "0 1rem" }}>

      {/* KHỐI HỒ SƠ CÁ NHÂN */}
      <div className="auth-card">
        <h2>Personal Profile</h2>
        <p className="auth-subtitle">Manage your personal identification details</p>

        {profileMessage.text && (
          <p className={profileMessage.type === "success" ? "status-success" : "status-error"}>
            {profileMessage.text}
          </p>
        )}

        <form onSubmit={handleUpdateAll} className="form-grid">

          {/* VÒNG TRÒN AVATAR KIỂU DISCORD - ĐÃ THÊM CHẶN LAN TRUYỀN SỰ KIỆN SUBMIT */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem", gridColumn: "1 / -1" }}>
            <div
              style={{
                position: "relative",
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "4px solid var(--primary)",
                backgroundColor: "var(--bg-accent)",
                cursor: isEditing ? "pointer" : "default",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation(); // Ngăn chặn sự kiện click kích hoạt bậy lên form
                if (isEditing) {
                  document.getElementById("avatarInput").click();
                }
              }}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", fontWeight: "700", color: "var(--primary)" }}>
                  {name.charAt(0).toUpperCase()}
                </div>
              )}

              {isEditing && (
                <div style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "rgba(0,0,0,0.4)",
                  color: "#fff",
                  fontSize: "0.8rem",
                  fontWeight: "600",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center"
                }}>
                  <span>Change</span>
                  <span>Avatar</span>
                </div>
              )}
            </div>
            <input
              id="avatarInput"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>

          <div className="field">
            <label>Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={!isEditing} />
          </div>

          <div className="field">
            <label>Gender</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)} disabled={!isEditing}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="field">
            <label>Date of Birth</label>
            <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} disabled={!isEditing} />
          </div>

          {/* CHỈ SUBMIT KHI BẤM NÚT SAVE NÀY */}
          {isEditing && (
            <div style={{ display: "flex", gap: "1rem", gridColumn: "1 / -1", marginTop: "1rem" }}>
              <button type="submit" className="primary-button" style={{ flex: 1, margin: 0 }}>Save</button>
              <button type="button" className="ghost-button" onClick={handleCancelEdit} style={{ flex: 1, margin: 0 }}>Cancel</button>
            </div>
          )}
        </form>

        {/* NÚT EDIT PROFILE ĐƯỢC ĐƯA RA NGOÀI THẺ FORM HOÀN TOÀN ĐỂ TRIỆT TIÊU SUBMIT LẦM */}
        {!isEditing && (
          <div style={{ marginTop: "1rem" }}>
            <button
              type="button"
              className="primary-button"
              style={{ width: "100%", margin: 0 }}
              onClick={(e) => {
                e.preventDefault();
                setIsEditing(true);
              }}
            >
              Edit Profile
            </button>
          </div>
        )}
      </div>

      {/* CỘT PHẢI: SECURITY SETTINGS & ACTIVITY HISTORY */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            className={!showLogs ? "primary-button" : "ghost-button"}
            style={{ flex: 1, margin: 0 }}
            onClick={() => setShowLogs(false)}
          >
            Security Settings
          </button>
          <button
            className={showLogs ? "primary-button" : "ghost-button"}
            style={{ flex: 1, margin: 0 }}
            onClick={() => { setShowLogs(true); fetchAuditLogs(); }}
          >
            Activity History
          </button>
        </div>

        {!showLogs ? (
          <div className="auth-card" style={{ margin: 0 }}>
            <h2>Security</h2>
            <p className="auth-subtitle">Update your password to keep account secure</p>

            {passwordMessage.text && (
              <p className={passwordMessage.type === "success" ? "status-success" : "status-error"}>
                {passwordMessage.text}
              </p>
            )}

            <form onSubmit={handleChangePassword} className="form-grid">
              <div className="field">
                <label>Current Password</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
              </div>

              <div className="field">
                <label>New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              </div>

              <div className="field">
                <label>Confirm Password</label>
                <input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required />
              </div>

              <button type="submit" className="primary-button" style={{ width: "100%", margin: 0 }}>Update Password</button>
            </form>
          </div>
        ) : (
          <div className="auth-card" style={{ margin: 0 }}>
            <h2>Activity History</h2>
            <p className="auth-subtitle">Review your recent account actions and logs</p>

            <div style={{ maxHeight: "360px", overflowY: "auto", paddingRight: "0.5rem", marginTop: "1rem" }}>
              {logs.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--muted)", padding: "2rem 0" }}>No activity logs recorded yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {logs.map((log, index) => (
                    <div key={log._id || index} style={{ borderLeft: "3px solid var(--primary)", paddingLeft: "1rem", backgroundColor: "var(--bg-accent)", padding: "0.75rem 1rem", borderRadius: "0 8px 8px 0" }}>
                      <div style={{ fontWeight: "600", color: "var(--ink)", fontSize: "0.95rem" }}>
                        {log.description || log.action || "Account Action"}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--muted)", textAlign: "right", marginTop: "0.5rem" }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}