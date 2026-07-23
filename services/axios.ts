/// <reference types="vite/client" />
import axios from "axios";
import { clearSessionValidation } from "../utils/authSession";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

axios.defaults.baseURL = BASE_URL;

// Get token from localStorage
const getToken = () => {
  return localStorage.getItem("authToken");
};

// Set token in localStorage
export const setAuthToken = (token: string) => {
  localStorage.setItem("authToken", token);
  // Update axios default header
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
};

// Remove token from localStorage
export const removeAuthToken = () => {
  localStorage.removeItem("authToken");
  clearSessionValidation();
  delete axios.defaults.headers.common["Authorization"];
};

// Set initial token if exists
const token = getToken();
if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

// Request interceptor to add token to all requests
axios.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      removeAuthToken();
      // Redirect to login if not already there
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axios;
