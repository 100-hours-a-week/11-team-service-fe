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

// Response Interceptor: Handle Token Refresh
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401/403 (Unauthorized/Forbidden) and not already retrying
    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/api/v1/auth/kakao/refresh`,
          {
            refreshToken,
          },
        );

        const { accessToken, refreshToken: newRefreshToken } = data;

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        // Update header and retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        // Refresh failed (expired or invalid)
        console.error("Auth sync failed:", refreshError);

        // Clear local credentials regardless
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

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
          // If public path, we might want to manually reset the auth state in Context too
          // but dispatching a DIFFERENT event or just relying on the next page interaction is safer.
          // For now, if we don't dispatch SESSION_EXPIRED, the modal won't show.
          // The AuthContext will still eventually see isAuthenticated=false on next check/refresh.
          window.dispatchEvent(
            new CustomEvent("scuad-auth-event", {
              detail: { type: "AUTH_CLEARED" }, // Optional: silent clear
            }),
          );
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default client;
