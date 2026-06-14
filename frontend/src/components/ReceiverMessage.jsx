import React from 'react'
import { useSelector } from 'react-redux'
import dp from "../assets/dp.webp"

// HINGLISH: Receiver message bubble — doosre user ke messages ka dark glass style
function ReceiverMessage({ message }) {
  const { selectedUser } = useSelector(state => state.message)

  return (
    <div className="flex items-end gap-2 justify-start fade-in">
      {/* HINGLISH: Receiver avatar */}
      <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mb-0.5">
        <img src={selectedUser?.profileImage || dp} alt="" className="w-full h-full object-cover" />
      </div>

      <div className="flex flex-col items-start gap-1 max-w-[75%]">
        {/* HINGLISH: Image attachment */}
        {message.image && (
          <div className="rounded-2xl rounded-bl-sm overflow-hidden">
            <img src={message.image} alt="" className="max-h-[200px] object-cover rounded-2xl" />
          </div>
        )}
        {/* HINGLISH: Text bubble — dark glass style */}
        {message.message && (
          <div className="px-4 py-2.5 text-sm text-white leading-relaxed break-words bubble-receiver">
            {message.message}
          </div>
        )}
      </div>
    </div>
  )
}

export default ReceiverMessage
