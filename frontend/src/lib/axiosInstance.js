import axios from "axios"

const SERVER_URL = "http://localhost:8000"

// ─── Centralized Axios Instance ───────────────────────────────────────────────
// All API calls go through this instance so:
// 1. withCredentials is always sent (cookies for auth)
// 2. 401 responses automatically attempt token refresh + retry
// 3. Base URL is defined in one place

const axiosInstance = axios.create({
    baseURL: SERVER_URL,
    withCredentials: true,   // CRITICAL: sends httpOnly cookies cross-origin
    timeout: 15000
})

axiosInstance.interceptors.request.use((config) => {
    if (config.data instanceof FormData) {
        // Let the browser set the correct boundary for multipart/form-data.
        // Some axios versions keep an existing header object, so undefined is safer.
        if (config.headers) {
            config.headers['Content-Type'] = undefined
            config.headers['content-type'] = undefined
        }
    }
    return config
})

// ─── Response Interceptor — Silent Auth Refresh ───────────────────────────────
// When any request gets a 401:
// 1. Try to refresh the access token via POST /api/auth/refresh-token
// 2. If refresh succeeds → retry the original request once
// 3. If refresh fails → user must log in (clear any stale state, redirect)

let isRefreshing = false
let refreshSubscribers = []   // pending requests waiting for new token

// Queue a retry callback for while refresh is in progress
const subscribeToRefresh = (callback) => {
    refreshSubscribers.push(callback)
}

// After refresh completes, replay all pending requests
const onRefreshed = () => {
    refreshSubscribers.forEach(callback => callback())
    refreshSubscribers = []
}

axiosInstance.interceptors.response.use(
    // Pass successful responses through unchanged
    (response) => response,

    async (error) => {
        const originalRequest = error.config

        // Only handle 401 Unauthorized
        if (error.response?.status !== 401) {
            return Promise.reject(error)
        }

        // Prevent infinite loops:
        // - Don't retry the refresh endpoint itself
        // - Don't retry a request that's already been retried
        if (
            originalRequest._isRetry ||
            originalRequest.url?.includes("/api/auth/refresh-token") ||
            originalRequest.url?.includes("/api/auth/signin") ||
            originalRequest.url?.includes("/api/auth/signup")
        ) {
            return Promise.reject(error)
        }

        // If another request is already refreshing, wait for it
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                subscribeToRefresh(() => {
                    resolve(axiosInstance(originalRequest))
                })
            })
        }

        // Mark as retried so we don't loop
        originalRequest._isRetry = true
        isRefreshing = true

        try {
            // Attempt silent token refresh
            await axiosInstance.post("/api/auth/refresh-token")

            // Refresh succeeded — replay all waiting requests
            onRefreshed()
            isRefreshing = false

            // Retry the original request with new cookie
            return axiosInstance(originalRequest)

        } catch (refreshError) {
            // Refresh failed — session is truly expired
            isRefreshing = false
            refreshSubscribers = []

            // Dispatch a custom event so React can redirect to /signin
            window.dispatchEvent(new CustomEvent("auth:logout"))
            return Promise.reject(refreshError)
        }
    }
)

export default axiosInstance
export { SERVER_URL }
