import React, { useRef, useState } from 'react'
import { MdOutlineKeyboardBackspace } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import { FiPlusSquare } from 'react-icons/fi'
import VideoPlayer from '../components/VideoPlayer'
import { useDispatch, useSelector } from 'react-redux'
import { setPostData } from '../redux/postSlice'
import { setCurrentUserStory } from '../redux/storySlice'
import { setLoopData } from '../redux/loopSlice'
import { ClipLoader } from 'react-spinners'
import axiosInstance from '../lib/axiosInstance'
import Layout from '../components/layout/Layout'
// HINGLISH: Upload page — media upload karne ka premium camera-style screen
// FIX: Switched all upload functions from raw axios to axiosInstance for auto auth-refresh
function Upload() {
  const navigate = useNavigate()
  const searchParams = new URLSearchParams(window.location.search)
  const queryType = searchParams.get("type")
  const isCode = searchParams.get("code") === "true"

  const [uploadType, setUploadType] = useState(queryType || "post")
  const [frontendMedia, setFrontendMedia] = useState(null)
  const [backendMedia, setBackendMedia] = useState(null)
  const [mediaType, setMediaType] = useState("")
  const [caption, setCaption] = useState(isCode ? "```javascript\n\n```" : "")
  const [error, setError] = useState("")
  const mediaInput = useRef()
  const dispatch = useDispatch()
  const { postData } = useSelector(state => state.post)
  const { loopData } = useSelector(state => state.loop)
  const [loading, setLoading] = useState(false)

  // AI Caption generation states
  const [vibe, setVibe] = useState("")
  const [aiCaptions, setAiCaptions] = useState([])
  const [generating, setGenerating] = useState(false)
  const [aiError, setAiError] = useState("")

  const handleMedia = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setMediaType(file.type.includes("image") ? "image" : "video")
    setBackendMedia(file)
    setFrontendMedia(URL.createObjectURL(file))
    setError("")
  }

  const handleGenerateCaption = async () => {
    if (!backendMedia) return
    setGenerating(true)
    setAiError("")
    try {
      const formData = new FormData()
      formData.append("image", backendMedia)
      formData.append("vibe", vibe)

      const response = await axiosInstance.post("/api/caption/generate", formData)
      if (response.data?.success && response.data?.captions) {
        setAiCaptions(response.data.captions)
      } else {
        setAiError("Failed to generate captions. Please try again.")
      }
    } catch (err) {
      console.error("Caption generation error:", err)
      setAiError(err.response?.data?.message || "Error generating captions. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  // HINGLISH: Post upload API
  const uploadPost = async () => {
    try {
      const formData = new FormData()
      formData.append("caption", caption)
      formData.append("mediaType", mediaType)
      formData.append("media", backendMedia)
      // FIX: axiosInstance handles withCredentials + baseURL + auto auth refresh
      const result = await axiosInstance.post("/api/post/upload", formData)
      dispatch(setPostData([result.data, ...postData]))
      setLoading(false)
      navigate("/")
    } catch (error) {
      console.error("uploadPost error:", error)
      setError(error.response?.data?.message || "Upload failed. Check your connection and try again.")
      setLoading(false)
    }
  }

  // HINGLISH: Story upload API
  const uploadStory = async () => {
    try {
      if (!backendMedia) {
        setError("Please select a file before uploading your story.")
        setLoading(false)
        return
      }

      if (!mediaType) {
        setError("Unable to determine media type. Please choose another file.")
        setLoading(false)
        return
      }

      console.debug("uploadStory selectedFile:", {
        name: backendMedia.name,
        type: backendMedia.type,
        size: backendMedia.size
      })
      const formData = new FormData()
      formData.append("mediaType", mediaType)
      formData.append("media", backendMedia)
      for (const entry of formData.entries()) {
        console.debug("uploadStory formData entry:", entry[0], entry[1])
      }

      const result = await axiosInstance.post("/api/story/upload", formData)
      dispatch(setCurrentUserStory(result.data))
      setLoading(false)
      navigate("/")
    } catch (error) {
      console.error("uploadStory error:", error)
      setError(error.response?.data?.message || "Story upload failed.")
      setLoading(false)
    }
  }

  // HINGLISH: Loop upload API
  const uploadLoop = async () => {
    try {
      const formData = new FormData()
      formData.append("caption", caption)
      formData.append("media", backendMedia)
      const result = await axiosInstance.post("/api/loop/upload", formData)
      dispatch(setLoopData([result.data, ...loopData]))
      setLoading(false)
      navigate("/")
    } catch (error) {
      console.error("uploadLoop error:", error)
      setError(error.response?.data?.message || "Loop upload failed.")
      setLoading(false)
    }
  }

  const handleUpload = () => {
    if (!backendMedia) return
    setError("")
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
    <Layout>
      <div className="w-full min-h-screen flex flex-col bg-[var(--background)] text-[var(--text-primary)]">

        {/* HINGLISH: Header */}
        <div className="flex items-center justify-between px-4 py-4 bg-[var(--background)]/95 backdrop-blur-md border-b border-[var(--border)]">
          <button className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            onClick={() => navigate('/')}>
            <MdOutlineKeyboardBackspace size={22} />
          </button>
          <h1 className="text-base font-bold text-[var(--text-primary)]">Create</h1>
          {frontendMedia ? (
            <button
              className="text-sm font-semibold gradient-text hover:opacity-80"
              onClick={handleUpload}
              disabled={loading}>
              {loading ? <ClipLoader size={16} color="var(--primary)" /> : "Share"}
            </button>
          ) : <div className="w-12" />}
        </div>

        <div className="flex-1 flex flex-col items-center px-5 pt-6 pb-16">

          {/* HINGLISH: Type selector tabs — Post, Story, Loop */}
          <div className="flex gap-2 mb-8 p-1 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)]">
            {types.map(({ key, label, icon }) => (
              <button key={key}
                style={{
                  background: uploadType === key ? 'linear-gradient(135deg, #8B5CF6, #EC4899)' : 'transparent',
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  uploadType === key ? 'text-white font-bold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                onClick={() => { setUploadType(key); setFrontendMedia(null); setBackendMedia(null); setCaption(""); setError(""); setVibe(""); setAiCaptions([]); setAiError("") }}>
                <span>{icon}</span>
                {label}
              </button>
            ))}
          </div>

          {/* HINGLISH: Error display */}
          {error && (
            <div className="w-full max-w-[400px] mb-4 p-3 rounded-xl text-sm text-[var(--danger)] text-center bg-[var(--danger)]/10 border border-[var(--danger)]/20">
              {error}
            </div>
          )}

          {/* HINGLISH: Media picker — koi media nahi hai to show karo */}
          {!frontendMedia && (
            <div
              className="w-full max-w-[400px] aspect-square flex flex-col items-center justify-center gap-4 rounded-3xl cursor-pointer hover:bg-[var(--hover)] transition-all bg-[var(--background-secondary)] border-2 border-dashed border-[var(--primary)]/30"
              onClick={() => mediaInput.current.click()}>
              <input
                type="file"
                accept={uploadType === "loop" ? "video/*" : "image/*,video/*"}
                hidden
                ref={mediaInput}
                onChange={handleMedia}
              />
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[var(--primary)]/15">
                <FiPlusSquare className="text-[var(--primary)]" size={28} />
              </div>
              <div className="text-center">
                <p className="text-[var(--text-primary)] font-semibold">Tap to add {uploadType}</p>
                <p className="text-xs mt-1 text-[var(--text-muted)]">
                  {uploadType === 'loop' ? 'Video only' : 'Photo or video'}
                </p>
              </div>
            </div>
          )}

          {/* HINGLISH: Media preview + caption */}
          {frontendMedia && (
            <div className="w-full max-w-[400px] flex flex-col gap-4">
              {/* HINGLISH: Preview */}
              <div className="w-full rounded-3xl overflow-hidden border border-[var(--border)] bg-[var(--background-secondary)]">
                {mediaType === "image" ? (
                  <img src={frontendMedia} alt="" className="w-full max-h-[400px] object-cover" />
                ) : (
                  <VideoPlayer media={frontendMedia} />
                )}
              </div>

              {/* HINGLISH: Caption input — stories mein nahi hota */}
              {uploadType !== "story" && (
                <>
                  <div className="relative">
                    <textarea
                      rows={3}
                      placeholder="Write a caption..."
                      className="w-full rounded-2xl px-4 py-3 text-sm resize-none bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-colors"
                      onChange={(e) => setCaption(e.target.value)}
                      value={caption}
                    />
                    <span className="absolute bottom-3 right-3 text-xs text-[var(--text-muted)]">
                      {caption.length}/2200
                    </span>
                  </div>

                  {mediaType === "image" && (
                    <div className="flex flex-col gap-2 mt-1">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Optional vibe (e.g. witty, aesthetic, sunset)..."
                          className="flex-1 rounded-xl px-3 py-2 text-xs bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-colors"
                          value={vibe}
                          onChange={(e) => setVibe(e.target.value)}
                        />
                        <button
                          type="button"
                          disabled={generating}
                          onClick={handleGenerateCaption}
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 disabled:opacity-50 cursor-pointer flex items-center gap-1 transition-all"
                          style={{
                            background: 'linear-gradient(135deg, #8B5CF6, #EC4899)'
                          }}
                        >
                          {generating ? (
                            <>
                              <ClipLoader size={12} color="white" />
                              <span>Generating...</span>
                            </>
                          ) : (
                            <span>✨ Generate Caption</span>
                          )}
                        </button>
                      </div>
                      {aiError && (
                        <p className="text-[var(--danger)] text-[11px] text-center bg-[var(--danger)]/10 py-1.5 px-2 rounded-lg border border-[var(--danger)]/20 mt-1">{aiError}</p>
                      )}

                      {aiCaptions.length > 0 && (
                        <div className="mt-2 p-3.5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md flex flex-col gap-2.5">
                          <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-between">
                            <span>✨ AI Suggestions</span>
                            <span className="text-[9px] text-[var(--primary)] normal-case font-normal">Click to apply</span>
                          </h3>
                          <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
                            {aiCaptions.map((c, idx) => (
                              <div
                                key={idx}
                                onClick={() => setCaption(c.text)}
                                className="p-2.5 rounded-xl cursor-pointer border border-white/5 bg-white/[0.02] hover:bg-white/[0.08] hover:border-white/10 transition-all flex flex-col gap-1 text-left"
                              >
                                <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--primary)]">
                                  {c.type}
                                </span>
                                <p className="text-[11px] text-[var(--text-primary)] leading-normal">
                                  {c.text}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* HINGLISH: Change media button */}
              <button
                className="text-sm font-medium gradient-text self-center cursor-pointer hover:opacity-80"
                onClick={() => { setFrontendMedia(null); setBackendMedia(null); setError(""); setVibe(""); setAiCaptions([]); setAiError("") }}>
                Change media
              </button>

              {/* HINGLISH: Upload button */}
              <button
                className="w-full h-[52px] rounded-2xl font-semibold text-white btn-gradient text-sm hover-scale cursor-pointer"
                onClick={handleUpload}
                disabled={loading}>
                {loading ? <ClipLoader size={22} color="white" /> : `Share ${uploadType}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Upload