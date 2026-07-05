import axios from "axios";

/**
 * Axios instance pre-configured with the backend API base URL.
 *
 * All API calls in this app go through this instance — never raw fetch().
 * Centralising here means we only need to change the base URL in one place
 * and can add global interceptors (auth headers, error toasts, etc.) easily.
 */
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10_000, // 10 seconds
});

// ── Request interceptor ──────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

// ── Response interceptor ─────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    // Let individual query/mutation error handlers deal with specifics.
    // We just pass errors through here.
    return Promise.reject(error);
  },
);

export { apiClient };
