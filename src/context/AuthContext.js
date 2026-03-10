

import React, { createContext, useState, useEffect, useContext } from "react";
import apiClient from '../services/apiClient'; // ⚠️ Import the new apiClient

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Restore login + wishlist from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      // ⚠️ No need to set the header manually; apiClient handles it.
      fetchWishlist();
    }
    setLoading(false);
  }, []);

  const login = async (userData) => {
    localStorage.setItem("user", JSON.stringify(userData.user));
    localStorage.setItem("token", userData.token);
    setUser(userData.user);
    window.dispatchEvent(new Event("user-logged-in"));
    // ⚠️ No need to set the header manually; apiClient handles it.
    await fetchWishlist();
  };

  const logout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (err) {
      console.error("Logout error", err);
    }
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setWishlist([]);
  };

  const fetchWishlist = async () => {
    setWishlistLoading(true);
    try {
      // ⚠️ Use apiClient instead of axios for all API calls
      const { data } = await apiClient.get("/wishlist");
      setWishlist(data || []);
    } catch (err) {
      console.error("Error fetching wishlist", err);
      // If the wishlist fetch fails due to a 401, the apiClient interceptor
      // will handle the token refresh and retry the request.
      setWishlist([]);
    } finally {
      setWishlistLoading(false);
    }
  };

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