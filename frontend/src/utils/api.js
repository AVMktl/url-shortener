import axios from "axios";

const API_URL = process.env.REACT_APP_API || "https://urlshortenerapp1-hdanbrangkbddxb0.westeurope-01.azurewebsites.net";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true // ✅ allows cookies to be sent
});

// Add interceptor to handle expired tokens
api.interceptors.response.use(
  response => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try refreshing the token
        await axios.post(
          `${API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Refresh token expired or invalid");
        // Optionally redirect to login page
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
