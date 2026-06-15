import axiosInstance from '../lib/axiosInstance'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setLoopData } from '../redux/loopSlice'

// FIX: Switched from raw axios to axiosInstance for auto auth-refresh.
// FIX: Removed unused imports.
function getAllLoops() {
    const dispatch = useDispatch()
    const { userData } = useSelector(state => state.user)

    useEffect(() => {
        if (!userData) return  // don't fetch if not logged in

        const fetchLoops = async () => {
            try {
                const result = await axiosInstance.get("/api/loop/getAll")
                dispatch(setLoopData(result.data))
            } catch (error) {
                if (error.response?.status !== 401) {
                    console.error("getAllLoops error:", error.message)
                }
            }
        }
        fetchLoops()
    }, [dispatch, userData])
}

export default getAllLoops
