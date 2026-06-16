import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FiX, FiCheck, FiTrash2, FiPlus } from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { setUserData } from "../../redux/userSlice"
import axiosInstance from "../../lib/axiosInstance"
import dp from "../../assets/dp.webp"
import { Avatar } from "../ui/UIComponents"

export const AccountSwitcherModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { userData } = useSelector((state) => state.user)
  const [accounts, setAccounts] = useState([])
  const [loadingId, setLoadingId] = useState(null)

  useEffect(() => {
    if (isOpen) {
      const saved = JSON.parse(localStorage.getItem("savedAccounts") || "[]")
      setAccounts(saved)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSwitch = async (account) => {
    if (account._id === userData?._id) return
    setLoadingId(account._id)
    try {
      const result = await axiosInstance.post("/api/auth/switch-account", {
        refreshToken: account.refreshToken
      })

      // Update local storage with new rotated refresh token
      const updatedAccounts = accounts.map(acc => {
        if (acc._id === result.data._id) {
          return {
            ...acc,
            refreshToken: result.data.refreshToken,
            profileImage: result.data.profileImage,
            name: result.data.name,
            userName: result.data.userName
          }
        }
        return acc
      })
      localStorage.setItem("savedAccounts", JSON.stringify(updatedAccounts))

      // Update Redux state
      dispatch(setUserData(result.data))

      // Refresh to ensure all data hooks and sockets re-initialize cleanly
      window.location.href = "/"
    } catch (err) {
      console.error("Failed to switch account:", err)
      alert(err.response?.data?.message || "Failed to switch account. Please log in again.")
      // Remove invalid/expired account
      handleRemove(account._id)
    } finally {
      setLoadingId(null)
    }
  }

  const handleRemove = (accId) => {
    const updated = accounts.filter(acc => acc._id !== accId)
    setAccounts(updated)
    localStorage.setItem("savedAccounts", JSON.stringify(updated))
  }

  const handleAddAccount = () => {
    onClose()
    navigate("/signup?addAccount=true")
  }

  const handleLoginExisting = () => {
    onClose()
    navigate("/signin?addAccount=true")
  }

  const otherAccounts = accounts.filter(acc => acc._id !== userData?._id)

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
            <span className="text-sm font-bold text-[var(--text-primary)]">Switch Accounts</span>
            <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
              <FiX size={18} />
            </button>
          </div>

          {/* Accounts List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Current Account */}
            <div>
              <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Current Account</p>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)]">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    src={userData?.profileImage || dp}
                    alt=""
                    size="w-10 h-10"
                    className="bg-[var(--hover)] flex-shrink-0"
                  />
                  <div className="truncate">
                    <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{userData?.userName}</p>
                    <p className="text-[10px] text-[var(--text-muted)] truncate">{userData?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--success)] mr-2 flex items-center gap-1 text-[11px] font-medium bg-[var(--success)]/10 px-2 py-0.5 rounded-full border border-[var(--success)]/20">
                    <FiCheck size={12} /> Active
                  </span>
                </div>
              </div>
            </div>

            {/* Other Accounts */}
            <div>
              <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Other Accounts</p>
              <div className="space-y-3">
                {otherAccounts.map((acc) => {
                  const isLoading = loadingId === acc._id
                  return (
                    <div key={acc._id} className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-[var(--hover)] transition-colors">
                      <div
                        className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                        onClick={() => !isLoading && handleSwitch(acc)}
                      >
                        <Avatar
                          src={acc.profileImage || dp}
                          alt=""
                          size="w-10 h-10"
                          className="bg-[var(--hover)] flex-shrink-0"
                        />
                        <div className="truncate">
                          <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{acc.userName}</p>
                          <p className="text-[10px] text-[var(--text-muted)] truncate">{acc.name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSwitch(acc)}
                          disabled={isLoading}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-bold btn-gradient hover-scale flex-shrink-0 disabled:opacity-50 cursor-pointer"
                        >
                          {isLoading ? "Switching..." : "Switch"}
                        </button>

                        <button
                          onClick={() => handleRemove(acc._id)}
                          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors cursor-pointer"
                          title="Remove Account"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
                {otherAccounts.length === 0 && (
                  <p className="text-left text-xs text-[var(--text-muted)] py-4 px-2 italic">No other saved accounts</p>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions: Add Account & Login Existing Account */}
          <div className="p-4 border-t border-[var(--border)] bg-[var(--card)]/50 flex flex-col gap-2 flex-shrink-0">
            <button
              onClick={handleAddAccount}
              className="w-full h-10 rounded-xl font-semibold text-[var(--text-primary)] bg-transparent border border-[var(--border)] hover:bg-[var(--hover)] transition-colors text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <FiPlus size={14} /> Add Account
            </button>
            <button
              onClick={handleLoginExisting}
              className="w-full h-10 rounded-xl font-semibold text-[var(--text-primary)] bg-transparent border border-[var(--border)] hover:bg-[var(--hover)] transition-colors text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <FiPlus size={14} /> Login Existing Account
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default AccountSwitcherModal


