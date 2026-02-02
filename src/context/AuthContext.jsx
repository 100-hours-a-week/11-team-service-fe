import { createContext, useContext, useState, useEffect } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await client.get("/api/v1/users/me");
      setUser(response.data.data);
    } catch (e) {
      console.error("Failed to fetch user info:", e);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      setIsAuthenticated(true);
      fetchUser();
    }
    setLoading(false);
  }, []);

  const login = (accessToken, refreshToken) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    setIsAuthenticated(true);
    fetchUser();
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, loading, login, logout }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
