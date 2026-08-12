import axios from "axios";

const BASE = import.meta.env.VITE_SERVER_URI || "http://localhost:3000";

// Auth endpoints: /auth/login, /auth/register, /auth/logout, /auth/otp/*
export const authApi = axios.create({
  baseURL: `${BASE}/auth`,
  withCredentials: true,
});

// User profile endpoints: /users/me
export const userApi = axios.create({
  baseURL: `${BASE}/users`,
  withCredentials: true,
});
