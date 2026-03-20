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
      try {
        await refreshUnreadCount();

        await fetchEventSource(
          `${import.meta.env.VITE_API_BASE_URL}/api/v1/notifications/subscribe`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "text/event-stream",
            },
            signal: abortController.signal,
            openWhenHidden: true,

            async onopen(response) {
              const contentType = response.headers.get("content-type") || "";

              console.log(
                "SSE onopen status:",
                response.status,
                "content-type:",
                contentType,
              );

              if (response.status === 401 || response.status === 403) {
                console.error("SSE 인증 실패:", response.status);

                logout();
                openSessionExpiredModal(
                  "세션이 만료되었거나 인증에 실패했습니다. 다시 로그인해주세요.",
                );

                // 인증 실패 시 재시도 막기
                throw new Error("SSE_UNAUTHORIZED");
              }

              if (!response.ok) {
                console.error("SSE 연결 실패:", response.status);
                throw new Error(`SSE_CONNECTION_FAILED_${response.status}`);
              }

              if (!contentType.startsWith("text/event-stream")) {
                console.error("SSE content-type 이상:", contentType);
                throw new Error("SSE_INVALID_CONTENT_TYPE");
              }

              console.log("SSE 연결 성공!");
            },

            onmessage(event) {
              if (!isActive) return;

              console.log("SSE Message Received:", event);

              if (event.event === "notification") {
                try {
                  const data = JSON.parse(event.data);
                  console.log("Parsed Notification Data:", data);

                  refreshUnreadCount();

                  window.dispatchEvent(
                    new CustomEvent("scuad-notification", { detail: data }),
                  );

                  if (data.title || data.body) {
                    toast(
                      (t) => (
                        <div className="flex flex-col items-center justify-center cursor-default">
                          <p className="text-[15px] font-bold text-gray-900 mb-1 leading-snug">
                            {data.title}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed font-medium">
                            {data.body}
                          </p>
                        </div>
                      ),
                      {
                        duration: 5000,
                        position: "top-center",
                        id: "scuad-toast",
                      },
                    );
                  }
                } catch (err) {
                  console.error("Failed to parse notification JSON:", err);
                }
              } else if (event.data === "connected successfully") {
                console.log("SSE Connection Confirmed");
              }
            },

            onclose() {
              console.log(
                "SSE 연결 종료 (서버에 의한 정상 종료) -> 자동 재연결 시도",
              );
              // fetch-event-source는 onclose에서 에러를 던져야만 재시작(retry)합니다.
              throw new Error("SERVER_CLOSED_CONNECTION_RETRY");
            },

            onerror(err) {
              console.error("SSE 연결 장애:", err);

              // abort된 경우는 정상 종료로 간주
              if (abortController.signal.aborted) {
                console.log("SSE aborted intentionally");
                return;
              }

              // 인증 실패는 재시도하지 않도록 에러 throw
              if (
                err?.message === "SSE_UNAUTHORIZED" ||
                String(err?.message).includes("SSE_UNAUTHORIZED")
              ) {
                throw err;
              }

              // 나머지는 fetch-event-source 기본 재시도에 맡김
            },
          },
        );
      } catch (err) {
        if (abortController.signal.aborted) {
          console.log("SSE fetch cancelled");
          return;
        }

        console.error("SSE connectSSE fatal error:", err);
      }
    };

    connectSSE();

    return () => {
      isActive = false;

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
