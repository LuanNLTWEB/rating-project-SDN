import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

const api = axios.create({ baseURL });

const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
};

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    throw new Error("Missing refresh token");
  }

  const response = await axios.post(`${baseURL}/refresh`, { refreshToken });
  localStorage.setItem("token", response.data.token);
  localStorage.setItem("refreshToken", response.data.refreshToken);
  localStorage.setItem("user", JSON.stringify(response.data.user));
  return response.data.token;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
        }

        const newToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearSession();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

const getProfile = async () => {
  const response = await api.get("/profile");
  return response.data; 
};
const updateProfile = async (formData) => {
  const response = await api.put("/profile/update", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return response.data; 
};

const changePassword = async (passwordData) => {
  const response = await api.put("/profile/change-password", passwordData);
  return response.data;
};



// US09: Hàm gọi API tải ảnh đại diện lên
const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append("avatar", file); 
  const response = await api.post("/profile/upload-avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data" 
    }
  });
  return response.data;
};


// US10: Hàm gọi API lấy lịch sử hoạt động cá nhân
const getMyAuditLogs = async () => {
  const response = await api.get("/profile/audit-logs");
  return response.data; 
};

export { api, clearSession, getProfile, updateProfile, changePassword, uploadAvatar, getMyAuditLogs };





