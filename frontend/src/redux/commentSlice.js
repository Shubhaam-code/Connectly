import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  comments: [],
  loading: false,
  error: null,
};

const commentSlice = createSlice({
  name: "comment",
  initialState,
  reducers: {
    setComments: (state, action) => {
      state.comments = action.payload;
    },
    addComment: (state, action) => {
      state.comments.push(action.payload);
    },
    updateComment: (state, action) => {
      const index = state.comments.findIndex(
        (c) => c._id === action.payload._id
      );
      if (index !== -1) {
        state.comments[index] = action.payload;
      }
    },
    deleteComment: (state, action) => {
      state.comments = state.comments.filter(
        (c) => c._id !== action.payload
      );
    },
    addReply: (state, action) => {
      const comment = state.comments.find(
        (c) => c._id === action.payload.commentId
      );
      if (comment) {
        if (!comment.replies) comment.replies = [];
        comment.replies.push(action.payload.reply);
      }
    },
    likeComment: (state, action) => {
      const comment = state.comments.find(
        (c) => c._id === action.payload.commentId
      );
      if (comment) {
        if (!comment.likes) comment.likes = [];
        comment.likes.push(action.payload.userId);
      }
    },
    unlikeComment: (state, action) => {
      const comment = state.comments.find(
        (c) => c._id === action.payload.commentId
      );
      if (comment && comment.likes) {
        comment.likes = comment.likes.filter(
          (id) => id !== action.payload.userId
        );
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setComments,
  addComment,
  updateComment,
  deleteComment,
  addReply,
  likeComment,
  unlikeComment,
  setLoading,
  setError,
} = commentSlice.actions;

export default commentSlice.reducer;
