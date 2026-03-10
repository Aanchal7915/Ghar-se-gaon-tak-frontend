
import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import apiClient from '../services/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const fetchWishlist = useCallback(async (pincodeOverride) => {
    setWishlistLoading(true);
    try {
      const pc = pincodeOverride || localStorage.getItem("selectedPincode");
      const token = localStorage.getItem("token");
      if (!token) {
        setWishlist([]);
        return;
      }
      const { data } = await apiClient.get("/wishlist", {
        params: { pincode: pc }
      });
      setWishlist(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching wishlist", err);
      setWishlist([]);
    } finally {
      setWishlistLoading(false);
    }
  }, []);

  const login = useCallback(async (userData) => {
    localStorage.setItem("user", JSON.stringify(userData.user));
    localStorage.setItem("token", userData.token);
    setUser(userData.user);
    window.dispatchEvent(new Event("user-logged-in"));
    const currentPincode = localStorage.getItem("selectedPincode");
    await fetchWishlist(currentPincode);
  }, [fetchWishlist]);

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (err) {
      console.error("Logout error", err);
    }
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setWishlist([]);
  }, []);

  // Restore login + wishlist from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    const currentPincode = localStorage.getItem("selectedPincode");

    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchWishlist(currentPincode);
    }
    setLoading(false);
  }, [fetchWishlist]);

  // 🔹 Refresh wishlist whenever pincode changes
  useEffect(() => {
    const handlePincodeUpdate = () => {
      const token = localStorage.getItem("token");
      if (token) {
        fetchWishlist();
      }
    };
    window.addEventListener("pincode-updated", handlePincodeUpdate);
    return () => window.removeEventListener("pincode-updated", handlePincodeUpdate);
  }, [fetchWishlist]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        wishlist,
        fetchWishlist,
        wishlistLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);