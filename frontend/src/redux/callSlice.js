import { createSlice } from "@reduxjs/toolkit";

const callSlice = createSlice({
  name: "call",
  initialState: {
    callState: "idle", // "idle" | "incoming" | "outgoing" | "connected"
    callType: "voice", // "voice" | "video"
    targetUser: null,  // { _id, userName, name, profileImage }
    callerId: null,
    isMuted: false,
    isCameraOff: false,
  },
  reducers: {
    startOutgoingCall: (state, action) => {
      const { targetUser, callType } = action.payload;
      state.callState = "outgoing";
      state.callType = callType;
      state.targetUser = targetUser;
      state.callerId = null;
      state.isMuted = false;
      state.isCameraOff = false;
    },
    receiveIncomingCall: (state, action) => {
      const { caller, callType } = action.payload;
      state.callState = "incoming";
      state.callType = callType;
      state.targetUser = caller;
      state.callerId = caller._id;
      state.isMuted = false;
      state.isCameraOff = false;
    },
    setCallConnected: (state) => {
      state.callState = "connected";
    },
    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
    },
    toggleCamera: (state) => {
      state.isCameraOff = !state.isCameraOff;
    },
    resetCall: (state) => {
      state.callState = "idle";
      state.callType = "voice";
      state.targetUser = null;
      state.callerId = null;
      state.isMuted = false;
      state.isCameraOff = false;
    }
  }
});

export const {
  startOutgoingCall,
  receiveIncomingCall,
  setCallConnected,
  toggleMute,
  toggleCamera,
  resetCall
} = callSlice.actions;

export default callSlice.reducer;
