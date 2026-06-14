import React, { useRef, useState } from 'react'
import { MdOutlineKeyboardBackspace } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import { FiPlusSquare } from 'react-icons/fi'
import VideoPlayer from '../components/VideoPlayer'
import axios from 'axios'
import { serverUrl } from '../App'
import { useDispatch, useSelector } from 'react-redux'
import { setPostData } from '../redux/postSlice'
import { setCurrentUserStory } from '../redux/storySlice'
import { setLoopData } from '../redux/loopSlice'
import { ClipLoader } from 'react-spinners'

// HINGLISH: Upload page — media upload karne ka premium camera-style screen
function Upload() {
  const navigate = useNavigate()
  const [uploadType, setUploadType] = useState("post")
  const [frontendMedia, setFrontendMedia] = useState(null)
  const [backendMedia, setBackendMedia] = useState(null)
  const [mediaType, setMediaType] = useState("")
  const [caption, setCaption] = useState("")
  const mediaInput = useRef()
  const dispatch = useDispatch()
  const { postData } = useSelector(state => state.post)
  const { loopData } = useSelector(state => state.loop)
  const [loading, setLoading] = useState(false)

  const handleMedia = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setMediaType(file.type.includes("image") ? "image" : "video")
    setBackendMedia(file)
    setFrontendMedia(URL.createObjectURL(file))
  }

  // HINGLISH: Post upload API
  const uploadPost = async () => {
    try {
      const formData = new FormData()
      formData.append("caption", caption)
      formData.append("mediaType", mediaType)
      formData.append("media", backendMedia)
      const result = await axios.post(`${serverUrl}/api/post/upload`, formData, { withCredentials: true })
      dispatch(setPostData([...postData, result.data]))
      setLoading(false)
      navigate("/")
    } catch (error) {
      console.log(error)
      setLoading(false)
    }
  }

  // HINGLISH: Story upload API
  const uploadStory = async () => {
    try {
      const formData = new FormData()
      formData.append("mediaType", mediaType)
      formData.append("media", backendMedia)
      const result = await axios.post(`${serverUrl}/api/story/upload`, formData, { withCredentials: true })
      dispatch(setCurrentUserStory(result.data))
      setLoading(false)
      navigate("/")
    } catch (error) {
      console.log(error)
      setLoading(false)
    }
  }

  // HINGLISH: Loop upload API
  const uploadLoop = async () => {
    try {
      const formData = new FormData()
      formData.append("caption", caption)
      formData.append("media", backendMedia)
      const result = await axios.post(`${serverUrl}/api/loop/upload`, formData, { withCredentials: true })
      dispatch(setLoopData([...loopData, result.data]))
      setLoading(false)
      navigate("/")
    } catch (error) {
      console.log(error)
      setLoading(false)
    }
  }

  const handleUpload = () => {
    if (!backendMedia) return
    setLoading(true)
    if (uploadType === "post") uploadPost()
    else if (uploadType === "story") uploadStory()
    else uploadLoop()
  }

  const types = [
    { key: 'post', label: 'Post', icon: '🖼️' },
    { key: 'story', label: 'Story', icon: '📖' },
    { key: 'loop', label: 'Loop', icon: '🎥' },
  ]

  return (
    <div className="w-full min-h-screen flex flex-col" style={{ background: '#0D1117' }}>

      {/* HINGLISH: Header */}
      <div className="flex items-center justify-between px-4 py-4"
        style={{ background: 'rgba(13,17,23,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button className="text-gray-400 hover:text-white transition-colors"
          onClick={() => navigate('/')}>
          <MdOutlineKeyboardBackspace size={22} />
        </button>
        <h1 className="text-base font-bold text-white">Create</h1>
        {frontendMedia ? (
          <button
            className="text-sm font-semibold gradient-text hover:opacity-80"
            onClick={handleUpload}
            disabled={loading}>
            {loading ? <ClipLoader size={16} color="#7C3AED" /> : "Share"}
          </button>
        ) : <div className="w-12" />}
      </div>

      <div className="flex-1 flex flex-col items-center px-5 pt-6 pb-16">

        {/* HINGLISH: Type selector tabs — Post, Story, Loop */}
        <div className="flex gap-2 mb-8 p-1 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {types.map(({ key, label, icon }) => (
            <button key={key}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: uploadType === key ? 'linear-gradient(135deg, #7C3AED, #EC4899)' : 'transparent',
                color: uploadType === key ? 'white' : '#9CA3AF',
              }}
              onClick={() => { setUploadType(key); setFrontendMedia(null); setBackendMedia(null); setCaption("") }}>
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {/* HINGLISH: Media picker — koi media nahi hai to show karo */}
        {!frontendMedia && (
          <div
            className="w-full max-w-[400px] aspect-square flex flex-col items-center justify-center gap-4 rounded-3xl cursor-pointer hover:bg-white/5 transition-all"
            style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(124,58,237,0.3)' }}
            onClick={() => mediaInput.current.click()}>
            <input
              type="file"
              accept={uploadType === "loop" ? "video/*" : "image/*,video/*"}
              hidden
              ref={mediaInput}
              onChange={handleMedia}
            />
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(124,58,237,0.15)' }}>
              <FiPlusSquare className="text-purple-400" size={28} />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold">Tap to add {uploadType}</p>
              <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
                {uploadType === 'loop' ? 'Video only' : 'Photo or video'}
              </p>
            </div>
          </div>
        )}

        {/* HINGLISH: Media preview + caption */}
        {frontendMedia && (
          <div className="w-full max-w-[400px] flex flex-col gap-4">
            {/* HINGLISH: Preview */}
            <div className="w-full rounded-3xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              {mediaType === "image" ? (
                <img src={frontendMedia} alt="" className="w-full max-h-[400px] object-cover" />
              ) : (
                <VideoPlayer media={frontendMedia} />
              )}
            </div>

            {/* HINGLISH: Caption input — stories mein nahi hota */}
            {uploadType !== "story" && (
              <div className="relative">
                <textarea
                  rows={3}
                  placeholder="Write a caption..."
                  className="w-full rounded-2xl px-4 py-3 text-sm resize-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
                  onChange={(e) => setCaption(e.target.value)}
                  value={caption}
                  onFocus={(e) => { e.target.style.borderColor = '#7C3AED' }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
                />
                <span className="absolute bottom-3 right-3 text-xs" style={{ color: '#4B5563' }}>
                  {caption.length}/2200
                </span>
              </div>
            )}

            {/* HINGLISH: Change media button */}
            <button
              className="text-sm font-medium gradient-text"
              onClick={() => { setFrontendMedia(null); setBackendMedia(null) }}>
              Change media
            </button>

            {/* HINGLISH: Upload button */}
            <button
              className="w-full h-[52px] rounded-2xl font-semibold text-white btn-gradient text-sm hover-scale"
              onClick={handleUpload}
              disabled={loading}>
              {loading ? <ClipLoader size={22} color="white" /> : `Share ${uploadType}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Upload