import axiosInstance from '../lib/axiosInstance'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setUserData, setAuthChecking } from '../redux/userSlice'
import { setCurrentUserStory } from '../redux/storySlice'

// Silent auth flow:
// 1. GET /api/user/current (sends cookies automatically)
// 2. If 401 → axiosInstance interceptor auto-refreshes the token
// 3. If refresh also fails → auth:logout event fired → App.jsx redirects to /signin
//
// FIX: Removed storyData from dependency array.
// storyData was causing re-fetches of /api/user/current on every story change,
// which is wasteful and could cause flickering. User data should only refresh once on mount.
function getCurrentUser() {
    const dispatch = useDispatch()

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const result = await axiosInstance.get("/api/user/current")
                dispatch(setUserData(result.data))
                dispatch(setCurrentUserStory(result.data.story))
            } catch (error) {
                // axiosInstance already attempted refresh.
                // If we still get an error here, the session is truly expired.
                // The auth:logout event in axiosInstance handles the redirect.
                if (error.response?.status !== 401) {
                    console.error("getCurrentUser error:", error.message)
                }
            } finally {
                dispatch(setAuthChecking(false))
            }
        }
        fetchUser()
    }, [dispatch])  // FIX: Only run once on mount — no storyData dependency
}

export default getCurrentUser
