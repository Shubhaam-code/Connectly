import axiosInstance from '../lib/axiosInstance'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setPostData } from '../redux/postSlice'

function getAllPost() {
    const dispatch = useDispatch()
    const { userData } = useSelector(state => state.user)
    useEffect(() => {
        if (!userData) return
        const fetchPost = async () => {
            try {
                const result = await axiosInstance.get("/api/post/getAll")
                dispatch(setPostData(result.data))
            } catch (error) {
                if (error.response?.status !== 401) console.error("getAllPost error:", error.message)
            }
        }
        fetchPost()
    }, [dispatch, userData?._id])
}

export default getAllPost
