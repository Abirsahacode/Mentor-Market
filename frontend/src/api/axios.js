import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("mentor_market_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("mentor_market_token");
      localStorage.removeItem("mentor_market_user");
      window.dispatchEvent(new Event("mentor-market:logout"));
    }
    return Promise.reject(error);
  },
);

export const getErrorMessage = (error) =>
  error.response?.data?.error?.message || error.response?.data?.message || error.message || "Something went wrong";

export default api;

