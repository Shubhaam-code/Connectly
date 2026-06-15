import axiosInstance from '../lib/axiosInstance'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setPrevChatUsers } from '../redux/messageSlice'

// FIX: Switched from raw axios to axiosInstance for auto auth-refresh.
// FIX: Changed dependency from `messages` to `userData`.
// Previously this hook refetched prevChats every time ANY message was added —
// causing unnecessary API spam. Should only re-fetch when the logged-in user changes.
// FIX: Removed unused imports, removed console.log.
function getPrevChatUsers() {
    const dispatch = useDispatch()
    const { userData } = useSelector(state => state.user)

    useEffect(() => {
        if (!userData) return  // don't fetch if not logged in

        const fetchPrevChats = async () => {
            try {
                const result = await axiosInstance.get("/api/message/prevChats")
                dispatch(setPrevChatUsers(result.data))
            } catch (error) {
                if (error.response?.status !== 401) {
                    console.error("getPrevChatUsers error:", error.message)
                }
            }
        }
        fetchPrevChats()
    }, [userData, dispatch])
}

export default getPrevChatUsers
