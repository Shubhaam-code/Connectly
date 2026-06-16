import React, { useState } from 'react'
import { IoIosEye, IoIosEyeOff } from "react-icons/io"
import { ClipLoader } from "react-spinners"
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setUserData } from '../redux/userSlice'
import axiosInstance from '../lib/axiosInstance'

// FIX: Removed Google, Apple, Facebook social login buttons — they were non-functional.
// FIX: Switched from raw axios to axiosInstance for consistent auth handling.

// HINGLISH: SignIn page — CONNECTLY ka premium dark login screen
function SignIn() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  // UPGRADE: identifier accepts both username AND email
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [err, setErr] = useState("")
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleSignIn = async () => {
    if (!identifier || !password) {
      setErr("Username/Email and password are required")
      return
    }
    setLoading(true)
    setErr("")
    try {
      // FIX: Use axiosInstance — handles withCredentials and baseURL consistently
      const result = await axiosInstance.post("/api/auth/signin", { identifier, password, rememberMe })
      
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
      setLoading(false)
      setErr(error.response?.data?.message || "Something went wrong")
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSignIn()
  }

  return (
    // HINGLISH: Full screen dark gradient background
    <div className="w-full min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[var(--background)] to-[var(--background-secondary)] text-[var(--text-primary)]">

      {/* HINGLISH: Background animated blobs — premium feel ke liye */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full orb-float"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full orb-float-delay"
        style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)' }} />
      <div className="absolute top-[50%] left-[50%] w-[300px] h-[300px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)', transform: 'translate(-50%,-50%)' }} />

      {/* HINGLISH: Main login card — glassmorphism with gradient border */}
      <div className="w-full max-w-[420px] mx-4 fade-in" style={{ zIndex: 10 }}>
        <div className="glass rounded-3xl p-8 border border-[var(--border)] shadow-2xl bg-[var(--card)]/90 backdrop-blur-2xl">

          {/* HINGLISH: Logo aur welcome text */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold gradient-text mb-1">CONNECTLY</h1>
            <p className="text-sm text-[var(--text-secondary)]">Connect. Express. Be you.</p>
            <div className="mt-4">
              <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Welcome back 👋</h2>
              <p className="text-sm mt-1 text-[var(--text-muted)]">Login to your CONNECTLY today</p>
            </div>
          </div>

          {/* HINGLISH: Username/Email input field */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Username or Email"
                className="w-full h-[52px] rounded-2xl pl-11 pr-4 text-sm bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-all placeholder:text-[var(--text-muted)]"
                onChange={(e) => setIdentifier(e.target.value)}
                value={identifier}
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* HINGLISH: Password input with show/hide toggle */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full h-[52px] rounded-2xl pl-11 pr-12 text-sm bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-all placeholder:text-[var(--text-muted)]"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                onKeyDown={handleKeyDown}
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <IoIosEyeOff size={20} /> : <IoIosEye size={20} />}
              </button>
            </div>
          </div>

          {/* HINGLISH: Remember Me + Forgot Password row */}
          <div className="flex items-center justify-between mb-6">
            {/* Remember Me checkbox */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                style={{
                  background: rememberMe ? 'linear-gradient(135deg, #7C3AED, #EC4899)' : 'var(--input-bg)',
                }}
                className={`w-5 h-5 rounded-md flex items-center justify-center transition-all border ${
                  rememberMe ? 'border-transparent' : 'border-[var(--input-border)]'
                }`}
                onClick={() => setRememberMe(prev => !prev)}
              >
                {rememberMe && (
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-[var(--text-secondary)]">Remember me</span>
            </label>
            <span
              className="text-sm cursor-pointer text-[var(--primary)] hover:opacity-80 transition-colors"
              onClick={() => navigate("/forgot-password")}
            >
              Forgot Password?
            </span>
          </div>

          {/* HINGLISH: Error message display */}
          {err && (
            <div className="mb-4 p-3 rounded-xl text-sm text-[var(--danger)] text-center bg-[var(--danger)]/10 border border-[var(--danger)]/20">
              {err}
            </div>
          )}

          {/* HINGLISH: Login button — gradient style */}
          <button
            className="w-full h-[52px] rounded-2xl font-semibold text-white btn-gradient text-sm tracking-wide"
            onClick={handleSignIn}
            disabled={loading}
          >
            {loading ? <ClipLoader size={22} color="white" /> : "Login"}
          </button>

          {/* HINGLISH: Sign up redirect */}
          <p className="text-center mt-6 text-sm text-[var(--text-muted)]">
            Don't have an account?{" "}
            <span
              className="font-semibold cursor-pointer text-[var(--primary)] hover:opacity-85 transition-opacity"
              onClick={() => navigate("/signup")}
            >
              Sign up
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignIn
