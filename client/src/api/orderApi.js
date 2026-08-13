import axios from "axios";

const BASE =
  import.meta.env.VITE_SERVER_URL ||
  (import.meta.env.PROD ? "" : "http://localhost:3000");

export const orderApi = axios.create({
  baseURL: `${BASE}/api/order`,
  withCredentials: true,
});

// Create order (place order with delivery details)
export const createOrder = async (data) => {
  const response = await orderApi.post("/", data);
  return response.data;
};

// Get all orders for the user
export const getUserOrders = async () => {
  const response = await orderApi.get("/user");
  return response.data;
};

// Get order by ID
export const getOrderById = async (orderId) => {
  const response = await orderApi.get(`/${orderId}`);
  return response.data;
};

// Cancel order
export const cancelOrder = async (orderId) => {
  const response = await orderApi.post(`/${orderId}/cancel`);
  return response.data;
};

// Verify payment
export const verifyPayment = async (data) => {
  const response = await orderApi.post("/verify", data);
  return response.data;
};

// Standalone create-order endpoint (/api/create-order)
export const createRazorpayOrder = async (orderData) => {
  const response = await axios.post(`${BASE}/api/create-order`, orderData, {
    withCredentials: true,
  });
  return response.data;
};

// Standalone verify-payment endpoint (/api/verify-payment)
export const verifyRazorpayPayment = async (paymentData) => {
  const response = await axios.post(`${BASE}/api/verify-payment`, paymentData, {
    withCredentials: true,
  });
  return response.data;
};

