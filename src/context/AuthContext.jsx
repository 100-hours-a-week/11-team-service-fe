import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authModalConfig, setAuthModalConfig] = useState({
    isOpen: false,
    message: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    // Ensure token is a valid non-empty string and not the string "null" or "undefined"
    const isValid = !!token && token !== "null" && token !== "undefined";
    setIsAuthenticated(isValid);
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

  const login = (accessToken, refreshToken) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setIsAuthenticated(false);
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
