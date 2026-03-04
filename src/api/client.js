import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080", // Backend URL
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request Interceptor: Add Access Token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Refresh lock: prevents multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Handle Token Refresh
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401/403 (Unauthorized/Forbidden) and not already retrying
    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !originalRequest._retry &&
      !originalRequest._skipAuthRetry
    ) {
      originalRequest._retry = true;

      // If a refresh is already in progress, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return client(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        // refreshToken은 HttpOnly 쿠키로 자동 전송됨
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/api/v1/auth/kakao/refresh`,
          {},
          { withCredentials: true },
        );

        const { accessToken } = data.data;

        localStorage.setItem("accessToken", accessToken);
        processQueue(null, accessToken);

        // Update header and retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        // Refresh failed (expired or invalid)
        processQueue(refreshError, null);
        console.error("Auth sync failed:", refreshError);

        // Clear local credentials
        localStorage.removeItem("accessToken");

        // Only show "Session Expired" modal if we are on a protected page.
        // If we are on a public page (Dashboard or JobDetail), just clear and keep them as guest.
        const publicPaths = ["/", "/login"];
        const isPublicPath =
          publicPaths.includes(window.location.pathname) ||
          window.location.pathname.startsWith("/jobs/");

        if (!isPublicPath) {
          window.dispatchEvent(
            new CustomEvent("scuad-auth-event", {
              detail: { type: "SESSION_EXPIRED" },
            }),
          );
        } else {
          window.dispatchEvent(
            new CustomEvent("scuad-auth-event", {
              detail: { type: "AUTH_CLEARED" },
            }),
          );
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default client;
