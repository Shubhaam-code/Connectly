import React, { useRef, useState, useEffect } from 'react'
import { MdOutlineKeyboardBackspace } from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import dp from "../assets/dp.webp"
import { setProfileData, setUserData } from '../redux/userSlice'
import { ClipLoader } from 'react-spinners'
import axiosInstance from '../lib/axiosInstance'
import { Avatar } from '../components/ui/UIComponents'

// FIX: InputField and Field are defined OUTSIDE the component function.
// When defined inside, React recreates them on every render, causing React
// to see them as brand-new component types → full remount → input loses focus.
// Defining them outside means they are stable references across renders.
const Field = ({ label, value, onChange, placeholder }) => (
  <div className="w-full">
    <label className="text-xs font-medium mb-1.5 block text-[var(--text-secondary)]">{label}</label>
    <input
      type="text"
      placeholder={placeholder || label}
      className="w-full h-[50px] rounded-2xl px-4 text-sm bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-all placeholder:text-[var(--text-muted)]"
      onChange={onChange}
      value={value}
    />
  </div>
)

// HINGLISH: EditProfile page — dark premium form for updating user info
function EditProfile() {
  const { userData } = useSelector(state => state.user)
  const navigate = useNavigate()
  const imageInput = useRef()
  const [frontendImage, setFrontendImage] = useState(userData?.profileImage || dp)
  const [backendImage, setBackendImage] = useState(null)
  const [name, setName] = useState(userData?.name || "")
  const [userName, setUserName] = useState(userData?.userName || "")
  const [bio, setBio] = useState(userData?.bio || "")
  const [profession, setProfession] = useState(userData?.profession || "")
  const [gender, setGender] = useState(userData?.gender || "")
  const [error, setError] = useState("")
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (userData && !isInitialized) {
      setName(userData.name || "")
      setUserName(userData.userName || "")
      setBio(userData.bio || "")
      setProfession(userData.profession || "")
      setGender(userData.gender || "")
      setFrontendImage(userData.profileImage || dp)
      setIsInitialized(true)
    }
  }, [userData, isInitialized])

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setBackendImage(file)
    setFrontendImage(URL.createObjectURL(file))
  }

  // HINGLISH: Profile save karna — API call using axiosInstance (with auto auth-refresh)
  const handleEditProfile = async () => {
    setLoading(true)
    setError("")
    try {
      const formdata = new FormData()
      formdata.append("name", name)
      formdata.append("userName", userName)
      formdata.append("bio", bio)
      formdata.append("profession", profession)
      formdata.append("gender", gender)
      if (backendImage) formdata.append("profileImage", backendImage)

      // FIX: Use axiosInstance instead of raw axios — ensures auth cookies are sent
      // and 401 auto-refresh works. Also removed manual Content-Type header —
      // axios sets multipart/form-data automatically when FormData is the body.
      const result = await axiosInstance.post("/api/user/editProfile", formdata)
      dispatch(setProfileData(result.data))
      dispatch(setUserData(result.data))
      setLoading(false)
      navigate(`/profile/${result.data.userName}`)
    } catch (err) {
      console.error("editProfile error:", err)
      setError(err.response?.data?.message || "Failed to update profile. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="w-full min-h-screen bg-[var(--background)] text-[var(--text-primary)]">

      {/* HINGLISH: Header */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-4 py-4 bg-[var(--background)]/95 backdrop-blur-md border-b border-[var(--border)]">
        <button className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          onClick={() => navigate(`/profile/${userData?.userName}`)}>
          <MdOutlineKeyboardBackspace size={22} />
        </button>
        <h1 className="text-base font-bold text-[var(--text-primary)]">Edit Profile</h1>
        <div className="w-8" /> {/* HINGLISH: Spacer for centering */}
      </div>

      <div className="max-w-[500px] mx-auto px-5 pt-8 pb-16">
        {/* HINGLISH: Profile photo change section */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="relative cursor-pointer" onClick={() => imageInput.current.click()}>
            <input type="file" accept="image/*" ref={imageInput} hidden onChange={handleImage} />
            <div className="story-ring-active">
              <div className="w-[90px] h-[90px] rounded-full overflow-hidden bg-[var(--background)]">
                <Avatar src={frontendImage} alt="" size="w-full h-full" className="w-full h-full hover:scale-100" />
              </div>
            </div>
            {/* HINGLISH: Camera overlay icon */}
            <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center border-2 border-[var(--background)]"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          </div>
          <button
            className="text-sm font-semibold gradient-text"
            onClick={() => imageInput.current.click()}>
            Change Profile Photo
          </button>
        </div>

        {/* HINGLISH: Form fields — all use stable Field component (defined outside) */}
        <div className="flex flex-col gap-4">
          <Field label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Field label="Username" value={userName} onChange={(e) => setUserName(e.target.value)} />

          {/* HINGLISH: Bio textarea */}
          <div className="w-full">
            <label className="text-xs font-medium mb-1.5 block text-[var(--text-secondary)]">Bio</label>
            <textarea
              rows={3}
              placeholder="Write something about yourself..."
              className="w-full rounded-2xl px-4 py-3 text-sm resize-none bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-colors placeholder:text-[var(--text-muted)]"
              onChange={(e) => setBio(e.target.value)}
              value={bio}
            />
          </div>

          <Field label="Profession" value={profession} onChange={(e) => setProfession(e.target.value)} placeholder="e.g. Photographer, Developer..." />

          {/* HINGLISH: Gender select */}
          <div className="w-full">
            <label className="text-xs font-medium mb-1.5 block text-[var(--text-secondary)]">Gender</label>
            <select
              className="w-full h-[50px] rounded-2xl px-4 text-sm bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-colors cursor-pointer"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="" disabled className="bg-[var(--card)] text-[var(--text-muted)]">Select Gender</option>
              <option value="Male" className="bg-[var(--card)] text-[var(--text-primary)]">Male</option>
              <option value="Female" className="bg-[var(--card)] text-[var(--text-primary)]">Female</option>
              <option value="Other" className="bg-[var(--card)] text-[var(--text-primary)]">Other</option>
              <option value="Prefer not to say" className="bg-[var(--card)] text-[var(--text-primary)]">Prefer not to say</option>
            </select>
          </div>
        </div>

        {/* HINGLISH: Error display */}
        {error && (
          <div className="mt-4 p-3 rounded-xl text-sm text-[var(--danger)] text-center bg-[var(--danger)]/10 border border-[var(--danger)]/20">
            {error}
          </div>
        )}

        {/* HINGLISH: Save button */}
        <button
          className="w-full h-[52px] rounded-2xl font-semibold text-white btn-gradient text-sm mt-8 hover-scale cursor-pointer"
          onClick={handleEditProfile}
          disabled={loading}>
          {loading ? <ClipLoader size={22} color="white" /> : "Save Profile"}
        </button>
      </div>
    </div>
  )
}

export default EditProfile
