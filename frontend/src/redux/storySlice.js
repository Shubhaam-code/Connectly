import { createSlice } from "@reduxjs/toolkit"

// FIX: Changed name from "post" to "story" (was incorrectly named "post").
// This collision with postSlice's name:post could cause Redux DevTools confusion.
// FIX: Changed storyList initialState from null to [] for safe array operations.
const storySlice = createSlice({
    name: "story",
    initialState: {
        storyData: null,
        storyList: [],     // FIX: was null — caused crashes on .map() calls
        currentUserStory: null
    },
    reducers: {
        setStoryData: (state, action) => {
            state.storyData = action.payload
        },
        setStoryList: (state, action) => {
            state.storyList = action.payload
        },
        setCurrentUserStory: (state, action) => {
            state.currentUserStory = action.payload
        }
    }
})

export const { setStoryData, setStoryList, setCurrentUserStory } = storySlice.actions
export default storySlice.reducer