import axios from "axios";

const BASE = import.meta.env.VITE_SERVER_URI || "http://localhost:3000";

// Auth endpoints: /api/auth/login, /api/auth/register, /api/auth/logout, /api/auth/otp/*
export const authApi = axios.create({
  baseURL: `${BASE}/api/auth`,
  withCredentials: true,
});

// User profile endpoints: /api/users/me
export const userApi = axios.create({
  baseURL: `${BASE}/api/users`,
  withCredentials: true,
});
