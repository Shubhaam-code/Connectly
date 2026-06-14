import React from 'react'
import LeftHome from '../components/LeftHome'
import Feed from '../components/Feed'

// HINGLISH: Home page — sidebar + feed ka layout
function Home() {
  return (
    <div className="w-full flex" style={{ background: '#0D1117', minHeight: '100vh' }}>
      {/* HINGLISH: Desktop sidebar — sirf lg+ screens pe dikhega */}
      <LeftHome />
      {/* HINGLISH: Main feed content */}
      <Feed />
    </div>
  )
}

export default Home
