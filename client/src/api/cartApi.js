import axios from "axios";

const BASE =
  import.meta.env.VITE_SERVER_URI ||
  (import.meta.env.PROD ? "" : "http://localhost:3000");

export const cartApi = axios.create({
  baseURL: `${BASE}/api/cart`,
  withCredentials: true,
});
