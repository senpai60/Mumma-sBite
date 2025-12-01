import { useContext, createContext, useState, useEffect } from "react";
import { authApi } from "../api/authApi";

const AuthContext = createContext(null);
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    verifyUser();
  }, []);

  const loginUser = async (email, password) => {
    try {
      setLoading(true);

      const response = await authApi.post("/login", { email, password });

      if (response.status === 200) {
        setUser(response.data.user);
      }
      await verifyUser();
      setLoading(false);
    } catch (err) {
      console.error("Login failed:", err);
      setLoading(false);
    }
  };

  // React / plain JS
  const googleLogin = () => {
    return (window.location.href = `${SERVER_URL}/users/google`); // backend URL
  };

  const verifyUser = async () => {
    setLoading(true);
    try {
      const response = await authApi.get("/me");
      if (response.status === 200) {
        setUser(response.data.user);
      }
      setLoading(false);
    } catch (err) {
      console.error("User verification failed:", err);
      setLoading(false);
    }
  };

  const signupUser = async (name, email, password) => {
    try {
      setLoading(true);
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }
      const response = await authApi.post("/register", {
        name,
        email,
        password,
      });
      if (response.status === 201) {
        setUser(response.data.user);
      }
      await verifyUser();
      setLoading(false);
    } catch (err) {
      console.error("Signup failed:", err);
      setLoading(false);
    }
  };

  const logoutUser = async () => {
    try {
      setLoading(true);
      await authApi.post("/logout");
      setUser(null);
      await verifyUser();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      await verifyUser();
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    googleLogin,
    loginUser,
    verifyUser,
    signupUser,
    logoutUser,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
export const useAuth = () => {
  return useContext(AuthContext);
};
export default AuthProvider;
