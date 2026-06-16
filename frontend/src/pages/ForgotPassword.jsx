import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdOutlineKeyboardBackspace } from "react-icons/md"
import { ClipLoader } from 'react-spinners'
import axiosInstance from '../lib/axiosInstance'

// HINGLISH: ForgotPassword page — OTP verification ke sath premium design
function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // step 1: email, step 2: OTP + new password
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState(["", "", "", ""])
  const [newPassword, setNewPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState("")
  const [success, setSuccess] = useState("")

  // HINGLISH: OTP input handle karna — ek box se doosre me auto jump
  const handleOtpChange = (index, value) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 3) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus()
    }
  }

  const handleSendOtp = async () => {
    setLoading(true); setErr("")
    try {
      // FIXED: route now matches backend /api/auth/forgot-password
      await axiosInstance.post("/api/auth/forgot-password", { email })
      setStep(2)
      setLoading(false)
    } catch (error) {
      setErr(error.response?.data?.message || "Failed to send OTP")
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    setLoading(true); setErr("")
    try {
      const otpString = otp.join("")
      // FIXED: route + field names match backend controller
      await axiosInstance.post("/api/auth/verifyOtp", { email, otp: otpString })
      await axiosInstance.post("/api/auth/reset-password", { email, newPassword })
      setSuccess("Password reset successfully!")
      setTimeout(() => navigate("/signin"), 2000)
      setLoading(false)
    } catch (error) {
      setErr(error.response?.data?.message || "Invalid OTP")
      setLoading(false)
    }
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[var(--background)] to-[var(--background-secondary)] text-[var(--text-primary)]">

      {/* HINGLISH: Animated background orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full orb-float"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full orb-float-delay"
        style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)' }} />

      <div className="w-full max-w-[420px] mx-4 fade-in" style={{ zIndex: 10 }}>
        <div className="glass rounded-3xl p-8 border border-[var(--border)] shadow-2xl bg-[var(--card)]/90 backdrop-blur-2xl">

          {/* HINGLISH: Back button */}
          <button className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6 cursor-pointer"
            onClick={() => step === 1 ? navigate("/signin") : setStep(1)}>
            <MdOutlineKeyboardBackspace size={22} />
            <span className="text-sm">Back</span>
          </button>

          {/* HINGLISH: Shield icon aur heading */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 glow-pulse"
              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(236,72,153,0.3))', border: '2px solid rgba(124,58,237,0.5)' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="url(#grad)" strokeWidth="1.5">
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                </defs>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">{step === 1 ? "Verify your number" : "Enter OTP"}</h2>
            <p className="text-sm mt-2 text-[var(--text-secondary)]">
              {step === 1 ? "Enter the five-digit code sent to" : `Code sent to ${email}`}
            </p>
            {step === 1 && <p className="text-sm mt-1 font-semibold text-[var(--text-secondary)]">+91 XXXXX-XXXXX</p>}
          </div>

          {/* HINGLISH: Step 1 — Email input */}
          {step === 1 && (
            <>
              <div className="relative mb-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full h-[52px] rounded-2xl px-4 text-sm bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-colors placeholder:text-[var(--text-muted)]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {err && <p className="text-[var(--danger)] text-sm text-center mb-3">{err}</p>}
              <button className="w-full h-[52px] rounded-2xl font-semibold text-white btn-gradient text-sm"
                onClick={handleSendOtp} disabled={loading}>
                {loading ? <ClipLoader size={22} color="white" /> : "Send OTP"}
              </button>
            </>
          )}

          {/* HINGLISH: Step 2 — OTP boxes + new password */}
          {step === 2 && (
            <>
              {/* HINGLISH: OTP input boxes — 4 separate squares */}
              <div className="flex gap-3 justify-center mb-6">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength={1}
                    className="w-[60px] h-[60px] text-center text-2xl font-bold rounded-2xl bg-[var(--input-bg)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                    style={{
                      border: digit ? '2px solid var(--primary)' : '1px solid var(--input-border)',
                    }}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  />
                ))}
              </div>

              <div className="relative mb-4">
                <input
                  type="password"
                  placeholder="New Password"
                  className="w-full h-[52px] rounded-2xl px-4 text-sm bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-colors placeholder:text-[var(--text-muted)]"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              {err && <p className="text-[var(--danger)] text-sm text-center mb-3">{err}</p>}
              {success && <p className="text-[var(--success)] text-sm text-center mb-3">{success}</p>}

              <button className="w-full h-[52px] rounded-2xl font-semibold text-white btn-gradient text-sm"
                onClick={handleResetPassword} disabled={loading}>
                {loading ? <ClipLoader size={22} color="white" /> : "Reset Password"}
              </button>

              <p className="text-center mt-4 text-sm text-[var(--text-muted)]">
                Resend code in{" "}
                <span className="text-[var(--primary)] font-semibold">00:30</span>
              </p>
            </>
          )}

          {/* HINGLISH: Secure verification notice */}
          <div className="mt-6 text-center">
            <p className="text-xs text-[var(--text-muted)]">🔒 Secure verification • Your data is protected</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
