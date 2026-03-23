import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import client from "../api/client";
import { logoutApi } from "../api/authApi";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sseConnectKey, setSseConnectKey] = useState(0);
  const [authModalConfig, setAuthModalConfig] = useState({
    isOpen: false,
    message: "",
  });

  const abortControllerRef = useRef(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef(null);

  const fetchUser = useCallback(async () => {
    try {
      const response = await client.get("/api/v1/users/me");
      setUser(response.data.data);
    } catch (e) {
      console.error("Failed to fetch user info:", e);
    }
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const response = await client.get("/api/v1/notifications/unread-count");
      const count = Number(response.data.data);
      console.log("Fetched unread count:", count);
      setUnreadCount(isNaN(count) ? 0 : count);
    } catch (e) {
      console.error("Failed to fetch unread count:", e);
    }
  }, []);

  const openSessionExpiredModal = useCallback((message) => {
    setAuthModalConfig({
      isOpen: true,
      message: message || "세션이 만료되었습니다. 다시 로그인해주세요.",
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setIsAuthenticated(false);
    setUser(null);
    setUnreadCount(0);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error("Logout API error (cleaning up anyway):", error);
    } finally {
      logout();
    }
  }, [logout]);

  const login = useCallback(
    (accessToken) => {
      localStorage.setItem("accessToken", accessToken);
      setIsAuthenticated(true);
      fetchUser();
      refreshUnreadCount();

      // 로그인 직후 SSE 재연결 트리거
      setSseConnectKey((prev) => prev + 1);
    },
    [fetchUser, refreshUnreadCount],
  );

  const reconnectSSE = useCallback(() => {
    setSseConnectKey((prev) => prev + 1);
  }, []);

  const showAuthModal = useCallback((message) => {
    setAuthModalConfig({
      isOpen: true,
      message: message || "로그인이 필요합니다.",
    });
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalConfig((prev) => ({ ...prev, isOpen: false }));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const isValid = !!token && token !== "null" && token !== "undefined";

    setIsAuthenticated(isValid);

    if (isValid) {
      fetchUser();

      setTimeout(() => {
        refreshUnreadCount();
      }, 0);

      // 앱 최초 진입 시 SSE 연결 트리거
      setSseConnectKey((prev) => prev + 1);
    }

    setLoading(false);

    const handleAuthError = (event) => {
      console.log("Auth error event received:", event.detail);
      const { type, accessToken } = event.detail || {};

      if (type === "SESSION_EXPIRED") {
        logout();
        openSessionExpiredModal("세션이 만료되었습니다. 다시 로그인해주세요.");
      } else if (type === "AUTH_CLEARED") {
        logout();
      } else if (type === "TOKEN_REFRESHED") {
        // axios 인터셉터 등에서 토큰 재발급 후 이벤트 쏘는 경우 대응
        if (accessToken) {
          localStorage.setItem("accessToken", accessToken);
        }
        setIsAuthenticated(true);
        reconnectSSE();
      }
    };

    window.addEventListener("scuad-auth-event", handleAuthError);

    return () => {
      window.removeEventListener("scuad-auth-event", handleAuthError);
    };
  }, [
    fetchUser,
    refreshUnreadCount,
    logout,
    openSessionExpiredModal,
    reconnectSSE,
  ]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshUnreadCount();
    } else {
      setUnreadCount(0);
    }
  }, [isAuthenticated, refreshUnreadCount]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken || accessToken === "null" || accessToken === "undefined")
      return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let isActive = true;

    const connectSSE = async () => {
      // 이미 인증되지 않은 상태면 중단
      if (!isAuthenticated || !isActive) return;

      try {
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);

        await refreshUnreadCount();

        const token = localStorage.getItem("accessToken");
        if (!token) return;

        await fetchEventSource(
          `${import.meta.env.VITE_API_BASE_URL}/api/v1/notifications/subscribe`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "text/event-stream",
            },
            signal: abortController.signal,
            openWhenHidden: true,

            async onopen(response) {
              if (response.status === 401 || response.status === 403) {
                console.error("SSE 인증 실패:", response.status);
                logout();
                openSessionExpiredModal(
                  "세션이 만료되었거나 인증에 실패했습니다.",
                );
                throw new Error("SSE_UNAUTHORIZED");
              }

              if (!response.ok) {
                throw new Error(`SSE_SERVER_ERROR_${response.status}`);
              }

              console.log("SSE 연결 성공!");
              retryCountRef.current = 0; // 연결 성공 시 재시도 횟수 초기화
            },

            onmessage(event) {
              if (!isActive) return;
              if (event.event === "chat-room-update") {
                try {
                  const data = JSON.parse(event.data);
                  window.dispatchEvent(
                    new CustomEvent("scuad-chat-room-update", { detail: data }),
                  );
                } catch (err) {
                  console.error("Failed to parse chat-room-update JSON:", err);
                }
              } else if (event.event === "notification") {
                try {
                  const data = JSON.parse(event.data); // Parse data here
                  console.log("SSE Notification received:", data);
                  refreshUnreadCount();
                  window.dispatchEvent(
                    new CustomEvent("scuad-notification", { detail: data }),
                  );

                  if (data.title || data.body) {
                    const message = `${data.title}\n${data.body}`;
                    if (data.type === "CHAT_ROOM_KICKED") {
                      toast.error(message, {
                        position: "top-center",
                        id: "scuad-toast",
                      });
                    } else if (data.type === "CHAT_ROOM_CLOSED") {
                      toast(message, {
                        position: "top-center",
                        id: "scuad-toast",
                      });
                    } else {
                      toast.success(message, {
                        position: "top-center",
                        id: "scuad-toast",
                      });
                    }
                  }
                } catch (err) {
                  console.error("Failed to parse notification JSON:", err);
                }
              } else if (event.data === "connected successfully") {
                console.log("SSE Connection Confirmed");
              }
            },

            onclose() {
              console.log("SSE 연결 종료 -> 재연결 준비");
              handleRetry();
            },

            onerror(err) {
              console.error("SSE 연결 장애:", err);

              if (abortController.signal.aborted) return;

              // 인증 에러는 재시도하지 않음
              if (err?.message === "SSE_UNAUTHORIZED") throw err;

              handleRetry();
              // fetch-event-source가 내부적으로 다시 fetch를 던지지 않도록
              // 에러가 아닌 null류를 던지거나 handleRetry에서 수동 관리
              throw err;
            },
          },
        );
      } catch (err) {
        if (err?.message !== "SSE_UNAUTHORIZED" && isActive) {
          handleRetry();
        }
      }
    };

    const handleRetry = () => {
      if (!isActive || !isAuthenticated) return;
      if (retryTimeoutRef.current) return;

      // 지수 백오프 적용 (최대 30초)
      const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
      console.log(
        `SSE ${delay}ms 후 재연결 시도... (시도 횟수: ${retryCountRef.current + 1})`,
      );

      retryTimeoutRef.current = setTimeout(() => {
        retryTimeoutRef.current = null;
        retryCountRef.current += 1;
        connectSSE();
      }, delay);
    };

    connectSSE();

    return () => {
      isActive = false;
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [
    isAuthenticated,
    sseConnectKey,
    refreshUnreadCount,
    logout,
    openSessionExpiredModal,
  ]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        login,
        logout,
        handleLogout,
        authModalConfig,
        showAuthModal,
        closeAuthModal,
        unreadCount,
        setUnreadCount,
        refreshUnreadCount,
        reconnectSSE,
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
