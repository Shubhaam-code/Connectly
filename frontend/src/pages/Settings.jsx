import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdOutlineKeyboardBackspace, MdOutlineLogout, MdLock, MdShield, MdPalette, MdHelp, MdInfo } from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'
import { setUserData } from '../redux/userSlice'
import axiosInstance from '../lib/axiosInstance'
import dp from '../assets/dp.webp'
import Layout from '../components/layout/Layout'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar } from '../components/ui/UIComponents'

// HINGLISH: Settings page — CONNECTLY ka premium settings dashboard
function Settings() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { userData } = useSelector(state => state.user)

  const [subPage, setSubPage] = useState(null) // null | 'privacy-security' | 'appearance' | 'help' | 'about'

  // Privacy & Security Form State
  const [email, setEmail] = useState(userData?.email || "")
  const [phone, setPhone] = useState(userData?.phone || "")
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(userData?.twoFactorEnabled || false)
  const [profileVisibility, setProfileVisibility] = useState(userData?.profileVisibility || "public")
  const [postVisibility, setPostVisibility] = useState(userData?.postVisibility || "public")
  const [storyVisibility, setStoryVisibility] = useState(userData?.storyVisibility || "public")
  const [messagePermissions, setMessagePermissions] = useState(userData?.messagePermissions || "everyone")
  const [pushNotifications, setPushNotifications] = useState(userData?.pushNotifications !== false)
  const [emailNotifications, setEmailNotifications] = useState(userData?.emailNotifications !== false)
  const [messageNotifications, setMessageNotifications] = useState(userData?.messageNotifications !== false)

  // Password Reset Form State
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Sessions list state
  const [sessions, setSessions] = useState([])
  const [sessionsLoading, setSessionsLoading] = useState(false)

  // Help center states
  const [ticketCategory, setTicketCategory] = useState("general")
  const [ticketEmail, setTicketEmail] = useState(userData?.email || "")
  const [ticketMessage, setTicketMessage] = useState("")
  const [ticketLoading, setTicketLoading] = useState(false)
  const [faqSearch, setFaqSearch] = useState("")

  // Appearance/Theme selection state
  const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem("theme") || "system")

  const handleSetSubPage = (page) => {
    setSubPage(page)
    if (page) {
      navigate(`/settings?tab=${page}`)
    } else {
      navigate('/settings')
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get("tab")
    if (tab) {
      setSubPage(tab)
    }
  }, [])

  // Synchronize field inputs if userData loads or updates
  useEffect(() => {
    if (userData) {
      setEmail(userData.email || "")
      setPhone(userData.phone || "")
      setTwoFactorEnabled(userData.twoFactorEnabled || false)
      setProfileVisibility(userData.profileVisibility || "public")
      setPostVisibility(userData.postVisibility || "public")
      setStoryVisibility(userData.storyVisibility || "public")
      setMessagePermissions(userData.messagePermissions || "everyone")
      setPushNotifications(userData.pushNotifications !== false)
      setEmailNotifications(userData.emailNotifications !== false)
      setMessageNotifications(userData.messageNotifications !== false)
    }
  }, [userData])

  // Fetch active sessions
  const fetchSessions = async () => {
    setSessionsLoading(true)
    try {
      const res = await axiosInstance.get("/api/user/sessions")
      setSessions(res.data)
    } catch (err) {
      console.error("fetchSessions error:", err)
    } finally {
      setSessionsLoading(false)
    }
  }

  useEffect(() => {
    if (subPage === 'privacy-security') {
      fetchSessions()
    }
  }, [subPage])

  const handleLogOut = async () => {
    try {
      await axiosInstance.get("/api/auth/signout")
      dispatch(setUserData(null))
      navigate("/signin")
    } catch (error) {
      console.error("logout error:", error.message)
      dispatch(setUserData(null))
      navigate("/signin")
    }
  }

  // Update Settings/Preferences
  const handleUpdatePreferences = async (updates) => {
    try {
      const res = await axiosInstance.post("/api/user/editProfile", updates)
      dispatch(setUserData(res.data))
    } catch (error) {
      console.error("handleUpdatePreferences error:", error)
      alert("Failed to save changes: " + (error.response?.data?.message || error.message))
    }
  }

  // Change Password Action
  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!currentPassword || !newPassword) {
      alert("Please enter both current and new passwords")
      return
    }
    setPasswordLoading(true)
    try {
      await axiosInstance.post("/api/user/editProfile", { currentPassword, newPassword })
      alert("Password updated successfully!")
      setCurrentPassword("")
      setNewPassword("")
    } catch (error) {
      console.error(error)
      alert("Failed to update password: " + (error.response?.data?.message || error.message))
    } finally {
      setPasswordLoading(false)
    }
  }

  // Revoke Session Action
  const handleRevokeSession = async (sessionId) => {
    if (!window.confirm("Are you sure you want to revoke this session? You will be logged out of that device.")) return
    try {
      await axiosInstance.delete(`/api/user/sessions/${sessionId}`)
      setSessions(prev => prev.filter(s => s._id !== sessionId))
      alert("Session revoked successfully")
    } catch (err) {
      console.error("Revocation failed:", err)
      alert("Failed to revoke session")
    }
  }

  // Submit Support Ticket Action
  const handleSubmitTicket = async (e) => {
    e.preventDefault()
    if (!ticketMessage.trim() || !ticketEmail.trim()) {
      alert("Please fill in email and message")
      return
    }
    setTicketLoading(true)
    try {
      await axiosInstance.post("/api/user/support", {
        email: ticketEmail,
        category: ticketCategory,
        message: ticketMessage
      })
      alert("Support request submitted successfully! Our team will contact you shortly.")
      setTicketMessage("")
    } catch (error) {
      console.error(error)
      alert("Submission failed. Please try again.")
    } finally {
      setTicketLoading(false)
    }
  }

  // Personal data download as JSON
  const handleDownloadPersonalData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(userData, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute("href", dataStr)
    downloadAnchor.setAttribute("download", `connectly_personal_data_${userData?.userName}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  // Delete Account action
  const handleDeleteAccount = async () => {
    const doubleConfirm = window.confirm("WARNING: Deleting your account will permanently remove all your posts, loops, messages, and profile information. This cannot be undone. Are you sure you want to proceed?")
    if (!doubleConfirm) return
    const finalConfirm = window.prompt("To confirm deletion, please type your username:")
    if (finalConfirm?.toLowerCase() !== userData?.userName?.toLowerCase()) {
      alert("Username mismatch. Deletion cancelled.")
      return
    }
    try {
      await axiosInstance.delete("/api/user/delete-account")
      dispatch(setUserData(null))
      navigate("/signin")
      alert("Your account has been deleted successfully.")
    } catch (err) {
      console.error("Account deletion failed:", err)
      alert("Failed to delete account. Please contact support.")
    }
  }

  // Theme changer logic
  const handleThemeChange = (theme) => {
    setActiveTheme(theme)
    localStorage.setItem("theme", theme)
    if (theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark")
      document.documentElement.classList.remove("light")
    } else {
      document.documentElement.classList.add("light")
      document.documentElement.classList.remove("dark")
    }
  }

  // Block/unblock, Mute/unmute helpers
  const handleUnblock = async (blockedId) => {
    try {
      const res = await axiosInstance.post("/api/user/editProfile", { unblockUserId: blockedId })
      dispatch(setUserData(res.data))
    } catch (err) {
      console.error(err)
    }
  }

  const handleUnmute = async (mutedId) => {
    try {
      const res = await axiosInstance.post("/api/user/editProfile", { unmuteUserId: mutedId })
      dispatch(setUserData(res.data))
    } catch (err) {
      console.error(err)
    }
  }

  // FAQs mapping
  const faqs = [
    { q: "How do I upload a Loop?", a: "To upload a Loop (Reel), navigate to the 'Create' section in the sidebar. Select the 'Loop' tab at the top, select your short video file, add a description, and tap Share!" },
    { q: "How do I share a post in chat?", a: "Open any post details modal. Click the Share icon (paper airplane symbol), select the chat friend you want to share with from your messenger list, and send." },
    { q: "How does 2-Factor Authentication (2FA) work?", a: "When 2FA is active, every sign-in attempt requires a unique 4-digit security code sent to your registered email address. This secures your account even if your password is stolen." },
    { q: "Can I download my personal data?", a: "Yes, under the Privacy & Security panel, look for the 'Personal Data Export' box and click the Download JSON button to retrieve your full stored data profile." },
    { q: "How do I delete my account?", a: "At the bottom of the Privacy & Security panel, locate the Danger Zone, click 'Delete Account' and complete the validation prompts. This will permanently delete your account." }
  ]

  const filteredFaqs = faqs.filter(faq => 
    faq.q.toLowerCase().includes(faqSearch.toLowerCase()) || 
    faq.a.toLowerCase().includes(faqSearch.toLowerCase())
  )

  const mainSections = [
    {
      title: 'Account Control Panel',
      items: [
        {
          icon: <MdShield size={18} className="text-purple-500" />,
          label: 'Privacy & Security Controls',
          action: () => handleSetSubPage('privacy-security')
        },
        {
          icon: <MdPalette size={18} className="text-pink-500" />,
          label: 'Appearance Mode',
          badge: activeTheme === 'dark' ? 'Dark' : activeTheme === 'light' ? 'Light' : 'System',
          action: () => handleSetSubPage('appearance')
        },
      ]
    },
    {
      title: 'Support Center',
      items: [
        {
          icon: <MdHelp size={18} className="text-blue-500" />,
          label: 'Help & Frequently Asked Questions',
          action: () => handleSetSubPage('help')
        },
        {
          icon: <MdInfo size={18} className="text-gray-500" />,
          label: 'Policies, Guidelines & About',
          action: () => handleSetSubPage('about')
        },
      ]
    }
  ]

  return (
    <Layout>
      <div className="w-full min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
        
        {/* Header */}
        <div className="sticky top-0 z-40 flex items-center gap-3 px-4 py-4 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
          <button 
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            onClick={() => subPage ? handleSetSubPage(null) : navigate(`/profile/${userData?.userName}`)}
          >
            <MdOutlineKeyboardBackspace size={22} />
          </button>
          <h1 className="text-sm md:text-base font-bold">
            {subPage === 'privacy-security' ? 'Privacy & Security' :
             subPage === 'appearance' ? 'Appearance Mode' :
             subPage === 'help' ? 'Help Center & FAQs' :
             subPage === 'about' ? 'About CONNECTLY' : 'Settings'}
          </h1>
        </div>

        <div className="max-w-[600px] mx-auto px-4 pt-6 pb-24">
          <AnimatePresence mode="wait">
            {!subPage ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* User Info Card */}
                <div 
                  className="flex items-center gap-4 p-5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl cursor-pointer hover:border-[var(--primary)]/40 transition-all"
                  onClick={() => navigate(`/profile/${userData?.userName}`)}
                >
                  <div className="w-14 h-14 rounded-full overflow-hidden border border-[var(--border-color)] bg-[var(--hover)]">
                    <Avatar src={userData?.profileImage || dp} alt="" size="w-full h-full" className="w-full h-full hover:scale-100" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[var(--text-primary)]">{userData?.name}</div>
                    <div className="text-xs text-[var(--text-secondary)]">@{userData?.userName}</div>
                    <div className="text-[10px] text-[var(--primary)] font-semibold mt-0.5">{userData?.profession || "CONNECTLY Creator"}</div>
                  </div>
                  <svg className="ml-auto text-[var(--text-secondary)]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>

                {/* Main Menu Sections */}
                {mainSections.map((section) => (
                  <div key={section.title} className="space-y-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] px-1">
                      {section.title}
                    </h2>
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl overflow-hidden">
                      {section.items.map((item, index) => (
                        <button
                          key={item.label}
                          className="w-full flex items-center gap-3 px-4 py-4 hover:bg-white/[0.02] transition-all text-left"
                          style={{ borderBottom: index < section.items.length - 1 ? '1px solid var(--border-color)' : 'none' }}
                          onClick={item.action}
                        >
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-[var(--bg-primary)] border border-[var(--border-color)]">
                            {item.icon}
                          </div>
                          <span className="flex-1 text-xs font-semibold text-[var(--text-primary)]">{item.label}</span>
                          {item.badge && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mr-2 bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
                              {item.badge}
                            </span>
                          )}
                          <svg className="text-[var(--text-secondary)] flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Logout Button */}
                <button
                  className="w-full flex items-center justify-center gap-2 h-[52px] bg-[var(--danger)]/5 hover:bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-[var(--danger)] rounded-2xl font-bold text-xs transition-all hover-scale cursor-pointer"
                  onClick={handleLogOut}
                >
                  <MdOutlineLogout size={16} />
                  Log Out
                </button>

                <p className="text-center text-[10px] text-[var(--text-secondary)] pt-4">
                  CONNECTLY v1.0.0 • Premium Social Media Web Experience
                </p>
              </motion.div>
            ) : subPage === 'privacy-security' ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Personal Details Form */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-bold border-b border-[var(--border-color)] pb-2">Profile & Access Information</h3>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Registered Email</label>
                    <div className="flex gap-2">
                      <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yourname@domain.com"
                        className="flex-1 input-dark px-3 py-2 text-xs rounded-xl"
                      />
                      <button 
                        onClick={() => handleUpdatePreferences({ email })}
                        className="px-4 py-2 bg-[var(--primary)] hover:opacity-90 text-white rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Update
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Phone Number</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 XXXXX XXXXX"
                        className="flex-1 input-dark px-3 py-2 text-xs rounded-xl"
                      />
                      <button 
                        onClick={() => handleUpdatePreferences({ phone })}
                        className="px-4 py-2 bg-[var(--primary)] hover:opacity-90 text-white rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </div>

                {/* Privacy & Visibility Settings */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-bold border-b border-[var(--border-color)] pb-2">Content Visibility Preferences</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold text-[var(--text-secondary)]">Profile Search Visibility</label>
                      <select 
                        value={profileVisibility}
                        onChange={(e) => {
                          setProfileVisibility(e.target.value)
                          handleUpdatePreferences({ profileVisibility: e.target.value })
                        }}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl px-3 py-2 text-xs outline-none"
                      >
                        <option value="public">Public (Everyone)</option>
                        <option value="private">Private (Approval Only)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold text-[var(--text-secondary)]">Post Visibilty Rules</label>
                      <select 
                        value={postVisibility}
                        onChange={(e) => {
                          setPostVisibility(e.target.value)
                          handleUpdatePreferences({ postVisibility: e.target.value })
                        }}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl px-3 py-2 text-xs outline-none"
                      >
                        <option value="public">Public (Everyone)</option>
                        <option value="followers">Followers Only</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold text-[var(--text-secondary)]">Story Ring Visibility</label>
                      <select 
                        value={storyVisibility}
                        onChange={(e) => {
                          setStoryVisibility(e.target.value)
                          handleUpdatePreferences({ storyVisibility: e.target.value })
                        }}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl px-3 py-2 text-xs outline-none"
                      >
                        <option value="public">Public (Everyone)</option>
                        <option value="followers">Followers Only</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold text-[var(--text-secondary)]">Who can message you</label>
                      <select 
                        value={messagePermissions}
                        onChange={(e) => {
                          setMessagePermissions(e.target.value)
                          handleUpdatePreferences({ messagePermissions: e.target.value })
                        }}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl px-3 py-2 text-xs outline-none"
                      >
                        <option value="everyone">Everyone</option>
                        <option value="followers">Followers Only</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Security Settings: Password & 2FA */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-bold border-b border-[var(--border-color)] pb-2 flex items-center gap-2">
                    <MdLock className="text-purple-500" /> Account Security
                  </h3>

                  {/* 2FA Toggle */}
                  <div className="flex items-center justify-between py-2 border-b border-[var(--border-color)]">
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text-primary)]">2-Factor Authentication (2FA)</h4>
                      <p className="text-[10px] text-[var(--text-secondary)]">Require an email OTP whenever signing in</p>
                    </div>
                    {/* iOS Switch Toggle style */}
                    <button 
                      onClick={() => {
                        const nextVal = !twoFactorEnabled
                        setTwoFactorEnabled(nextVal)
                        handleUpdatePreferences({ twoFactorEnabled: nextVal })
                      }}
                      className={`w-11 h-6 rounded-full flex items-center p-0.5 transition-all cursor-pointer ${
                        twoFactorEnabled ? "bg-[var(--primary)]" : "bg-[var(--border)]"
                      }`}
                    >
                      <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-all duration-300 ${
                        twoFactorEnabled ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  {/* Update Password Form */}
                  <form onSubmit={handleChangePassword} className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-[var(--text-primary)]">Change Account Password</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="password"
                        placeholder="Current Password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="input-dark px-3 py-2 text-xs rounded-xl"
                      />
                      <input 
                        type="password"
                        placeholder="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="input-dark px-3 py-2 text-xs rounded-xl"
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={passwordLoading}
                      className="w-full h-9 bg-[var(--primary)] hover:opacity-90 text-white rounded-xl text-xs font-semibold flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {passwordLoading ? "Saving Password..." : "Save Password Changes"}
                    </button>
                  </form>
                </div>

                {/* Notifications Preferences */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-bold border-b border-[var(--border-color)] pb-2">Notifications Preference Rules</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'push', label: 'Push Notifications', val: pushNotifications, setter: setPushNotifications, param: 'pushNotifications' },
                      { key: 'email', label: 'Email Alerts', val: emailNotifications, setter: setEmailNotifications, param: 'emailNotifications' },
                      { key: 'message', label: 'Direct Messages alerts', val: messageNotifications, setter: setMessageNotifications, param: 'messageNotifications' }
                    ].map((pref) => (
                      <div key={pref.key} className="flex justify-between items-center">
                        <span className="text-xs text-[var(--text-primary)]">{pref.label}</span>
                        <button 
                          onClick={() => {
                            const nv = !pref.val
                            pref.setter(nv)
                            handleUpdatePreferences({ [pref.param]: nv })
                          }}
                          className={`w-11 h-6 rounded-full flex items-center p-0.5 transition-all cursor-pointer ${
                            pref.val ? "bg-[var(--primary)]" : "bg-[var(--border)]"
                          }`}
                        >
                          <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-all duration-300 ${
                            pref.val ? "translate-x-5" : "translate-x-0"
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Sessions Management */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-bold border-b border-[var(--border-color)] pb-2">Active Logged-in Sessions</h3>
                  {sessionsLoading ? (
                    <div className="text-center py-4 text-xs text-[var(--text-secondary)]">Loading sessions...</div>
                  ) : sessions.length > 0 ? (
                    <div className="space-y-3">
                      {sessions.map((sess) => (
                        <div key={sess._id} className="flex items-center justify-between p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl text-[10px] md:text-xs">
                          <div>
                            <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                              {sess.osName} • {sess.browserName}
                              {sess.refreshToken === localStorage.getItem("refreshToken") && (
                                <span className="bg-[var(--success)]/10 text-[var(--success)] text-[8px] font-bold px-1.5 py-0.5 rounded border border-[var(--success)]/20 uppercase">Current Device</span>
                              )}
                            </div>
                            <p className="text-[var(--text-secondary)] mt-0.5">IP: {sess.ipAddress} • Type: {sess.deviceType}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">Last Active: {new Date(sess.lastActive).toLocaleString()}</p>
                          </div>
                          <button
                            onClick={() => handleRevokeSession(sess._id)}
                            className="px-2.5 py-1 bg-[var(--danger)]/10 hover:bg-[var(--danger)]/20 text-[var(--danger)] border border-[var(--danger)]/25 rounded-lg font-bold text-[10px] transition-all cursor-pointer"
                          >
                            Revoke
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--text-secondary)] text-center py-4">No active sessions logs found.</p>
                  )}
                </div>

                {/* Muted and Blocked users tables */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-bold border-b border-[var(--border-color)] pb-2">Blocked & Muted Accounts</h3>
                  <div className="space-y-4">
                    {/* Blocked Section */}
                    <div>
                      <h4 className="text-xs font-bold text-[var(--danger)] mb-2">Blocked Users ({userData?.blockedUsers?.length || 0})</h4>
                      {userData?.blockedUsers && userData.blockedUsers.length > 0 ? (
                        <div className="space-y-2">
                          {userData.blockedUsers.map((u) => (
                            <div key={u._id} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Avatar src={u.profileImage || dp} alt="" size="w-8 h-8" className="w-8 h-8 hover:scale-100" />
                                <div>
                                  <p className="text-xs font-semibold text-[var(--text-primary)]">{u.userName}</p>
                                  <p className="text-[10px] text-[var(--text-muted)]">{u.name}</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleUnblock(u._id)}
                                className="px-2 py-1 bg-[var(--hover)] hover:opacity-85 text-[var(--text-primary)] rounded text-[10px] font-semibold cursor-pointer border border-[var(--border)]"
                              >
                                Unblock
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-[var(--text-muted)]">No blocked users</p>
                      )}
                    </div>
 
                    {/* Muted Section */}
                    <div>
                      <h4 className="text-xs font-bold text-yellow-600 dark:text-yellow-400 mb-2">Muted Users ({userData?.mutedUsers?.length || 0})</h4>
                      {userData?.mutedUsers && userData.mutedUsers.length > 0 ? (
                        <div className="space-y-2">
                          {userData.mutedUsers.map((u) => (
                            <div key={u._id} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Avatar src={u.profileImage || dp} alt="" size="w-8 h-8" className="w-8 h-8 hover:scale-100" />
                                <div>
                                  <p className="text-xs font-semibold text-[var(--text-primary)]">{u.userName}</p>
                                  <p className="text-[10px] text-[var(--text-muted)]">{u.name}</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleUnmute(u._id)}
                                className="px-2 py-1 bg-[var(--hover)] hover:opacity-85 text-[var(--text-primary)] rounded text-[10px] font-semibold cursor-pointer border border-[var(--border)]"
                              >
                                Unmute
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-[var(--text-muted)]">No muted users</p>
                      )}
                    </div>  </div>
                  </div>
                                {/* Privacy compliance personal data export download */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-5 space-y-3">
                  <h3 className="text-sm font-bold border-b border-[var(--border-color)] pb-2 text-[var(--primary)]">Personal Data Export</h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                     Download a comprehensive copy of your personal details, profile metadata, visual preferences, security configs, and identifiers stored on the CONNECTLY platform.
                  </p>
                  <button 
                    onClick={handleDownloadPersonalData}
                    className="w-full py-2 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Download My Data (JSON)
                  </button>
                </div>
 
                {/* Danger Zone: Account Deletion */}
                <div className="bg-[var(--danger)]/5 border border-[var(--danger)]/20 rounded-2xl p-5 space-y-3">
                  <h3 className="text-sm font-bold border-b border-[var(--danger)]/20 pb-2 text-[var(--danger)]">Danger Zone</h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Once you delete your account, your profile is permanently removed, and cannot be restored. All your posts, loop uploads, messages, likes and comments will be wiped completely.
                  </p>
                  <button 
                    onClick={handleDeleteAccount}
                    className="w-full py-2.5 bg-[var(--danger)] hover:opacity-90 text-white rounded-xl text-xs font-bold transition-all cursor-pointer hover-scale"
                  >
                    Permanently Delete Account
                  </button>
                </div>
              </motion.div>
            ) : subPage === 'appearance' ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-5 space-y-6"
              >
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Choose Theme Mode</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Select your preferred design aesthetic for the application interface.</p>
                </div>
 
                <div className="flex flex-col gap-3">
                  {[
                    { key: "light", label: "Light Mode", desc: "Clean background with charcoal-black typography" },
                    { key: "dark", label: "Dark Mode", desc: "Frosted black interface with glow accents" },
                    { key: "system", label: "System Default", desc: "Respect and match device hardware aesthetics" }
                  ].map((themeOpt) => (
                    <div 
                      key={themeOpt.key}
                      onClick={() => handleThemeChange(themeOpt.key)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        activeTheme === themeOpt.key
                          ? "bg-[var(--primary)]/5 border-[var(--primary)] shadow-md shadow-[var(--primary)]/5"
                          : "bg-[var(--bg-primary)] border-[var(--border-color)] hover:border-neutral-500"
                      }`}
                    >
                      <div>
                        <h4 className="text-xs font-bold text-[var(--text-primary)]">{themeOpt.label}</h4>
                        <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{themeOpt.desc}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                        activeTheme === themeOpt.key ? "border-[var(--primary)] bg-[var(--primary)]" : "border-[var(--border)]"
                      }`}>
                        {activeTheme === themeOpt.key && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : subPage === 'help' ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                        {/* FAQ search bar */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-4 flex items-center gap-2.5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)]">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    placeholder="Search help topics or FAQs..."
                    className="w-full text-xs text-[var(--text-primary)] bg-transparent outline-none placeholder:text-[var(--text-muted)]"
                  />
                </div>
 
                {/* Accordion FAQ Groups */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-bold border-b border-[var(--border-color)] pb-2 text-[var(--text-primary)]">Frequently Asked Questions</h3>
                  {filteredFaqs.length > 0 ? (
                    <div className="space-y-3">
                      {filteredFaqs.map((faq, idx) => (
                        <div key={idx} className="border-b border-[var(--border-color)] pb-3 last:border-0 last:pb-0">
                          <h4 className="text-xs font-bold text-[var(--primary)] mb-1 leading-snug">{faq.q}</h4>
                          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{faq.a}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-6 text-xs text-[var(--text-muted)]">No matching help articles found.</p>
                  )}
                </div>                  {/* Support Form submission ticket */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">Submit a Support Request</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">Stuck or encountered a glitch? File a ticket to reach our staff.</p>
                  </div>
                  
                  <form onSubmit={handleSubmitTicket} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-[var(--text-secondary)]">Ticket Category</label>
                      <select 
                        value={ticketCategory}
                        onChange={(e) => setTicketCategory(e.target.value)}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl px-3 py-2.5 text-xs outline-none"
                      >
                        <option value="general">General Support / Enquiry</option>
                        <option value="account">Account Access / Settings</option>
                        <option value="billing">Content / Media Upload Issues</option>
                        <option value="bug">Report a Bug / Vulnerability</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-[var(--text-secondary)]">Email Address for Correspondence</label>
                      <input 
                        type="email"
                        value={ticketEmail}
                        onChange={(e) => setTicketEmail(e.target.value)}
                        placeholder="correspondence@domain.com"
                        className="w-full input-dark px-3 py-2.5 text-xs rounded-xl"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-[var(--text-secondary)]">Elaborate Message</label>
                      <textarea 
                        rows={4}
                        value={ticketMessage}
                        onChange={(e) => setTicketMessage(e.target.value)}
                        placeholder="Explain the issues in detail..."
                        className="w-full input-dark px-3 py-2.5 text-xs rounded-xl resize-none"
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={ticketLoading}
                      className="w-full h-10 bg-[var(--primary)] hover:opacity-90 text-white rounded-xl text-xs font-semibold flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {ticketLoading ? "Submitting Request..." : "File Support Ticket"}
                    </button>
                  </form>
                </div>
              </motion.div>
            ) : subPage === 'about' ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-5 space-y-6"
              >
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">CONNECTLY Information & Policies</h3>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mt-0.5">Platform version 1.0.0 (Release-Build)</p>
                </div>

                <div className="space-y-4 text-xs leading-relaxed text-[var(--text-secondary)]">
                  <div>
                    <h4 className="font-semibold text-[var(--text-primary)] mb-1">1. User Guidelines & Community Standard</h4>
                    <p>
                      CONNECTLY is a space to express yourself safely. We do not tolerate hate speech, offensive uploads, piracy, or targeted harassment. Keep conversations civil, respectful, and pair-focused.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[var(--text-primary)] mb-1">2. Privacy Regulations</h4>
                    <p>
                      Your data is fully protected. We implement strict rate-limiting, session checks, and secure cookies. You maintain full ownership over your posts and loop media uploads. Your visibility settings determine who can see your logs.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[var(--text-primary)] mb-1">3. Developer API Specifications</h4>
                    <p>
                      Third-party access is securely restricted. The platform implements a rate limiting policy of 100 requests per 15 minutes for general authenticated endpoints, and 5 attempts per 15 minutes for sign-in routes to prevent credential harvesting.
                    </p>
                  </div>
                </div>

                <div className="border-t border-[var(--border-color)] pt-4 text-center">
                  <p className="text-[10px] text-[var(--text-muted)]">© 2026 CONNECTLY Inc. All rights reserved.</p>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  )
}

export default Settings
