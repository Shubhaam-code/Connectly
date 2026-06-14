import React from 'react'
import { useSelector } from 'react-redux'
import dp from "../assets/dp.webp"

// HINGLISH: Sender message bubble — apne messages ka gradient style
function SenderMessage({ message }) {
  const { userData } = useSelector(state => state.user)

  return (
    <div className="flex items-end gap-2 justify-end fade-in">
      <div className="flex flex-col items-end gap-1 max-w-[75%]">
        {/* HINGLISH: Image attachment agar hai to */}
        {message.image && (
          <div className="rounded-2xl rounded-br-sm overflow-hidden"
            style={{ boxShadow: '0 4px 15px rgba(124,58,237,0.3)' }}>
            <img src={message.image} alt="" className="max-h-[200px] object-cover rounded-2xl" />
          </div>
        )}
        {/* HINGLISH: Text bubble — gradient purple-pink */}
        {message.message && (
          <div className="px-4 py-2.5 text-sm text-white leading-relaxed break-words bubble-sender"
            style={{ boxShadow: '0 4px 15px rgba(124,58,237,0.25)' }}>
            {message.message}
          </div>
        )}
      </div>

      {/* HINGLISH: Sender avatar */}
      <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mb-0.5">
        <img src={userData?.profileImage || dp} alt="" className="w-full h-full object-cover" />
      </div>
    </div>
  )
}

export default SenderMessage
