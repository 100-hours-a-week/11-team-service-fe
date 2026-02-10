import { createContext, useContext, useState, useEffect } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModalConfig, setAuthModalConfig] = useState({
    isOpen: false,
    message: "",
  });

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
    const isValid = !!token && token !== "null" && token !== "undefined";
    setIsAuthenticated(isValid);
    if (isValid) {
      fetchUser();
    }
    setLoading(false);

    // Listen for global auth errors (from axios client)
    const handleAuthError = (event) => {
      console.log("Auth error event received:", event.detail);
      const { type } = event.detail || {};
      if (type === "SESSION_EXPIRED") {
        logout(); // Clear local state
        setAuthModalConfig({
          isOpen: true,
          message: "세션이 만료되었습니다. 다시 로그인해주세요.",
        });
      } else if (type === "AUTH_CLEARED") {
        logout();
      }
    };

    window.addEventListener("scuad-auth-event", handleAuthError);
    return () =>
      window.removeEventListener("scuad-auth-event", handleAuthError);
  }, []);

  const login = (accessToken) => {
    localStorage.setItem("accessToken", accessToken);
    // refreshToken은 HttpOnly 쿠키로 자동 관리됨
    setIsAuthenticated(true);
    fetchUser();
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    // refreshToken은 HttpOnly 쿠키이므로 서버 측에서 만료 처리
    setIsAuthenticated(false);
    setUser(null);
  };

  const showAuthModal = (message) => {
    setAuthModalConfig({
      isOpen: true,
      message: message || "로그인이 필요합니다.",
    });
  };

  const closeAuthModal = () => {
    setAuthModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        login,
        logout,
        authModalConfig,
        showAuthModal,
        closeAuthModal,
      }}
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
