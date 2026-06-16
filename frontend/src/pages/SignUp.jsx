import React, { useState } from 'react'
import { IoIosEye, IoIosEyeOff } from "react-icons/io"
import { ClipLoader } from "react-spinners"
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setUserData } from '../redux/userSlice'
import axiosInstance from '../lib/axiosInstance'

// FIX: Removed Google, Apple, Facebook social login buttons and imports.
// These were decorative-only — clicking them did nothing. Removed to avoid
// confusing users. Only email + password signup remains.

// FIX: InputField defined OUTSIDE component — prevents remount on every keystroke
const InputField = ({ icon, placeholder, type = "text", value, onChange, onKeyDown }) => (
  <div className="relative">
    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">{icon}</div>
    <input
      type={type}
      placeholder={placeholder}
      className="w-full h-[50px] rounded-xl pl-11 pr-4 text-sm bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-all placeholder:text-[var(--text-muted)]"
      onChange={onChange}
      value={value}
      onKeyDown={onKeyDown}
    />
  </div>
)

// HINGLISH: SignUp page — nayi account banane ka premium screen
function SignUp() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [userName, setUserName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [err, setErr] = useState("")
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleSignUp = async () => {
    if (!name || !userName || !email || !password) {
      setErr("All fields are required")
      return
    }
    if (password.length < 6) {
      setErr("Password must be at least 6 characters")
      return
    }
    setLoading(true)
    setErr("")
    try {
      // FIX: Use axiosInstance so withCredentials and baseURL are handled automatically
      const result = await axiosInstance.post("/api/auth/signup", { name, userName, email, password })
      
      // Save account to savedAccounts in localStorage for account switching
      if (result.data && result.data._id) {
        const saved = JSON.parse(localStorage.getItem("savedAccounts") || "[]")
        const newAcc = {
          _id: result.data._id,
          userName: result.data.userName,
          name: result.data.name,
          profileImage: result.data.profileImage,
          refreshToken: result.data.refreshToken
        }
        const existsIdx = saved.findIndex(acc => acc._id === newAcc._id)
        if (existsIdx > -1) {
          saved[existsIdx] = newAcc
        } else {
          saved.push(newAcc)
        }
        localStorage.setItem("savedAccounts", JSON.stringify(saved))
      }

      dispatch(setUserData(result.data))
      setLoading(false)
      navigate("/")
    } catch (error) {
      setErr(error.response?.data?.message || "Something went wrong")
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSignUp()
  }

  return (
    // HINGLISH: Full screen dark background with animated orbs
    <div className="w-full min-h-screen flex items-center justify-center relative overflow-hidden py-8 bg-gradient-to-br from-[var(--background)] to-[var(--background-secondary)] text-[var(--text-primary)]">

      {/* HINGLISH: Background blobs */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full orb-float"
        style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full orb-float-delay"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)' }} />

      {/* HINGLISH: Sign up card */}
      <div className="w-full max-w-[420px] mx-4 fade-in" style={{ zIndex: 10 }}>
        <div className="rounded-3xl p-8 border border-[var(--border)] shadow-2xl bg-[var(--card)]/90 backdrop-blur-2xl">

          {/* HINGLISH: Header section */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold gradient-text mb-1">CONNECTLY</h1>
            <p className="text-sm text-[var(--text-secondary)]">Connect. Express. Be you.</p>
            <div className="mt-3">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Create account ✨</h2>
              <p className="text-sm mt-1 text-[var(--text-muted)]">Join CONNECTLY today</p>
            </div>
          </div>

          {/* HINGLISH: Input fields */}
          <div className="flex flex-col gap-3 mb-5">
            <InputField
              icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <InputField
              icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
              placeholder="Username"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <InputField
              icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>}
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            {/* HINGLISH: Password with toggle */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password (min 6 characters)"
                className="w-full h-[50px] rounded-xl pl-11 pr-12 text-sm bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-all placeholder:text-[var(--text-muted)]"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                onKeyDown={handleKeyDown}
              />
              <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <IoIosEyeOff size={20} /> : <IoIosEye size={20} />}
              </button>
            </div>
          </div>

          {err && (
            <div className="mb-4 p-3 rounded-xl text-sm text-[var(--danger)] text-center bg-[var(--danger)]/10 border border-[var(--danger)]/20">
              {err}
            </div>
          )}

          {/* HINGLISH: Sign up gradient button */}
          <button
            className="w-full h-[52px] rounded-2xl font-semibold text-white btn-gradient text-sm tracking-wide"
            onClick={handleSignUp}
            disabled={loading}
          >
            {loading ? <ClipLoader size={22} color="white" /> : "Sign Up"}
          </button>

          <p className="text-center mt-5 text-sm text-[var(--text-muted)]">
            Already have an account?{" "}
            <span className="font-semibold cursor-pointer text-[var(--primary)] hover:opacity-85 transition-opacity"
              onClick={() => navigate("/signin")}>
              Login
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignUp
