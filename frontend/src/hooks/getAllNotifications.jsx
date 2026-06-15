import axiosInstance from '../lib/axiosInstance'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setNotificationData } from '../redux/userSlice'

// FIX: Switched from raw axios to axiosInstance for auto auth-refresh.
// FIX: Removed unused imports (setUserData, setPostData).
function getAllNotifications() {
    const dispatch = useDispatch()
    const { userData } = useSelector(state => state.user)

    useEffect(() => {
        if (!userData) return  // don't fetch if not logged in

        const fetchNotifications = async () => {
            try {
                const result = await axiosInstance.get("/api/user/getAllNotifications")
                dispatch(setNotificationData(result.data))
            } catch (error) {
                if (error.response?.status !== 401) {
                    console.error("getAllNotifications error:", error.message)
                }
            }
        }
        fetchNotifications()
    }, [dispatch, userData])
}

export default getAllNotifications
