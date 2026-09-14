import axios from "axios";
import { readStored } from "../lib/storage";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 15000,
});
api.interceptors.request.use((config) => {
  const { token } = readStored("ccms_auth", {});
  if (token && !config.headers.Authorization)
    config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !/\/auth\/(login|register|google)/.test(error.config?.url || "")
    )
      window.dispatchEvent(new Event("ccms:expired"));
    return Promise.reject(error);
  },
);
export default api;
