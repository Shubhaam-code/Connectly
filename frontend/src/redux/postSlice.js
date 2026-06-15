import { createSlice } from "@reduxjs/toolkit"

// FIX: Changed initialState.postData from null to [] (empty array).
// Multiple places do [...postData, newPost] which throws if postData is null.
const postSlice = createSlice({
    name: "post",
    initialState: {
        postData: [],
    },
    reducers: {
        setPostData: (state, action) => {
            state.postData = action.payload
        }
    }
})

export const { setPostData } = postSlice.actions
export default postSlice.reducer