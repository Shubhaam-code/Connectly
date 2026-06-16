import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiSearch, FiHeart, FiVideo } from 'react-icons/fi'
import axiosInstance from '../lib/axiosInstance'
import dp from "../assets/dp.webp"
import FollowButton from '../components/FollowButton'
import Layout from '../components/layout/Layout'
import { Avatar } from '../components/ui/UIComponents'

// HINGLISH: Search/Discover page — trending creators, reels thumbnails, aur user search
function Search() {
  const navigate = useNavigate()
  const [input, setInput] = useState("")
  const [searchData, setSearchData] = useState([])
  const [activeTab, setActiveTab] = useState("ForYou")
  
  const { suggestedUsers } = useSelector(state => state.user)
  const { postData } = useSelector(state => state.post)
  const { loopData } = useSelector(state => state.loop)

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
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8 bg-[var(--background)] text-[var(--text)] min-h-screen">
        {/* Header Title */}
        <div className="mb-6">
          <h1 className="text-xl font-bold tracking-tight">Explore</h1>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-3 px-4 h-[44px] bg-[var(--card)] border border-[var(--border)] rounded-2xl mb-8">
          <FiSearch className="text-[var(--text-secondary)] flex-shrink-0" size={18} />
          <input
            type="text"
            placeholder="Search creators, hashtags, or tags..."
            className="w-full text-xs text-[var(--text)] bg-transparent outline-none placeholder:text-[var(--text-secondary)]"
            onChange={(e) => setInput(e.target.value)}
            value={input}
          />
        </div>

        {/* Search results */}
        {input ? (
          <div className="flex flex-col gap-3">
            {searchData.length === 0 ? (
              <p className="text-center py-12 text-sm text-[var(--text-secondary)]">No users found for "{input}"</p>
            ) : (
              searchData.map((user) => (
                <div 
                  key={user._id}
                  className="flex items-center justify-between gap-3 p-3 bg-[var(--card)] border border-[var(--border)] rounded-xl hover:bg-[var(--hover)] transition-all"
                >
                  <div 
                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                    onClick={() => navigate(`/profile/${user.userName}`)}
                  >
                    <Avatar 
                      src={user.profileImage || dp} 
                      alt={user.userName} 
                      size="w-11 h-11"
                      className="bg-[var(--background)] flex-shrink-0" 
                    />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-[var(--text)]">{user.userName}</p>
                      <p className="text-[10px] text-[var(--text-secondary)]">{user.name}</p>
                    </div>
                  </div>
                  <FollowButton
                    targetUserId={user._id}
                    tailwind="px-4 py-1.5 rounded-lg text-xs font-semibold btn-gradient"
                  />
                </div>
              ))
            )}
          </div>
        ) : (
          /* Discover content tabs */
          <div>
            {/* Tab select bar */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1.5 scrollbar-none">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    activeTab === tab 
                      ? 'bg-[var(--primary)] border-[var(--primary)] text-white' 
                      : 'bg-[var(--card)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]'
                  }`}
                >
                  {tab === "ForYou" ? "For You" : tab}
                </button>
              ))}
            </div>

            {/* Trending Reels section */}
            {(activeTab === "ForYou" || activeTab === "Trending" || activeTab === "Reels") && loopData?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-1.5">
                  <FiVideo size={14} /> Trending Loops
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {loopData.slice(0, 6).map((loop, index) => (
                    <div 
                      key={loop._id || index}
                      onClick={() => navigate("/loops")}
                      className="relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer group bg-[var(--card)] border border-[var(--border)]"
                    >
                      <video src={loop.media} className="w-full h-full object-cover" muted />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                        <div className="w-full text-left min-w-0">
                          <p className="text-white text-[10px] font-bold truncate">@{loop.author?.userName}</p>
                          <span className="text-white text-[9px] flex items-center gap-1 mt-0.5">
                            <FiHeart className="fill-white stroke-none" size={10} />
                            {loop.likes?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Creators section */}
            {(activeTab === "ForYou" || activeTab === "People") && suggestedUsers?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-4">Suggested Creators</h2>
                <div className="flex flex-col gap-3">
                  {suggestedUsers.slice(0, 5).map((user) => (
                    <div 
                      key={user._id}
                      className="flex items-center justify-between gap-3 p-3 bg-[var(--card)] border border-[var(--border)] rounded-xl hover:bg-[var(--hover)] transition-all"
                    >
                      <div 
                        className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                        onClick={() => navigate(`/profile/${user.userName}`)}
                      >
                        <Avatar 
                          src={user.profileImage || dp} 
                          alt={user.userName} 
                          size="w-11 h-11"
                          className="bg-[var(--background)] flex-shrink-0"
                        />
                        <div className="truncate">
                          <p className="text-xs font-semibold text-[var(--text)]">{user.userName}</p>
                          <p className="text-[10px] text-[var(--text-secondary)]">{user.followers?.length || 0} followers</p>
                        </div>
                      </div>
                      <FollowButton
                        targetUserId={user._id}
                        tailwind="px-4 py-1.5 rounded-lg text-xs font-semibold btn-gradient"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photos feed grid */}
            {activeTab === "ForYou" && postData?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-4">Trending Photos</h2>
                <div className="grid grid-cols-3 gap-2">
                  {postData.filter(p => p.mediaType === "image").slice(0, 9).map((post, index) => (
                    <div 
                      key={post._id || index} 
                      className="aspect-square bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden cursor-pointer group relative"
                      onClick={() => navigate(`/profile/${post.author?.userName}`)}
                    >
                      <img 
                        src={post.media} 
                        alt="" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-semibold">
                        <span className="flex items-center gap-1.5 text-xs"><FiHeart size={14} className="fill-white stroke-none" /> {post.likes?.length || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Search
