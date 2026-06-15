import axiosInstance from '../lib/axiosInstance'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setStoryList } from '../redux/storySlice'

// FIX: Switched from raw axios to axiosInstance for auto auth-refresh.
// FIX: Removed storyData from dependencies — was causing infinite re-render loop:
//   1. storyData changes → fetchStories runs → dispatches setStoryList → storyData changes → loop
// FIX: Removed unused imports.
function getAllStories() {
    const dispatch = useDispatch()
    const { userData } = useSelector(state => state.user)

    useEffect(() => {
        if (!userData) return  // don't fetch if not logged in

        const fetchStories = async () => {
            try {
                const result = await axiosInstance.get("/api/story/getAll")
                dispatch(setStoryList(result.data))
            } catch (error) {
                if (error.response?.status !== 401) {
                    console.error("getAllStories error:", error.message)
                }
            }
        }
        fetchStories()
    }, [userData, dispatch])
}

export default getAllStories
