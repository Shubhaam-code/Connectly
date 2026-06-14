import './App.css'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/ForgotPassword'
import Home from './pages/Home'

import { Navigate, Route, Routes } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import getCurrentUser from './hooks/getCurrentUser'
export const serverUrl="http://localhost:8000"



function App() {
  getCurrentUser()
  getSuggestedUsers()
  const {userData,notificationData}=useSelector(state=>state.user)
  return (
    <Routes>
      <Route path='/signup' element={!userData?<SignUp/>:<Navigate to={"/"}/>}/>
       <Route path='/signin' element={!userData?<SignIn/>:<Navigate to={"/"}/>}/>
        <Route path='/' element={userData?<Home/>:<Navigate to={"/signin"}/>}/>
       <Route path='/forgot-password' element={!userData?<ForgotPassword/>:<Navigate to={"/"}/>}/>
        <Route path='/profile/:userName' element={userData?<Profile/>:<Navigate to={"/signin"}/>}/>
        <Route path='/story/:userName' element={userData?<Story/>:<Navigate to={"/signin"}/>}/>
    </Routes>
  )
}

export default App
