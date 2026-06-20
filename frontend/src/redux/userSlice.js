import { createSlice } from "@reduxjs/toolkit"
const userSlice=createSlice({
    name:"user",
    initialState:{
        userData:null,
        suggestedUsers:null,
        profileData:null,
        following:[],
        searchData:null,
        notificationData:[],
        isAuthChecking:true
    },
    reducers:{
       setUserData:(state,action)=>{
        state.userData=action.payload
       } ,
       setSuggestedUsers:(state,action)=>{
        state.suggestedUsers=action.payload
       } ,
       setProfileData:(state,action)=>{
        state.profileData=action.payload
       } ,
       setSearchData:(state,action)=>{
        state.searchData=action.payload
       },
        setNotificationData:(state,action)=>{
        state.notificationData=action.payload
       },
       setFollowing:(state,action)=>{
        state.following=action.payload
       },
       setAuthChecking:(state,action)=>{
        state.isAuthChecking=action.payload
       },
       toggleFollow:(state,action)=>{
        const { targetUserId, currentUser } = action.payload
        const targetIdStr = targetUserId?.toString()
        const currentUserId = currentUser?._id?.toString()
        const isFollowing = state.following.some(id => id?.toString() === targetIdStr)
        
        if (isFollowing) {
            // Unfollow
            state.following = state.following.filter(id => id?.toString() !== targetIdStr)
            
            // Update profileData followers if we are viewing the target user's profile
            if (state.profileData && state.profileData._id?.toString() === targetIdStr) {
                state.profileData.followers = (state.profileData.followers || []).filter(
                    f => (f._id || f).toString() !== currentUserId
                )
            }
            
            // Update profileData following if we are viewing our own profile
            if (state.profileData && state.profileData._id?.toString() === currentUserId) {
                state.profileData.following = (state.profileData.following || []).filter(
                    f => (f._id || f).toString() !== targetIdStr
                )
            }

            // Update suggestedUsers followers
            if (state.suggestedUsers) {
                state.suggestedUsers = state.suggestedUsers.map(user => {
                    if (user._id?.toString() === targetIdStr) {
                        return {
                            ...user,
                            followers: (user.followers || []).filter(f => (f._id || f).toString() !== currentUserId)
                        }
                    }
                    return user
                })
            }
        } else {
            // Follow
            if (!state.following.some(id => id?.toString() === targetIdStr)) {
                state.following.push(targetIdStr)
            }
            
            // Update profileData followers if we are viewing the target user's profile
            if (state.profileData && state.profileData._id?.toString() === targetIdStr) {
                const exists = (state.profileData.followers || []).some(
                    f => (f._id || f).toString() === currentUserId
                )
                if (!exists) {
                    state.profileData.followers = [
                        ...(state.profileData.followers || []),
                        currentUser
                    ]
                }
            }
            
            // Update profileData following if we are viewing our own profile
            if (state.profileData && state.profileData._id?.toString() === currentUserId) {
                const exists = (state.profileData.following || []).some(
                    f => (f._id || f).toString() === targetIdStr
                )
                if (!exists) {
                    state.profileData.following = [
                        ...(state.profileData.following || []),
                        { _id: targetIdStr }
                    ]
                }
            }

            // Update suggestedUsers followers
            if (state.suggestedUsers) {
                state.suggestedUsers = state.suggestedUsers.map(user => {
                    if (user._id?.toString() === targetIdStr) {
                        const exists = (user.followers || []).some(f => (f._id || f).toString() === currentUserId)
                        return {
                            ...user,
                            followers: exists ? user.followers : [...(user.followers || []), currentUser]
                        }
                    }
                    return user
                })
            }
        }
       }
    }

})

export const {setUserData,setSuggestedUsers,setProfileData,toggleFollow,setFollowing,setSearchData,setNotificationData,setAuthChecking}=userSlice.actions
export default userSlice.reducer