import axiosInstance from '../lib/axiosInstance'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setSuggestedUsers } from '../redux/userSlice'

// FIX: Switched from raw axios to axiosInstance for auto auth-refresh.
// FIX: Removed unused imports.
function getSuggestedUsers() {
    const dispatch = useDispatch()
    const { userData } = useSelector(state => state.user)

    useEffect(() => {
        if (!userData) return  // don't fetch if not logged in

        const fetchUsers = async () => {
            try {
                const result = await axiosInstance.get("/api/user/suggested")
                dispatch(setSuggestedUsers(result.data))
            } catch (error) {
                if (error.response?.status !== 401) {
                    console.error("getSuggestedUsers error:", error.message)
                }
            }
        }
        fetchUsers()
    }, [userData, dispatch])
}

export default getSuggestedUsers
