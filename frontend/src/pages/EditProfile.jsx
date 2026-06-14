import React, { useRef, useState } from 'react'
import { MdOutlineKeyboardBackspace } from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import dp from "../assets/dp.webp"
import axios from 'axios'
import { serverUrl } from '../App'
import { setProfileData, setUserData } from '../redux/userSlice'
import { ClipLoader } from 'react-spinners'

// HINGLISH: EditProfile page — dark premium form for updating user info
function EditProfile() {
  const { userData } = useSelector(state => state.user)
  const navigate = useNavigate()
  const imageInput = useRef()
  const [frontendImage, setFrontendImage] = useState(userData.profileImage || dp)
  const [backendImage, setBackendImage] = useState(null)
  const [name, setName] = useState(userData.name || "")
  const [userName, setUserName] = useState(userData.userName || "")
  const [bio, setBio] = useState(userData.bio || "")
  const [profession, setProfession] = useState(userData.profession || "")
  const [gender, setGender] = useState(userData.gender || "")
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)

  const handleImage = (e) => {
    const file = e.target.files[0]
    setBackendImage(file)
    setFrontendImage(URL.createObjectURL(file))
  }

  // HINGLISH: Profile save karna — API call
  const handleEditProfile = async () => {
    setLoading(true)
    try {
      const formdata = new FormData()
      formdata.append("name", name)
      formdata.append("userName", userName)
      formdata.append("bio", bio)
      formdata.append("profession", profession)
      formdata.append("gender", gender)
      if (backendImage) formdata.append("profileImage", backendImage)
      const result = await axios.post(`${serverUrl}/api/user/editProfile`, formdata, { withCredentials: true })
      dispatch(setProfileData(result.data))
      dispatch(setUserData(result.data))
      setLoading(false)
      navigate(`/profile/${userData.userName}`)
    } catch (error) {
      console.log(error)
      setLoading(false)
    }
  }

  // HINGLISH: Reusable input field
  const Field = ({ label, value, onChange, placeholder }) => (
    <div className="w-full">
      <label className="text-xs font-medium mb-1.5 block" style={{ color: '#9CA3AF' }}>{label}</label>
      <input
        type="text"
        placeholder={placeholder || label}
        className="w-full h-[50px] rounded-2xl px-4 text-sm transition-all"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
        onChange={onChange}
        value={value}
        onFocus={(e) => { e.target.style.borderColor = '#7C3AED'; e.target.style.background = 'rgba(124,58,237,0.08)' }}
        onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)' }}
      />
    </div>
  )

  return (
    <div className="w-full min-h-screen" style={{ background: '#0D1117' }}>

      {/* HINGLISH: Header */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-4 py-4"
        style={{ background: 'rgba(13,17,23,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button className="text-gray-400 hover:text-white transition-colors"
          onClick={() => navigate(`/profile/${userData.userName}`)}>
          <MdOutlineKeyboardBackspace size={22} />
        </button>
        <h1 className="text-base font-bold text-white">Edit Profile</h1>
        <div className="w-8" /> {/* HINGLISH: Spacer for centering */}
      </div>

      <div className="max-w-[500px] mx-auto px-5 pt-8 pb-16">
        {/* HINGLISH: Profile photo change section */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="relative cursor-pointer" onClick={() => imageInput.current.click()}>
            <input type="file" accept="image/*" ref={imageInput} hidden onChange={handleImage} />
            <div className="story-ring-active">
              <div className="w-[90px] h-[90px] rounded-full overflow-hidden" style={{ background: '#0D1117' }}>
                <img src={frontendImage} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
            {/* HINGLISH: Camera overlay icon */}
            <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)', border: '2px solid #0D1117' }}>
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

        {/* HINGLISH: Form fields */}
        <div className="flex flex-col gap-4">
          <Field label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Field label="Username" value={userName} onChange={(e) => setUserName(e.target.value)} />

          {/* HINGLISH: Bio textarea */}
          <div className="w-full">
            <label className="text-xs font-medium mb-1.5 block" style={{ color: '#9CA3AF' }}>Bio</label>
            <textarea
              rows={3}
              placeholder="Write something about yourself..."
              className="w-full rounded-2xl px-4 py-3 text-sm resize-none transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
              onChange={(e) => setBio(e.target.value)}
              value={bio}
              onFocus={(e) => { e.target.style.borderColor = '#7C3AED'; e.target.style.background = 'rgba(124,58,237,0.08)' }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)' }}
            />
          </div>

          <Field label="Profession" value={profession} onChange={(e) => setProfession(e.target.value)} placeholder="e.g. Photographer, Developer..." />

          {/* HINGLISH: Gender select */}
          <div className="w-full">
            <label className="text-xs font-medium mb-1.5 block" style={{ color: '#9CA3AF' }}>Gender</label>
            <select
              className="w-full h-[50px] rounded-2xl px-4 text-sm"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: gender ? 'white' : '#6B7280', outline: 'none', appearance: 'none' }}
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="" disabled style={{ background: '#1C2333' }}>Select Gender</option>
              <option value="Male" style={{ background: '#1C2333', color: 'white' }}>Male</option>
              <option value="Female" style={{ background: '#1C2333', color: 'white' }}>Female</option>
              <option value="Other" style={{ background: '#1C2333', color: 'white' }}>Other</option>
              <option value="Prefer not to say" style={{ background: '#1C2333', color: 'white' }}>Prefer not to say</option>
            </select>
          </div>
        </div>

        {/* HINGLISH: Save button */}
        <button
          className="w-full h-[52px] rounded-2xl font-semibold text-white btn-gradient text-sm mt-8 hover-scale"
          onClick={handleEditProfile}
          disabled={loading}>
          {loading ? <ClipLoader size={22} color="white" /> : "Save Profile"}
        </button>
      </div>
    </div>
  )
}

export default EditProfile
