import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiSearch } from 'react-icons/fi'
import { MdOutlineKeyboardBackspace } from 'react-icons/md'
import axiosInstance from '../lib/axiosInstance'
import dp from "../assets/dp.webp"
import FollowButton from '../components/FollowButton'
import Nav from '../components/Nav'

// HINGLISH: Search/Discover page — trending creators, reels thumbnails, aur user search
function Search() {
  const navigate = useNavigate()
  const [input, setInput] = useState("")
  const [searchData, setSearchData] = useState([])
  const [activeTab, setActiveTab] = useState("ForYou")
  const { suggestedUsers } = useSelector(state => state.user)
  const { postData } = useSelector(state => state.post)
  const { loopData } = useSelector(state => state.loop)
  const dispatch = useDispatch()

  // HINGLISH: Search API call — user type karne par results fetch karna
  const handleSearch = async () => {
    try {
      const result = await axiosInstance.get(`/api/user/search?keyWord=${input}`)
      setSearchData(result.data)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    if (input) {
      handleSearch()
    } else {
      setSearchData([])
    }
  }, [input])

  const tabs = ["ForYou", "Trending", "Reels", "People"]

  return (
    <div className="w-full min-h-screen pb-24 lg:pb-0" style={{ background: '#0D1117' }}>

      {/* HINGLISH: Header with back button and title */}
      <div className="sticky top-0 z-40 px-4 pt-4 pb-3"
        style={{ background: 'rgba(13,17,23,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

        <div className="flex items-center gap-3 mb-3">
          <button className="lg:hidden text-gray-400 hover:text-white transition-colors"
            onClick={() => navigate("/")}>
            <MdOutlineKeyboardBackspace size={24} />
          </button>
          <h1 className="text-xl font-bold text-white">Discover</h1>
        </div>

        {/* HINGLISH: Search bar — glassmorphism pill */}
        <div className="flex items-center gap-3 px-4 h-[48px] rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <FiSearch className="text-gray-500 flex-shrink-0" size={18} />
          <input
            type="text"
            placeholder="Search It, Find It..."
            className="w-full text-sm text-white bg-transparent outline-none placeholder:text-gray-600"
            onChange={(e) => setInput(e.target.value)}
            value={input}
          />
        </div>
      </div>

      {/* HINGLISH: Search results — input hote hi dikhta hai */}
      {input && (
        <div className="px-4 pt-3 flex flex-col gap-2">
          {searchData.length === 0 && (
            <p className="text-center py-8" style={{ color: '#6B7280' }}>No users found for "{input}"</p>
          )}
          {searchData.map((user, index) => (
            <div key={index}
              className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-white/5 transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}
              onClick={() => navigate(`/profile/${user.userName}`)}>
              {/* HINGLISH: User avatar */}
              <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0"
                style={{ border: '2px solid rgba(124,58,237,0.4)' }}>
                <img src={user.profileImage || dp} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">{user.userName}</div>
                <div className="text-xs" style={{ color: '#6B7280' }}>{user.name}</div>
              </div>
              <FollowButton
                tailwind="px-4 py-1.5 rounded-full text-xs font-semibold btn-gradient"
                targetUserId={user._id}
              />
            </div>
          ))}
        </div>
      )}

      {/* HINGLISH: Discover content — tabs + content */}
      {!input && (
        <div className="px-4 pt-4">
          {/* HINGLISH: Tab selector */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all"
                style={{
                  background: activeTab === tab ? 'linear-gradient(135deg, #7C3AED, #EC4899)' : 'rgba(255,255,255,0.05)',
                  color: activeTab === tab ? 'white' : '#9CA3AF',
                  border: activeTab === tab ? 'none' : '1px solid rgba(255,255,255,0.08)'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* HINGLISH: Trending Reels grid */}
          {(activeTab === "ForYou" || activeTab === "Trending" || activeTab === "Reels") && loopData?.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-white mb-3">Trending Reels</h2>
              <div className="grid grid-cols-3 gap-2">
                {loopData.slice(0, 6).map((loop, index) => (
                  <div key={index}
                    className="relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer hover-scale"
                    onClick={() => navigate("/loops")}>
                    <video src={loop.media} className="w-full h-full object-cover" muted />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-[10px] font-semibold truncate">{loop.author?.userName}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="#EC4899">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                        <span className="text-white text-[10px]">{loop.likes?.length || 0}</span>
                      </div>
                    </div>
                    {/* HINGLISH: Duration badge */}
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] text-white font-semibold"
                      style={{ background: 'rgba(0,0,0,0.5)' }}>
                      {index % 3 === 0 ? '0:12' : index % 3 === 1 ? '0:18' : '0:25'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HINGLISH: Popular Creators section */}
          {(activeTab === "ForYou" || activeTab === "People") && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-white mb-3">Popular Creators</h2>
              <div className="flex flex-col gap-3">
                {suggestedUsers?.slice(0, 5).map((user, index) => (
                  <div key={index}
                    className="flex items-center gap-3 p-3 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="story-ring-active flex-shrink-0">
                      <div className="w-11 h-11 rounded-full overflow-hidden" style={{ background: '#0D1117' }}>
                        <img src={user.profileImage || dp} alt="" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div className="flex-1 cursor-pointer" onClick={() => navigate(`/profile/${user.userName}`)}>
                      <div className="text-sm font-semibold text-white">{user.userName}</div>
                      <div className="text-xs" style={{ color: '#6B7280' }}>
                        {user.followers?.length || 0} followers
                      </div>
                    </div>
                    <FollowButton
                      tailwind="px-4 py-1.5 rounded-full text-xs font-semibold btn-gradient"
                      targetUserId={user._id}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HINGLISH: Posts grid (For You tab) */}
          {(activeTab === "ForYou") && postData?.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-white mb-3">Photos</h2>
              <div className="grid grid-cols-3 gap-1">
                {postData.filter(p => p.mediaType === "image").slice(0, 9).map((post, index) => (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden cursor-pointer hover-scale"
                    onClick={() => navigate(`/profile/${post.author?.userName}`)}>
                    <img src={post.media} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HINGLISH: Empty state */}
          {!loopData?.length && !suggestedUsers?.length && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-white font-semibold">Search Here...</p>
              <p className="text-sm mt-2" style={{ color: '#6B7280' }}>Find users, posts, and trending content</p>
            </div>
          )}
        </div>
      )}

      <Nav />
    </div>
  )
}

export default Search
