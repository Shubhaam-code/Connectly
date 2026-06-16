import React from 'react'
import Layout from '../components/layout/Layout'
import Feed from '../components/Feed'
import RightHome from '../components/RightHome'

function Home() {
  return (
    <Layout>
      <div className="flex justify-center w-full max-w-[950px] mx-auto min-h-screen pt-4 px-4 bg-[var(--background)]">
        <div className="flex-1 max-w-[600px] w-full">
          <Feed />
        </div>
        <RightHome />
      </div>
    </Layout>
  )
}

export default Home
