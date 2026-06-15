import axiosInstance from '../lib/axiosInstance'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setFollowing } from '../redux/userSlice'

// FIX: This hook was using storyData as its dependency — meaning it would
// re-fetch followingList every time a story changed. The correct dependency
// is userData (re-fetch when user logs in/out, not when stories change).
// FIX: Switched from raw axios to axiosInstance for auth-refresh support.
// FIX: The API now returns string IDs (fixed in backend followingList controller),
// so Redux following array contains strings for consistent comparison.
function getFollowingList() {
    const dispatch = useDispatch()
    const { userData } = useSelector(state => state.user)

    useEffect(() => {
        if (!userData) return  // don't fetch if not logged in

        const fetchFollowing = async () => {
            try {
                const result = await axiosInstance.get("/api/user/followingList")
                dispatch(setFollowing(result.data))
            } catch (error) {
                if (error.response?.status !== 401) {
                    console.error("getFollowingList error:", error.message)
                }
            }
        }
        fetchFollowing()
    }, [userData, dispatch])
}

export default getFollowingList