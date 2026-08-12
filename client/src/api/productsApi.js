import axios from "axios";

const BASE = import.meta.env.VITE_SERVER_URI || "http://localhost:3000";

export const productsApi = axios.create({
  baseURL: `${BASE}/products`,
  withCredentials: true,
});

export const getProducts = async () => {
  const response = await productsApi.get("/");
  return response.data;
};

export const getSingleProduct = async (productId) => {
  const response = await productsApi.get(`/${productId}`);
  return response.data;
};
