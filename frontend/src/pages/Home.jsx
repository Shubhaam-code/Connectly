import React from 'react'
import LeftHome from '../components/LeftHome'
import Feed from '../components/Feed'
import RightHome from '../components/RightHome'

function Home() {
  return (
    <div className="min-h-screen" style={{ background: '#000000' }}>
      <LeftHome />
      <Feed />
      <RightHome />
    </div>
  )
}

export default Home
