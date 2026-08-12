import { createContext, useContext, useState, useEffect } from "react";
import { cartApi } from "../api/cartApi";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export const CartContextProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchCart = async () => {
    if (!user) {
      setCart(null);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await cartApi.get("/");
      if (res.data && res.data.cart) {
        setCart(res.data.cart);
      } else {
        setCart(res.data);
      }
    } catch (err) {
      console.error("Error fetching cart:", err);
      setError(err?.response?.data?.message || "Failed to fetch cart");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchCart();
    } else if (!user) {
      setCart(null);
    }
  }, [user?._id]);

  const addToCart = async (productIdOrObj, quantity = 1) => {
    try {
      setLoading(true);
      setError(null);
      let payload;
      if (typeof productIdOrObj === "object" && productIdOrObj !== null) {
        payload = productIdOrObj;
      } else {
        payload = { productId: productIdOrObj, quantity };
      }

      const res = await cartApi.post("/items", payload);
      const newCart = res.data?.cart || res.data;
      setCart(newCart);
      return newCart;
    } catch (err) {
      console.error("Error adding to cart:", err);
      const msg = err?.response?.data?.message || "Failed to add item to cart";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (productId, quantity) => {
    try {
      setLoading(true);
      setError(null);
      const res = await cartApi.patch(`/items/${productId}`, { quantity });
      const newCart = res.data?.cart || res.data;
      setCart(newCart);
      return newCart;
    } catch (err) {
      console.error("Error updating cart item:", err);
      const msg = err?.response?.data?.message || "Failed to update cart item";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteCartItem = async (productId) => {
    try {
      setLoading(true);
      setError(null);
      const res = await cartApi.delete(`/items/${productId}`);
      const newCart = res.data?.cart || res.data;
      setCart(newCart);
      return newCart;
    } catch (err) {
      console.error("Error deleting cart item:", err);
      const msg = err?.response?.data?.message || "Failed to remove item";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await cartApi.delete("/");
      const newCart = res.data?.cart || res.data;
      setCart(newCart);
      return newCart;
    } catch (err) {
      console.error("Error clearing cart:", err);
      const msg = err?.response?.data?.message || "Failed to clear cart";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    cart,
    loading,
    error,
    fetchCart,
    addToCart,
    updateCartItem,
    deleteCartItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCartContext = () => useContext(CartContext);
