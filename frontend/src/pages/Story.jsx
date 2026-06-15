import axiosInstance from '../lib/axiosInstance'
import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setStoryData } from '../redux/storySlice'
import StoryCard from '../components/StoryCard'

// FIX: Switched from raw axios to axiosInstance for auto auth-refresh
// FIX: Removed console.log(storyData) — logs stale closure value (always previous state)
function Story() {
    const { userName } = useParams()
    const dispatch = useDispatch()
    const { storyData } = useSelector(state => state.story)

    const handleStory = async () => {
        dispatch(setStoryData(null))
        try {
            const result = await axiosInstance.get(`/api/story/getByUserName/${userName}`)
            dispatch(setStoryData(result.data[0]))
        } catch (error) {
            if (error.response?.status !== 401) {
                console.error("getStory error:", error.message)
            }
        }
    }

    useEffect(() => {
        if (userName) {
            handleStory()
        }
    }, [userName])

    // HINGLISH: Story page — full screen immersive story viewer wrapper
    return (
        <div className='w-full h-[100vh] flex justify-center items-center' style={{ background: '#000' }}>
            {storyData ? <StoryCard storyData={storyData} /> : (
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full border-2 border-purple-500 border-t-transparent spin-slow" />
                    <p className="text-white text-sm">Loading story...</p>
                </div>
            )}
        </div>
    )
}

export default Story
