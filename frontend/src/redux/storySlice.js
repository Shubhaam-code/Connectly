import { createSlice } from "@reduxjs/toolkit";

const storySlice = createSlice({
    name: "story",
    initialState: {
        storyData: null,
        storyList: [],     // Array of raw stories from database
        currentUserStory: null, // Latest active story of logged-in user
        viewingStory: null, // Current active story group/index being viewed
        loading: false,
        error: null
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
        },
        setViewingStory: (state, action) => {
            state.viewingStory = action.payload
        },
        addStory: (state, action) => {
            if (!state.storyList.some(s => s._id === action.payload._id)) {
                state.storyList.unshift(action.payload)
            }
        },
        deleteStoryFromState: (state, action) => {
            state.storyList = state.storyList.filter(s => s._id !== action.payload)
            if (state.currentUserStory && state.currentUserStory._id === action.payload) {
                const ownStories = state.storyList.filter(s => s.author?._id === state.currentUserStory.author?._id)
                state.currentUserStory = ownStories.length > 0 ? ownStories[0] : null
            }
        },
        setLoading: (state, action) => {
            state.loading = action.payload
        },
        setError: (state, action) => {
            state.error = action.payload
        }
    }
})

export const {
    setStoryData,
    setStoryList,
    setCurrentUserStory,
    setViewingStory,
    addStory,
    deleteStoryFromState,
    setLoading,
    setError
} = storySlice.actions

export default storySlice.reducer